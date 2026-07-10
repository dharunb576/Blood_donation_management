import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { InventoryService } from './modules/inventory/inventory.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

let cachedApp: NestExpressApplication;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const inventoryService = app.get(InventoryService);
  await inventoryService.initializeInventory();

  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(req: any, res: any) {
  if (!cachedApp) await bootstrap();
  cachedApp.getHttpAdapter().getInstance()(req, res);
}

// Local dev
if (!process.env.VERCEL) {
  bootstrap().then((app) => {
    const port = process.env.PORT ?? 3000;
    app.listen(port);
    console.log(`\n🩸 Blood Donation API: http://localhost:${port}/api`);
    console.log(`🔐 Auth: POST /api/auth/register | POST /api/auth/login`);
    console.log(`📊 Dashboard: GET /api/dashboard/stats  (Admin JWT required)`);
  });
}