import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LobbyService } from './lobby.service';
import { Player } from './lobby.interfaces';
import { CreateLobbyDto } from './dtos/create-lobby.dto';
import { JoinLobbyDto } from './dtos/join-lobby.dto';
import { SetReadyDto } from './dtos/set-ready.dto';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
})
export class LobbyGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly socketToLobby = new Map<string, string>();

    constructor(private readonly lobbyService: LobbyService) {}

    async handleDisconnect(client: Socket) {
        console.log(`[Gateway] Cliente desconectado: ${client.id}`);
        const lobbyId = this.socketToLobby.get(client.id);

        if (lobbyId) {
            const updatedLobby = await this.lobbyService.removePlayer(
                lobbyId,
                client.id,
            );
            this.socketToLobby.delete(client.id);

            if (updatedLobby) {
                this.server.to(lobbyId).emit('lobbyState', updatedLobby);
            }
        }
    }

    @SubscribeMessage('createLobby')
    async handleCreateLobby(
        @MessageBody() payload: CreateLobbyDto,
        @ConnectedSocket() client: Socket,
    ) {
        console.log(`[Gateway] Recive 'createLobby' de ${payload.name}`);
        const host: Player = {
            id: client.id,
            name: payload.name,
            isReady: false,
        };
        const lobby = await this.lobbyService.createLobby(host);

        client.join(lobby.id);
        this.socketToLobby.set(client.id, lobby.id);

        client.emit('lobbyState', lobby);
    }

    @SubscribeMessage('joinLobby')
    async handleJoinLobby(
        @MessageBody() payload: { lobbyId: string; name?: string },
        @ConnectedSocket() client: Socket,
    ) {
        console.log(`[Gateway] Recive 'joinLobby' to lobby ${payload.lobbyId}`);

        const playerName =
            payload.name || `Player_${client.id.substring(0, 10)}`;

        const player: Player = {
            id: client.id,
            name: playerName,
            isReady: false,
        };
        const lobby = await this.lobbyService.joinLobby(
            payload.lobbyId,
            player,
        );

        if (lobby) {
            client.join(lobby.id);
            this.socketToLobby.set(client.id, lobby.id);
            this.server.to(lobby.id).emit('lobbyState', lobby);
        } else {
            client.emit('error', {
                message: 'No se pudo unir al lobby. No existe o está lleno.',
            });
        }
    }

    @SubscribeMessage('setReady')
    async handleSetReady(
        @MessageBody() payload: SetReadyDto,
        @ConnectedSocket() client: Socket,
    ) {
        console.log(
            `[Gateway] Recibido 'setReady' de ${client.id} a ${payload.isReady}`,
        );
        const lobby = await this.lobbyService.setPlayerReady(
            payload.lobbyId,
            client.id,
            payload.isReady,
        );

        if (lobby) {
            this.server.to(payload.lobbyId).emit('lobbyState', lobby);
        }
    }

    @SubscribeMessage('startGame')
    async handleStartGame(
        @MessageBody() payload: { lobbyId: string },
        @ConnectedSocket() client: Socket,
    ) {
        console.log(
            `[Gateway] Recibido 'startGame' para lobby ${payload.lobbyId} por ${client.id}`,
        );
        const lobby = await this.lobbyService.getLobby(payload.lobbyId);

        if (lobby && lobby.hostId === client.id) {
            const allReady = Object.values(lobby.players).every(
                (p) => p.isReady,
            );
            if (!allReady) {
                client.emit('error', {
                    message: 'No todos los jugadores están listos.',
                });
                return;
            }

            const startedGameLobby = await this.lobbyService.startGame(
                payload.lobbyId,
            );
            if (startedGameLobby) {
                this.server
                    .to(payload.lobbyId)
                    .emit('gameStarting', startedGameLobby);
            }
        } else {
            client.emit('error', {
                message: 'Solo el host puede iniciar la partida.',
            });
        }
    }

    @SubscribeMessage('getLobbies')
    async handleGetLobbies(@ConnectedSocket() client: Socket) {
        console.log(`[Gateway] Recive 'getLobbies' de ${client.id}`);
        try {
            const publicLobbies = await this.lobbyService.getLobbies();
            client.emit('lobbiesList', publicLobbies);
        } catch (error) {
            console.error('[Gateway] Error getting lobbies:', error);
            client.emit('error', {
                message: 'Cant get any lobbies.',
            });
        }
    }
}
