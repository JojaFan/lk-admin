import { Module } from "@nestjs/common";
import { AdminShopController } from "./admin-shop.controller";
import { AdminShopService } from "./admin-shop.service";

@Module({
    controllers: [AdminShopController],
    providers: [AdminShopService],
})
export class AdminShopModule {}