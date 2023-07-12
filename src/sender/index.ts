import { CustomWebSocket, IIndex, Request } from '../types/index';
import { addIndex, firstPlayerMessage, indexes, placeShip, registerPlayer, resetFirstPlayer, resetRoomUsers } from '../data/index';
import { roomRegister } from '../data/index';
import {getValueByXY} from '../game/index';

import { players } from '../data/index';
import { wsclients } from '../../index';
import { roomUsers } from '../data/index';





export const sendToAllClients = (message: Request, wsclients:CustomWebSocket[]) =>{
    wsclients.forEach((client) => {
        client.send(JSON.stringify(message));
    });
};

const getPlayerNameByIndex = (index: string): string => {
    const player = players.find((player) => player.index === index);
    if (player) {
      return player.name;
    } else {
      throw new Error(`Player not found with index ${index}`);
    }
  };

// const getMatrixByIndex = (index: number): Ship[] => {
//     const data = gameSession.find((data) => data.indexPlayer === index);
//     if (data) {
//         console.table(data.gameBoard);
//         return data.gameBoard;
//     } else {
//         throw new Error(`Matrix not found with index ${index}`);
//     }
// };


export const userRegistration = (receivedMessage: Request, ws:CustomWebSocket) => {
    const {name, password} = JSON.parse(receivedMessage.data);
    const existingPlayer = players.find((player) => player.name === name);
    if (existingPlayer){
        const updatedMessage : Request = {
            type: 'reg',
            data: JSON.stringify({
                name,
                index: ws.index,
                error: true,
                errorText: 'Player already exists',
            }),
            id: 0,
        };

        ws.send(JSON.stringify(updatedMessage));
    } else {
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
        console.log(`Client ${ws.index} register: player name - ${name}`);
    }
};

export const updateRoom = (ws:CustomWebSocket, roomId: number) => {
    if (roomUsers.length === 0) {
        const name = getPlayerNameByIndex(ws.index);
        roomRegister(name, ws.index);
        const rooms = JSON.stringify([{
            roomId: roomId,
            roomUsers: roomUsers,
        }]);
        
        const updatedMessage : Request = {
            type: 'update_room',
            data: rooms,
            id: 0,
        };
        sendToAllClients(updatedMessage, wsclients);
        console.log(`Create room N${ws.index}`);
    }
};

export const createGame = (ws:CustomWebSocket, idGame:number, idPlayer:number) => {
    if (roomUsers.length === 1) {
        const name = getPlayerNameByIndex(ws.index);
        const isIndexRegistered = roomUsers.some((user) => user.index === ws.index);
        if (!isIndexRegistered) {
            roomRegister(name, ws.index);
            const filteredClients = wsclients.filter((client) => roomUsers.some((user) => 
            user.index === client.index));
            resetRoomUsers();
            filteredClients.forEach((client) => {
                addIndex(idGame, idPlayer, client.index); 
                const updatedMessage: Request = {
                    type: 'create_game',
                    data: JSON.stringify({
                    idGame: idGame,
                    idPlayer: idPlayer,
                    }),
                    id: 0,
                };
                idPlayer++;
                client.send(JSON.stringify(updatedMessage));
            });
        }
      }
};

export const addMatrix = (receivedMessage: Request) => {
    try {
        const { gameId, ships, indexPlayer } = JSON.parse(receivedMessage.data);
        const updatedIndexPlayer = indexes.find((data: IIndex) => data.idGame === gameId && data.idPlayer !== indexPlayer);
        if (updatedIndexPlayer) {
            placeShip(gameId, updatedIndexPlayer.idPlayer, ships);
        } else {
            console.error('Could not find updatedIndexPlayer');
        }
    } catch (error) {
        console.error('Error occurred in startGame:', error);
    }
};


