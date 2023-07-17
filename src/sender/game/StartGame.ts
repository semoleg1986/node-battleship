import { turnUser } from '../main';
import { wsclients } from '../../..';
import { firstPlayerMessage, resetFirstPlayer } from '../../data';
import { CustomWebSocket, Request } from '../../types/index';

export const startGame = (ws: CustomWebSocket, receivedMessage: Request) => {
    const { idGame, ships, indexPlayer } = JSON.parse(receivedMessage.data);
    const status = 'miss';
    if (idGame === 0){
        console.log('start_bot');
    } else {
        if (firstPlayerMessage.length === 0) {
            firstPlayerMessage.push(receivedMessage);
        } else {
            const filteredClient = wsclients.find((client) => client.index === JSON.parse(firstPlayerMessage[0].data).indexPlayer);
            if (filteredClient) {
                const updatedMessage: Request = {
                    type: 'start_game',
                    data: JSON.stringify({
                        ships: JSON.parse(firstPlayerMessage[0].data).ships,
                        currentPlayerIndex: JSON.parse(firstPlayerMessage[0].data).indexPlayer,
                    }),
                    id: 0,
                };
                filteredClient.send(JSON.stringify(updatedMessage));
                const firstPlayerMessageToSend: Request = {
                    type: 'start_game',
                    data: JSON.stringify({
                        ships,
                        currentPlayerIndex: indexPlayer,
                    }),
                    id: 0,
                };
                ws.send(JSON.stringify(firstPlayerMessageToSend));
                turnUser(receivedMessage, status);
                resetFirstPlayer();
              } else {
                console.log('Client has not found');
              }
        }
    }

};