import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function runSeed() {
  process.env.RUN_SEED_ON_START = 'true';
  console.log('Starting catalog data seeding...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  await app.close();
  console.log('Catalog data seeding completed.');
}

runSeed().catch((err) => {
  console.error('Catalog seeding failed:', err);
  process.exit(1);
});
