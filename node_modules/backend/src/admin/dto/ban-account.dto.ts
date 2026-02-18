import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class BanAccountDto {
    @IsOptional()
    @IsString()
    @MaxLength(200)
    reason?: string;

    // Будем принимать удобные значения из UI
    @IsIn(['15m', '30m', '60m', '1h', '1d', '7d', '30d', 'forever'])
    duration!: '15m' | '30m' | '60m' | '1h' | '1d' | '7d' | '30d' | 'forever';
}