import { nextPlayer } from '../../..';
import { CustomWebSocket, Request } from '../../types';

export const turnUserWithBot = (ws:CustomWebSocket, idGame:number) => {
    const checkLastStep = (idGame: number) => {
        const player = nextPlayer.find((player) => player.idGame === idGame);
        if (player && player.lastSteps.length > 0) {
          const lastStep = player.lastSteps[player.lastSteps.length - 1];
          return lastStep;
        } else {
          console.log(`No last step found for game ${idGame}`);
        }
      };
    const currentPlayer = checkLastStep(idGame);
    const updatedMessage: Request = {
        type: 'turn',
        data: JSON.stringify({
            currentPlayer: currentPlayer,
        }),
        id: 0,
    };
    ws.send(JSON.stringify(updatedMessage));
};