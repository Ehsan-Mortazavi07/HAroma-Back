import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { createServer, type Server } from 'http';
import type { Request, Response } from 'express';
import { join } from 'path';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ConsultationChatGateway } from './consultation-chat/consultation-chat.gateway';

/**
 * Vercel needs the actual Node HTTP server exported for WebSocket upgrades.
 * Nest's default Express adapter creates a separate server internally, so keep
 * the pre-created server (the function export) attached to Nest's Express app.
 */
class VercelExpressAdapter extends ExpressAdapter {
  constructor(private readonly functionServer: Server) {
    super();
    this.setHttpServer(functionServer);
    functionServer.on('request', this.getInstance());
  }

  initHttpServer() {
    this.setHttpServer(this.functionServer);
  }
}

async function createApplication(httpAdapter?: ExpressAdapter) {
  const app = httpAdapter
    ? await NestFactory.create<NestExpressApplication>(AppModule, httpAdapter, { bodyParser: false })
    : await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService);
  const allowedOrigins = configService.getOrThrow<string>('CORS_ORIGINS').split(',');
  const trustProxyHops = configService.getOrThrow<number>('TRUST_PROXY_HOPS');

  // Trust only the explicitly configured number of reverse-proxy hops so
  // request IPs used by rate limiting cannot be spoofed via X-Forwarded-For.
  app.set('trust proxy', trustProxyHops);

  // Global prefix
  app.setGlobalPrefix('v1');

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS.'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Browser sessions use an HttpOnly cookie, so reject unsafe cross-origin
  // requests that attempt to authenticate with that cookie (CSRF protection).
  const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  app.use((request, response, next) => {
    const sessionCookie = request.headers.cookie
      ?.split(';')
      .some((part) => part.trim().startsWith('hatefaroma_token='));
    if (!sessionCookie || !unsafeMethods.has(request.method)) {
      next();
      return;
    }

    const origin = request.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
      response.status(403).json({ message: 'درخواست معتبر نیست.' });
      return;
    }
    next();
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (configService.get<string>('NODE_ENV') === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Static files for uploaded images
  app.useStaticAssets(join(process.cwd(), 'public/uploads'), {
    prefix: '/uploads/',
  });

  await app.init();
  await app.get(ConsultationChatGateway).initializeMongoAdapter();
  return app;
}

let vercelApplication: Promise<NestExpressApplication> | undefined;
const vercelSocketServer = process.env.VERCEL ? createServer() : undefined;
const vercelAdapter = vercelSocketServer ? new VercelExpressAdapter(vercelSocketServer) : undefined;

if (vercelAdapter) {
  // Keep requests queued until Nest has installed its routes and Socket.IO
  // gateway on the exported server. Vercel invokes the function after import,
  // while Nest's module initialization completes asynchronously.
  vercelAdapter.use((_request: unknown, response: any, next: () => void) => {
    if (!vercelApplication) {
      response.status(503).json({ message: 'سرویس در حال راه‌اندازی است.' });
      return;
    }
    void vercelApplication.then(() => next()).catch(() => {
      if (!response.headersSent) {
        response.status(503).json({ message: 'راه‌اندازی سرویس ناموفق بود.' });
      }
    });
  });
  vercelApplication = createApplication(vercelAdapter).catch((error: unknown) => {
    const logger = new Logger('HatefAroma-Bootstrap');
    logger.error('Failed to initialize the Vercel HTTP and WebSocket server.', error instanceof Error ? error.stack : undefined);
    throw error;
  });
}

async function vercelHandler(request: Request, response: Response): Promise<void> {
  vercelApplication ??= createApplication();
  const app = await vercelApplication;
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(request, response);
}

export default (vercelSocketServer || vercelHandler);

async function bootstrap() {
  const logger = new Logger('HatefAroma-Bootstrap');
  const app = await createApplication();
  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');
  logger.log(`🌿 HatefAroma Backend running on: http://127.0.0.1:${port}/v1`);
}

if (!process.env.VERCEL) {
  void bootstrap();
}
