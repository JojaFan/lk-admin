import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger("HTTP");

    use = (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        res.on("finish", () => {
            const ms = Date.now() - start;
            const user = (req as any).user;
            const who = user ? ` user=${user.id ?? "?"} role=${user.role ?? "?"}` : "";

            this.logger.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)${who}`);
        });

        next();
    };
}