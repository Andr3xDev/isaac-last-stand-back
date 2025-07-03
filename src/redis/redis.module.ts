import { Module } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces';
import { createClient } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisClientFactory: FactoryProvider = {
    provide: REDIS_CLIENT,
    useFactory: async () => {
        const client = createClient({
            url: process.env.REDIS_URL,
        });
        await client.connect();
        return client;
    },
};

@Module({
    providers: [redisClientFactory],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}
