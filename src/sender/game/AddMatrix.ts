import { checkAttack, killedList, placeShip } from '../../data';
import { CustomWebSocket, IKilled, Request } from '../../types';
import { findUpdatedIndexPlayer } from '../../utils';
import { turnUser } from '../main';

export const addMatrix = (ws:CustomWebSocket, receivedMessage: Request) => {
    try {
        const { gameId, ships, indexPlayer } = JSON.parse(receivedMessage.data);
        if (gameId===0){
            const status = 'shot';
            console.log('game with bot');
            placeShip(gameId, 'bot', ships);
            const updatedMessage: Request = {
                type: 'start_game',
                data: JSON.stringify({
                    ships: ships,
                    currentPlayerIndex: indexPlayer,
                }),
                id: 0,
            };
            turnUser(receivedMessage, status);
            ws.send(JSON.stringify(updatedMessage));
            // setTimeout(() => BotShips(ws), 1000);
        } else {
            const updatedIndexPlayer = findUpdatedIndexPlayer(gameId, indexPlayer);
            if (updatedIndexPlayer) {
                const player: IKilled = {idPlayer: updatedIndexPlayer.idPlayer, ships:[]};
                killedList.push(player);
                placeShip(gameId, updatedIndexPlayer.idPlayer, ships);
                checkAttack(gameId, updatedIndexPlayer.idPlayer, ships);
            } else {
                console.error('Could not find updatedIndexPlayer');
            }
        }
    } catch (error) {
        console.error('Error occurred in startGame:', error);
    }
};