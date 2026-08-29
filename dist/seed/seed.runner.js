"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const seed_service_1 = require("./seed.service");
async function runSeed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const seedService = app.get(seed_service_1.SeedService);
    await seedService.seedAll();
    await app.close();
    console.log('✅ Seeding completed!');
    process.exit(0);
}
runSeed();
//# sourceMappingURL=seed.runner.js.map