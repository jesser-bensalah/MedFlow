import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    // Temporarily disable forbidNonWhitelisted to see if that's causing the issue
    forbidNonWhitelisted: false,
    transform: true,
    // Enable detailed error messages
    disableErrorMessages: false,
    // Enable auto-transformation of payloads
    transformOptions: {
      enableImplicitConversion: true,
    },
    // Detailed error formatting
    exceptionFactory: (errors) => {
      const result = errors.map((error) => ({
        property: error.property,
        value: error.value,
        constraints: error.constraints,
      }));
      console.error('Validation errors:', JSON.stringify(result, null, 2));
      return new Error(JSON.stringify(result));
    },
  }));

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  await app.listen(3001);
  console.log('Backend MedFlow démarré sur http://localhost:3001');
}
bootstrap();