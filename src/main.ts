import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { InventoryService } from './modules/inventory/inventory.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global exception filter — consistent error shape for all errors
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
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

  // Seed all 8 blood group inventory rows on startup
  const inventoryService = app.get(InventoryService);
  await inventoryService.initializeInventory();

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const os = await import('os');
  const localIP = Object.values(os.networkInterfaces())
    .flat()
    .find((iface) => iface?.family === 'IPv4' && !iface.internal)?.address ?? 'your-local-ip';

  console.log(`\n🩸 Blood Donation API: http://localhost:${port}/api`);
  console.log(`🌐 Network Access:     http://${localIP}:${port}/api`);
  console.log(`🔐 Auth: POST /api/auth/register | POST /api/auth/login`);
  console.log(`📊 Dashboard: GET /api/dashboard/stats  (Admin JWT required)`);
}
bootstrap();