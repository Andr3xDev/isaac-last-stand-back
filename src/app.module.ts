import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { LobbyModule } from './lobby/lobby.module';
import { LobbyGateway } from './lobby/lobby.gateway';
import { LobbyService } from './lobby/lobby.service';
import { CacheModule } from '@nestjs/cache-manager';
import { cacheConfig } from './config/cache.config';

@Module({
    imports: [
        CacheModule.registerAsync({
            useFactory: () => cacheConfig,
            isGlobal: true,
        }),
        RedisModule,
        LobbyModule,
    ],
    controllers: [],
    providers: [LobbyService, LobbyGateway],
})
export class AppModule {}
