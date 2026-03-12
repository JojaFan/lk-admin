import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { AdminShopService } from "./admin-shop.service";

@Controller("admin/shop")
export class AdminShopController {
    constructor(private readonly shop: AdminShopService) {}

    @Get("products")
    async list() {
        const items = await this.shop.list();
        return { ok: true, items };
    }

    @Post("products")
    async create(@Body() body: any) {
        const itemId = Number(body.itemId);
        const stackCount = Number(body.stackCount ?? 1);
        const price = Number(body.price ?? 0);

        if (!Number.isFinite(itemId) || itemId <= 0) return { ok: false, error: "itemId is required" };
        if (!Number.isFinite(stackCount) || stackCount <= 0) return { ok: false, error: "stackCount must be > 0" };
        if (!Number.isFinite(price) || price < 0) return { ok: false, error: "price must be >= 0" };

        const r = await this.shop.create({
            itemId,
            stackCount,
            price,
            isEnabled: body.isEnabled !== false,
            sortOrder: Number(body.sortOrder ?? 0),
        });
        return { ok: true, id: r.id };
    }

    @Patch("products/:id")
    async update(@Param("id", ParseIntPipe) id: number, @Body() body: any) {
        await this.shop.update(id, {
            itemId: body.itemId !== undefined ? Number(body.itemId) : undefined,
            stackCount: body.stackCount !== undefined ? Number(body.stackCount) : undefined,
            price: body.price !== undefined ? Number(body.price) : undefined,
            isEnabled: body.isEnabled !== undefined ? Boolean(body.isEnabled) : undefined,
            sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
        });
        return { ok: true };
    }

    @Delete("products/:id")
    async remove(@Param("id", ParseIntPipe) id: number) {
        return this.shop.remove(id);
    }
}