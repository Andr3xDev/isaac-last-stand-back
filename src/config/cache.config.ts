import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

export const cacheConfig: CacheModuleOptions = {
    store: redisStore,
    host: process.env.REDIS_HOST,
    port: 6379,
    ttl: 3600000,
    max: 1000,
};
