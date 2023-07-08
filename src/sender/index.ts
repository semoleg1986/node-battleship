import { CustomWebSocket, Request } from '../types/index.js';
import { registerPlayer } from '../data/index.js';

export const userRegistration = (receivedMessage: Request, ws:CustomWebSocket) => {
    const {name, password} = JSON.parse(receivedMessage.data);
    const updatedMessage : Request = {
    type: 'reg',
    data: JSON.stringify({
        name,
        index: ws.index,
        error: false,
        errorText: '',
    }),
    id: 0,
};
    ws.send(JSON.stringify(updatedMessage));
    registerPlayer(name, password, ws.index);
};

export const createGame = (ws: CustomWebSocket) => {
    const updatedMessage : Request = {
        type: 'create_game',
        data: JSON.stringify({
            idGame: ws.index,
            idPlayer: ws.index
        }),
        id: 0,
    };
    ws.send(JSON.stringify(updatedMessage));
};