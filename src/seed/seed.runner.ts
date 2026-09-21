import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function runSeed() {
  console.log('🌱 Launching HatefAroma Database Seeder & Recovery...');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  await app.close();
  console.log('✨ All seed collections & default accounts successfully updated!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
