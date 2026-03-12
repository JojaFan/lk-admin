import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // ✅ trust proxy для корректного IP
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance();

    // Express имеет .set(), Fastify — нет (поэтому проверяем)
    if (typeof instance.set === 'function') {
        instance.set('trust proxy', true);
    }

    app.use(cookieParser());

    await app.listen(3000);
}

bootstrap();