import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import cookieParser from 'cookie-parser';
import 'dotenv/config';


async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser()); // ✅ ОБЯЗАТЕЛЬНО

    // если у тебя фронт на 5173, а бэк на 3000 (без прокси) — включи CORS:
   // app.enableCors({
       // origin: 'http://localhost:5173',
       // credentials: true,
 //   });

    await app.listen(3000);
}
bootstrap();