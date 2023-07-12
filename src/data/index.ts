import { IGameSession, IIndex, IRoomUsers, Ship } from '../types';

class Player {
    name: string;
    password: string;
    index: string;
    wins: number;
  
    constructor(name: string, password: string, index: string) {
      this.name = name;
      this.password = password;
      this.index = index;
      this.wins = 0;
    }
  }

export const players: Player[] = [];

export const gameSession: IGameSession[] = [];

export const roomUsers: IRoomUsers[] = [];

export const indexes:IIndex[] = [];

export function playerExists(name: string): boolean {
    return players.some((player) => player.name === name);
  }
export const roomRegister = (name: string, index: string): IRoomUsers => {
  const newPlayer: IRoomUsers = { name, index };
  roomUsers.push(newPlayer);

  return newPlayer;
};

export const addIndex = (idGame:number, idPlayer: number, index: string): IIndex => {
  const newPlayer: IIndex = { idGame, idPlayer, index };
  indexes.push(newPlayer);
  return newPlayer;
};

export function resetRoomUsers(): void {
  roomUsers.length = 0;
}
export function removeFirstTwoPlayers(): void {
  roomUsers.splice(0, 2);
}

export function registerPlayer(name: string, password: string, index: string) {
    if (playerExists(name)) {
      return { index: -1, error: true, errorText: 'Player already exists' };
    }
  
    const newPlayer = new Player(name, password, index);
    players.push(newPlayer);

    return {
        index,
        error: false,
        errorText: '',
    };
  }
export const ChangeMatrix = (x:number, y:number) =>{
  console.log(x,y);
};
export const placeShip = (gameId:number,indexPlayer:number,ships:Ship[]) => {
    const gridSize = 10;
    const gameBoard = new Array(gridSize);

    for (let i = 0; i < gridSize; i++) {
        gameBoard[i] = new Array(gridSize).fill('empty');
    }

    ships.forEach((ship: Ship) => {
        const { position, direction, type, length } = ship;
        const { x, y } = position;

        if (direction) {
        for (let i = y; i < y + length; i++) {
            gameBoard[i][x] = type;
            }
        } else {
        for (let i = x; i < x + length; i++) {
            gameBoard[y][i] = type;
            }
        }
    });
    const gameDataStorage = {
        gameId,
        indexPlayer,
        gameBoard,
      };
      gameSession.push(gameDataStorage);
    };
  