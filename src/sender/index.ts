import { CustomWebSocket, Request } from '../types/index.js';
import { registerPlayer } from '../data/index.js';
import { players } from '../data/index.js';
import { wsclients } from '../../index.js';


export const sendToAllClients = (message: Request, wsclients:CustomWebSocket[]) =>{
    wsclients.forEach((client) => {
        client.send(JSON.stringify(message));
    });
};
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

export const createGame = (ws:CustomWebSocket ) => {
    const updatedMessage : Request = {
        type: 'create_game',
        data: JSON.stringify({
            idGame: players[0].index,
            idPlayer: ws.index
        }),
        id: 0,
    };
    sendToAllClients(updatedMessage, wsclients);
};

export const updateRoom = () => {
    const roomUsers = players.map((player) => ({
        name: player.name,
        index: player.index,
      }));
    const rooms = JSON.stringify([{
        roomId: 1,
        roomUsers: roomUsers,
      }]);
      
    const updatedMessage : Request = {
        type: 'update_room',
        data: rooms,
        id: 0,
    };
    sendToAllClients(updatedMessage, wsclients);
};