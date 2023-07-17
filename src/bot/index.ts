import { CustomWebSocket, Request } from '../types/index';
import { addIndex, placeShip, roomUsers }from '../data/index';


import { ships2 } from '../data/ships';

import { updateRooms } from '../sender/updater';

export const playWithBot = (receivedMessage: Request, ws:CustomWebSocket) => {
    const idGame = 0;
    const botName = 'bot';
    const botIndex = 'bot';
    addIndex(idGame, botName, botIndex);
    const existingRoomIndex = roomUsers.findIndex((room) => room.roomUsers.some((user) => user.index === ws.index));
    if (existingRoomIndex !== -1) {
        roomUsers.splice(existingRoomIndex, 1);
        console.log(`Room with user index ${ws.index} already exists. Deleting the room.`);
        updateRooms();
      }
    const info = JSON.stringify({
        idGame: idGame,
        idPlayer: ws.index,
    });

    const response = {
        type: 'create_game',
        data: info,
        id: 0,
    };
    addIndex(idGame, ws.index, ws.index);
    ws.send(JSON.stringify(response));
    placeShip(idGame, ws.index, ships2);
};