import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function createInitialAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    await app.get(SeedService).seedInitialAdmin();
  } finally {
    await app.close();
  }
}

createInitialAdmin().catch((error: unknown) => {
  console.error('Initial administrator setup failed.');
  console.error(error instanceof Error ? error.message : 'Unexpected setup error.');
  process.exitCode = 1;
});
