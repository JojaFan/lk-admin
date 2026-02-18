export type Role = 'admin' | 'support' | 'user';

export type JwtPayload = {id: number; login: string; role: Role;};

export type JwtUser = JwtPayload;