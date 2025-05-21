import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module'; // Assuming AppModule will be in app/app.module.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Add any global configurations here (e.g., pipes, interceptors, port)
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap(); 