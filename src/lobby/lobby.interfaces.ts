export interface Player {
    id: string;
    name: string;
    isReady: boolean;
}

export interface Lobby {
    id: string;
    hostId: string;
    players: Record<string, Player>;
    status: 'waiting' | 'countdown' | 'in-game';
}
