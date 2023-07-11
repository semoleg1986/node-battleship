import { CustomWebSocket, Request } from '../types/index';
import { addIndex, indexes, placeShip, registerPlayer, resetRoomUsers } from '../data/index';
import { roomRegister } from '../data/index';

import { players } from '../data/index';
import { wsclients } from '../../index';
import { gameSession } from '../data/index';
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

export const getValueByXY = (index: number, x: number, y: number): string | undefined => {
    const data = gameSession.find((data) => data.indexPlayer === index);
    if (data) {
        const gameBoard = data.gameBoard;
        if (gameBoard[y] && gameBoard[y][x]) {
            if (gameBoard[y][x] !== 'empty') {
                switch (gameBoard[y][x]) {
                    case 'miss':
                        return 'miss';
                    case 'shot':
                        return 'shot';
                    case 'killed':
                        return 'killed';
                    case 'small':
                        gameBoard[y][x]='killed';
                        if (x + 1 < gameBoard[y].length) {
                            attackPlayer(x + 1, y, index);
                        }
                        if (x - 1 >= 0) {
                            attackPlayer(x - 1, y, index);
                        }
                        if (y + 1 < gameBoard.length) {
                            attackPlayer(x, y + 1, index);
                        }
                        if (y - 1 >= 0) {
                            attackPlayer(x, y - 1, index);
                        }
                        if (x + 1 < gameBoard[y].length && y + 1 < gameBoard.length) {
                            attackPlayer(x + 1, y + 1, index);
                        }
                        if (x + 1 < gameBoard[y].length && y - 1 >= 0) {
                            attackPlayer(x + 1, y - 1, index);
                        }
                        if (x - 1 >= 0 && y + 1 < gameBoard.length) {
                            attackPlayer(x - 1, y + 1, index);
                        }
                        if (x - 1 >= 0 && y - 1 >= 0) {
                            attackPlayer(x - 1, y - 1, index);
                        }
                        return 'killed';
                    case 'medium':
                        if (
                            (x + 1 < gameBoard[y].length && gameBoard[y][x + 1] === 'shot') ||
                            (x - 1 >= 0 && gameBoard[y][x - 1] === 'shot')
                        ){
                            return 'killed';
                        }
                        if (
                            y + 1 < gameBoard.length &&
                            y - 1 >= 0 &&
                            ((y + 1 < gameBoard.length && gameBoard[y + 1][x] === 'shot') || (y - 1 >= 0 && gameBoard[y - 1][x] === 'shot'))
                        ) {
                            return 'killed';
                        }
                        
                        console.log(gameBoard[y][x]);
                        break;
                    case 'large':
                        console.log(gameBoard[y][x]);
                        break;
                    case 'huge':
                        console.log(gameBoard[y][x]);
                        break;
                    default:
                        throw new Error(`${gameBoard[y][x]}`);
                }
                gameBoard[y][x]='shot';
                return 'shot';
            }
            else {
                gameBoard[y][x]='miss';
                return 'miss';
            }
        }
    }
    return undefined;
};

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
    }
};

export const updateRoom = (ws:CustomWebSocket) => {
    if (roomUsers.length === 0) {
        const name = getPlayerNameByIndex(ws.index);
        roomRegister(name, ws.index);
        const rooms = JSON.stringify([{
            roomId: ws.index,
            roomUsers: roomUsers,
        }]);
        
        const updatedMessage : Request = {
            type: 'update_room',
            data: rooms,
            id: 0,
        };
        sendToAllClients(updatedMessage, wsclients);
    }
};

export const createGame = (ws:CustomWebSocket, idGame:number) => {
    let playerId = 0;
    if (roomUsers.length === 1) {
        const name = getPlayerNameByIndex(ws.index);
        const isIndexRegistered = roomUsers.some((user) => user.index === ws.index);
        if (!isIndexRegistered) {
            roomRegister(name, ws.index);
            const filteredClients = wsclients.filter((client) => roomUsers.some((user) => 
            user.index === client.index));
            filteredClients.forEach((client) => {
            playerId++;
            addIndex(playerId, client.index); 
            const updatedMessage: Request = {
                type: 'create_game',
                data: JSON.stringify({
                idGame: idGame,
                idPlayer: playerId,
                }),
                id: 0,
            };
            client.send(JSON.stringify(updatedMessage));
            resetRoomUsers();
            });
        }
      }
};



export const startGame = (ws: CustomWebSocket, receivedMessage: Request) => {
    try {
        const { gameId, ships, indexPlayer } = JSON.parse(receivedMessage.data);
        let updatedIndexPlayer: number;
        switch (indexPlayer) {
            case 1:
                updatedIndexPlayer = 2;
                break;
            case 2:
                updatedIndexPlayer = 1;
                break;
            default:
                throw new Error(`Invalid indexPlayer: ${indexPlayer}`);
        }
        const updatedMessage: Request = {
            type: 'start_game',
            data: JSON.stringify({
                ships,
                currentPlayerIndex: indexPlayer,
            }),
            id: 0,
        };
        ws.send(JSON.stringify(updatedMessage));
        placeShip(gameId, updatedIndexPlayer, ships);
        // gameSession.forEach((print) => console.table(print.gameBoard));
    } catch (error) {
        console.error('Error occurred in startGame:', error);
    }
};

export const userAttack = (ws: CustomWebSocket, receivedMessage: Request) => {
    const { x, y, indexPlayer } = JSON.parse(receivedMessage.data);

    const status = getValueByXY(indexPlayer, x, y);
    const filteredClients = wsclients.filter((client) => indexes.some((user) => user.index === client.index));
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
    });
};

export const attackPlayer = (x: number, y: number, indexPlayer: number) => {
    const filteredClients = wsclients.filter((client) => indexes.some((user) => user.index === client.index));
    filteredClients.forEach((client) => {
        const updatedMessage: Request = {
            type: 'attack',
            data: JSON.stringify({
                position: {
                    x: x,
                    y: y,
                },
                currentPlayer: indexPlayer,
                status: 'miss',
            }),
            id: 0,
        };
        client.send(JSON.stringify(updatedMessage));
    });};



export const turnUser = (ws: CustomWebSocket, receivedMessage:Request) => {
    const filteredClients = wsclients.filter((client) => indexes.some((user) => user.index === client.index));
    const {indexPlayer } = JSON.parse(receivedMessage.data);
    filteredClients.forEach((client) => {
        const updatedMessage: Request = {
            type: 'turn',
            data: JSON.stringify({
                currentPlayer: indexPlayer,
            }),
            id:0,
        };
        client.send(JSON.stringify(updatedMessage));
        });
};