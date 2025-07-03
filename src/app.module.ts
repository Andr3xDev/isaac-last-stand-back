import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { LobbyModule } from './lobby/lobby.module';
import { LobbyGateway } from './lobby/lobby.gateway';
import { LobbyService } from './lobby/lobby.service';

@Module({
    imports: [RedisModule, LobbyModule],
    controllers: [],
    providers: [LobbyService, LobbyGateway],
})
export class AppModule {}