export const startGame = (ws: CustomWebSocket, receivedMessage: Request) => {
    const { gameId, ships, indexPlayer } = JSON.parse(receivedMessage.data);
    const filteredClients = wsclients.filter((client) => {
        const playerIndex = indexes.find((user) => user.idGame === gameId && user.index === client.index);
        return playerIndex !== undefined;
    });
    console.log(filteredClients);
    if (firstPlayerMessage.length === 0) {
        firstPlayerMessage.push(receivedMessage);
    } else {
        const firstPlayerData = indexes.find((data) => data.idGame === gameId && data.index === ws.index);
        if (firstPlayerData) {
            const firstPlayerMessageToSend: Request = {
                type: 'start_game',
                data: JSON.stringify({
                    ships,
                    currentPlayerIndex: JSON.parse(firstPlayerMessage[0].data).indexPlayer,
                }),
                id: 0,
            };
            console.log(firstPlayerMessageToSend);
            ws.send(JSON.stringify(firstPlayerMessageToSend));
        }
        const secondPlayerData = indexes.find((data) => data.idGame === gameId && data.index !== ws.index);
        if (secondPlayerData) {
            const updatedMessage: Request = {
                type: 'start_game',
                data: JSON.stringify({
                    ships: JSON.parse(firstPlayerMessage[0].data).ships,
                    currentPlayerIndex: indexPlayer,
                }),
                id: 0,
            };
            console.log(updatedMessage);
            filteredClients.forEach((client) => {
                client.send(JSON.stringify(updatedMessage));
            });
        }
        resetFirstPlayer();
    }
};




export const userAttack = (receivedMessage: Request) => {
    const { gameId, x, y, indexPlayer } = JSON.parse(receivedMessage.data);

    const status = getValueByXY(gameId, indexPlayer, x, y);
    // turnUser(receivedMessage, status);
    const filteredClients = wsclients.filter((client) => {
        const playerIndex = indexes.find((user) => user.idGame === gameId && user.index === client.index);
        return playerIndex !== undefined;
    });
    filteredClients.forEach((client) => {
        const updatedMessage: Request = {
            type: 'attack',
            data: JSON.stringify({
                position: {
                    x: x,
                    y: y,
                },
                currentPlayer: indexPlayer,
                status: status,
            }),
            id: 0,
        };
        client.send(JSON.stringify(updatedMessage));
        console.log(`Attack in game: ${gameId} player: ${indexPlayer}.`);
    });
};

export const attackPlayer = (x: number, y: number, indexPlayer: number, status: string) => {
    const data = indexes.find((user) => user.idPlayer === indexPlayer);
    if (!data) {
        return;
    }
    const gameId = data.idGame;

    const filteredClients = wsclients.filter((client) => {
        const playerIndex = indexes.find((user) => user.idGame === gameId && user.index === client.index);
        return playerIndex !== undefined;
    });
    filteredClients.forEach((client) => {
        const updatedMessage: Request = {
            type: 'attack',
            data: JSON.stringify({
                position: {
                    x: x,
                    y: y,
                },
                currentPlayer: indexPlayer,
                status: status,
            }),
            id: 0,
        };
        client.send(JSON.stringify(updatedMessage));
    });};



export const turnUser = (receivedMessage:Request, status = 'start') => {
    const {indexPlayer } = JSON.parse(receivedMessage.data);
    const data = indexes.find((user) => user.idPlayer === indexPlayer);
    if (!data) {
        return;
    }
    const gameId = data.idGame;
    const indexesByGameId = indexes.filter((item) => item.idGame === gameId);
    const gamePlayers = indexesByGameId.map((item) => item.idPlayer);
    let randomPlayer:any;
    if (status === 'miss' || status === 'killed'){
        randomPlayer = indexPlayer;
        console.log(status);
    } else {
        const randomIndex = Math.floor(Math.random() * gamePlayers.length);
        randomPlayer = gamePlayers[randomIndex];
        console.log(randomPlayer);
        console.log('other');
        return randomPlayer;
    }
    const dataIndex = indexes.find((user) => user.idPlayer === randomPlayer);
    if (!dataIndex) {
      return;
    }
    const randomPlayerIndex = dataIndex.index;
    

    const filteredClients = wsclients.filter((client) => {
        const playerIndex = indexes.find((user) => user.idGame === gameId && user.index === client.index);
        return playerIndex !== undefined;
    });

    filteredClients.forEach((client) => {
        if (client.index === randomPlayerIndex) {
            const updatedMessage: Request = {
                type: 'turn',
                data: JSON.stringify({
                    currentPlayer: randomPlayer,
                }),
                id: 0,
            };
            client.send(JSON.stringify(updatedMessage));
        }
    });
};