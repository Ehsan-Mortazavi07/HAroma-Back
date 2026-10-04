type Environment = Record<string, unknown>;

const DEFAULT_DEVELOPMENT_ORIGINS = ['http://localhost:7732', 'http://127.0.0.1:7732'];

export function validateEnvironment(environment: Environment): Environment {
  const nodeEnv = String(environment.NODE_ENV || 'development');
  const port = Number(environment.PORT || 7731);
  const mongoUri = String(environment.MONGODB_URI || '').trim();
  const jwtSecret = String(environment.JWT_SECRET || '');
  const jwtExpiresIn = String(environment.JWT_EXPIRES_IN || '1d');
  const trustProxyHops = Number(environment.TRUST_PROXY_HOPS || 0);
  const originsValue = String(environment.CORS_ORIGINS || environment.FRONTEND_URL || '');

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 10) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 10.');
  }
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required.');
  }
  if (jwtSecret.length < 32 || /change.?me|your.?jwt|example|replace|generate|placeholder|sample/i.test(jwtSecret)) {
    throw new Error('JWT_SECRET must be a strong random secret of at least 32 characters.');
  }
  if (!/^\d+(s|m|h|d)$/.test(jwtExpiresIn)) {
    throw new Error('JWT_EXPIRES_IN must use a value such as 15m, 12h, or 1d.');
  }

  const origins = [...new Set(originsValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean))];

  if (nodeEnv === 'production' && origins.length === 0) {
    throw new Error('CORS_ORIGINS must contain the exact public frontend origin in production.');
  }
  if (
    nodeEnv === 'production' &&
    !mongoUri.startsWith('mongodb+srv://') &&
    !/[?&](tls|ssl)=true(?:&|$)/i.test(mongoUri)
  ) {
    throw new Error('Production MongoDB connections must use TLS.');
  }

  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
    if (parsed.origin !== origin || (nodeEnv === 'production' && parsed.protocol !== 'https:')) {
      throw new Error('CORS_ORIGINS must contain origins only; production origins must use HTTPS.');
    }
  }

  return {
    ...environment,
    NODE_ENV: nodeEnv,
    PORT: port,
    MONGODB_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    TRUST_PROXY_HOPS: trustProxyHops,
    CORS_ORIGINS: origins.length ? origins.join(',') : DEFAULT_DEVELOPMENT_ORIGINS.join(','),
  };
}
