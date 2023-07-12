import { CustomWebSocket, IIndex, Request } from '../types/index';
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

export const getValueByXY = (gameId: number, index: number, x: number, y: number): string | undefined => {
    const data = gameSession.find((data) => data.gameId === gameId && data.indexPlayer === index);
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
                        gameBoard[y][x] = 'killed';
                        for (let i = -1; i <= 1; i++) {
                            for (let j = -1; j <= 1; j++) {
                                if (x + i >= 0 && x + i < gameBoard[y].length && y + j >= 0 && y + j < gameBoard.length) {
                                    attackPlayer(x + i, y + j, index,'miss');
                                }
                            }
                        }
                        return 'killed';
                    case 'medium':
                        if (x + 1 < gameBoard[y].length && gameBoard[y][x + 1] === 'shot') {
                            gameBoard[y][x] = 'killed';
                            for (let i = -1; i <= 1; i++) {
                                for (let j = -1; j <= 1; j++) {
                                    if (x + i >= 0 && x + i < gameBoard[y].length && y + j >= 0 && y + j < gameBoard.length) {
                                        attackPlayer(x + i, y + j, index,'miss');
                                    }
                                }
                            }
                            attackPlayer(x + 1, y, index, 'killed');
                            return 'killed';
                        }
                        if (x - 1 >= 0 && gameBoard[y][x - 1] === 'shot') {
                            gameBoard[y][x] = 'killed';
                            attackPlayer(x - 1, y, index, 'killed');
                            for (let i = -1; i <= 1; i++) {
                                for (let j = -1; j <= 1; j++) {
                                    if (x + i >= 0 && x + i < gameBoard[y].length && y + j >= 0 && y + j < gameBoard.length) {
                                        attackPlayer(x + i, y + j, index,'miss');
                                    }
                                }
                            }
                            return 'killed';
                        }
                        if (y + 1 < gameBoard.length && gameBoard[y + 1][x] === 'shot') {
                            gameBoard[y][x] = 'killed';
                            attackPlayer(x, y + 1, index, 'killed');
                            for (let i = -1; i <= 1; i++) {
                                for (let j = -1; j <= 1; j++) {
                                    if (x + i >= 0 && x + i < gameBoard[y].length && y + j >= 0 && y + j < gameBoard.length) {
                                        attackPlayer(x + i, y + j, index,'miss');
                                    }
                                }
                            }
                            return 'killed';
                        }
                        if (y - 1 >= 0 && gameBoard[y - 1][x] === 'shot') {
                            gameBoard[y][x] = 'killed';
                            attackPlayer(x, y - 1, index, 'killed');
                            for (let i = -1; i <= 1; i++) {
                                for (let j = -1; j <= 1; j++) {
                                    if (x + i >= 0 && x + i < gameBoard[y].length && y + j >= 0 && y + j < gameBoard.length) {
                                        attackPlayer(x + i, y + j, index,'miss');
                                    }
                                }
                            }
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
                console.log(indexes);
            });
        }
      }
};



export const startGame = (ws: CustomWebSocket, receivedMessage: Request) => {
    try {
        const { gameId, ships, indexPlayer } = JSON.parse(receivedMessage.data);
        const updatedIndexPlayer = indexes.find((data:IIndex) => data.idGame === gameId && data.idPlayer !== indexPlayer);
        const updatedMessage: Request = {
            type: 'start_game',
            data: JSON.stringify({
                ships,
                currentPlayerIndex: indexPlayer,
            }),
            id: 0,
        };
        ws.send(JSON.stringify(updatedMessage));
        placeShip(gameId, updatedIndexPlayer!.idPlayer, ships);
        // console.log(updatedIndexPlayer);
        // console.log(gameSession);
        // gameSession.forEach((print) => console.table(print.gameBoard));
    } catch (error) {
        console.error('Error occurred in startGame:', error);
    }
};

export const userAttack = (ws: CustomWebSocket, receivedMessage: Request) => {
    const { gameId, x, y, indexPlayer } = JSON.parse(receivedMessage.data);

    const status = getValueByXY(gameId, indexPlayer, x, y);
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
        console.log(client.index);
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