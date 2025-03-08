import('dotenv/config');

export const PORT: number = parseInt(process.env.PORT!, 10) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const SESSION_SECRET = process.env.SESSION_SECRET! || 'cat_foo';
export const CACHE_TTL: number = Number(process.env.CACHE_TTL) || 600;
