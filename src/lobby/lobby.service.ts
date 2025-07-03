// src/lobby/lobby.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { nanoid } from 'nanoid';
import { Lobby, Player } from './lobby.interfaces';

@Injectable()
export class LobbyService {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: RedisClientType,
    ) {}

    private getKey(lobbyId: string): string {
        return `lobby:${lobbyId}`;
    }

    async getLobby(lobbyId: string): Promise<Lobby | null> {
        const lobbyData = await this.redis.get(this.getKey(lobbyId));
        return lobbyData ? (JSON.parse(lobbyData) as Lobby) : null;
    }

    async createLobby(host: Player): Promise<Lobby> {
        let lobbyId: string;
        let lobbyExists = true;

        do {
            lobbyId = nanoid(5).toUpperCase();
            const existingLobby = await this.getLobby(lobbyId);
            if (!existingLobby) {
                lobbyExists = false;
            }
        } while (lobbyExists);

        const newLobby: Lobby = {
            id: lobbyId,
            hostId: host.id,
            players: { [host.id]: host },
            status: 'waiting',
        };

        await this.redis.set(this.getKey(lobbyId), JSON.stringify(newLobby));
        console.log(`[LobbyService] Lobby CREADO con código corto: ${lobbyId}`);
        return newLobby;
    }

    async joinLobby(lobbyId: string, player: Player): Promise<Lobby | null> {
        const lobby = await this.getLobby(lobbyId);

        if (!lobby) return null;
        if (lobby.players[player.id]) return lobby;
        if (Object.keys(lobby.players).length >= 10) return null;

        lobby.players[player.id] = player;
        await this.redis.set(this.getKey(lobbyId), JSON.stringify(lobby));
        console.log(`[LobbyService] Ingreso}`);
        return lobby;
    }

    async removePlayer(
        lobbyId: string,
        playerId: string,
    ): Promise<Lobby | null> {
        const lobby = await this.getLobby(lobbyId);
        if (!lobby || !lobby.players[playerId]) return lobby;

        delete lobby.players[playerId];

        if (Object.keys(lobby.players).length === 0) {
            await this.redis.del(this.getKey(lobbyId));
            return null;
        }

        if (lobby.hostId === playerId) {
            lobby.hostId = Object.keys(lobby.players)[0];
        }

        await this.redis.set(this.getKey(lobbyId), JSON.stringify(lobby));
        return lobby;
    }

    async setPlayerReady(
        lobbyId: string,
        playerId: string,
        isReady: boolean,
    ): Promise<Lobby | null> {
        const lobby = await this.getLobby(lobbyId);
        if (lobby?.players[playerId]) {
            lobby.players[playerId].isReady = isReady;
            await this.redis.set(this.getKey(lobbyId), JSON.stringify(lobby));
            return lobby;
        }
        return null;
    }

    async startGame(lobbyId: string): Promise<Lobby | null> {
        const lobby = await this.getLobby(lobbyId);
        if (lobby) {
            lobby.status = 'in-game';
            await this.redis.set(this.getKey(lobbyId), JSON.stringify(lobby));
            return lobby;
        }
        return null;
    }
}
