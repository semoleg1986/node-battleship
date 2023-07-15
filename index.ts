import { httpServer } from './src/http_server/index';
import { WebSocketServer } from 'ws';
import {v4 as uuid} from 'uuid';

import { CustomWebSocket, INextPlayer, Request,  } from './src/types/index';
import { userRegistration, updateRoom, startGame, userAttack, addMatrix, createGame } from './src/sender/index';


const HTTP_PORT = 8181;
export const wsclients:CustomWebSocket[] = [];
export const nextPlayer:INextPlayer[] = [];

let idGame = 0;
let roomId = 0;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws:CustomWebSocket)=>{

  const id: string = uuid();
  ws.index = id; 
  wsclients.push(ws);
  console.log(`New WS client ${id}`);
  const numberOfClients = wss.clients.size;
  console.log(`Numbers of clients: ${numberOfClients} at this moment`);
  ws.on('message', (message: string)=>{
    const receivedMessage = JSON.parse(message);
    const {type}:Request = receivedMessage;
    switch (type){
      case 'reg':
        userRegistration(receivedMessage, ws);
        break;
      case 'create_room':
        roomId++;
        updateRoom(ws, roomId);
        break;
      case 'add_user_to_room':
        idGame++;
        createGame(ws, idGame, receivedMessage);
        break;
      case 'add_ships':
        addMatrix(receivedMessage);
        startGame(ws, receivedMessage);
        break;
      case 'attack':
        userAttack(receivedMessage);
        break;
      default:
        console.log(`Uknown message type ${type}`);
        break;
    }
  });
  ws.on('close', () => {
    console.log(`Disconnect client ${id}`);
    const numberOfClients = wss.clients.size;
    console.log(`Numbers of clients: ${numberOfClients} at this moment`);
    const index = wsclients.indexOf(ws);
    if (index !== -1) {
      wsclients.splice(index, 1);
    }
  });
});



