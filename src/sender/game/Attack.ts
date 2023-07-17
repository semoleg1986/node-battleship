import { turnUser } from '../main';
import { nextPlayer, removePlayerById } from '../../..';
import { addLastToList, killedList, players, removeDuplicatePlayers, removeGameSessionByGameId, removeIndexByGameId, removeKilledDataByIdPlayer, updatePlayerWins } from '../../data';
import { getValueByXY } from '../../game';
import { CustomWebSocket, Request } from '../../types';
import { filterClientsByIndex, getPlayerNameByIndex } from '../../utils';
import { turnUserWithBot } from '../game/WhoMv';
import { updateWinners } from '../updater';

export const userAttack = (ws: CustomWebSocket, receivedMessage: Request) => {
    const { gameId, x, y, indexPlayer } = JSON.parse(receivedMessage.data);
    if (gameId===0){
        const checkLastStep = (idGame: number) => {
            const player = nextPlayer.find((player) => player.idGame === idGame);
            if (player && player.lastSteps.length > 0) {
              const lastStep = player.lastSteps[player.lastSteps.length - 1];
              return lastStep;
            } else {
              console.log(`No last step found for game ${idGame}`);
            }
          };
        if (ws.index===checkLastStep(gameId)) {
            const status = getValueByXY(gameId, indexPlayer, x, y, 'attack');
            const currentPlayer:string = (status === 'miss') ? 'bot' : ws.index;
            addLastToList(gameId, currentPlayer);
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
            ws.send(JSON.stringify(updatedMessage));
            turnUserWithBot(ws, gameId);
            const player = killedList.find((player) => player.idPlayer === indexPlayer);
    
            if (player) {
              if (player.ships.length === 10) {
                removePlayerById(gameId);
                removeKilledDataByIdPlayer(ws.index);
                removeGameSessionByGameId(gameId);
                removeIndexByGameId(gameId);
                const updatedMessage: Request = {
                    type: 'finish',
                    data: JSON.stringify({
                        winPlayer: indexPlayer,
                    }),
                    id: 0,
                };
                ws.send(JSON.stringify(updatedMessage));
                const name = getPlayerNameByIndex(indexPlayer);  
                updatePlayerWins(name, players);
                const transformedPlayers = players
                .filter((player) => player.wins > 0)
                .map((player) => {
                  return {
                    name: player.name,
                    wins: player.wins,
                  };
                });

                const updatedMessage2: Request = {
                    type: 'update_winners',
                    data: JSON.stringify(transformedPlayers),
                    id: 0,
                };
                ws.send(JSON.stringify(updatedMessage2));}}
                updateWinners();

        }
        if ('bot'===checkLastStep(gameId)){
            const x =  Math.floor(Math.random() * 10);
            const y =  Math.floor(Math.random() * 10);
            const status = getValueByXY(gameId, 'bot', x, y, 'attack');
            const currentPlayer = (status === 'miss') ? ws.index : 'bot';
            addLastToList(gameId, currentPlayer);
            const updatedMessage: Request = {
                type: 'attack',
                data: JSON.stringify({
                    position: {
                        x: x,
                        y: y,
                    },
                    currentPlayer: 'bot',
                    status: status,
                }),
                id: 0,
            };
            setTimeout(() => ws.send(JSON.stringify(updatedMessage)), 1000);
            turnUserWithBot(ws, gameId); 
            if (status==='shot'){
                const x =  Math.floor(Math.random() * 10);
                const y =  Math.floor(Math.random() * 10);
                const status = getValueByXY(gameId, 'bot', x, y, 'attack');
                const currentPlayer = (status === 'miss') ? ws.index : 'bot';
                addLastToList(gameId, currentPlayer);
                const updatedMessage: Request = {
                    type: 'attack',
                    data: JSON.stringify({
                        position: {
                            x: x,
                            y: y,
                        },
                        currentPlayer: 'bot',
                        status: status,
                    }),
                    id: 0,
                };
                setTimeout(() => ws.send(JSON.stringify(updatedMessage)), 2500);
                turnUserWithBot(ws, gameId); 
            }
        }
    } else {
        removeDuplicatePlayers();
        const checkLastStep = (idGame: number) => {
            const player = nextPlayer.find((player) => player.idGame === idGame);
            if (player && player.lastSteps.length > 0) {
              const lastStep = player.lastSteps[player.lastSteps.length - 1];
              return lastStep;
            } else {
              console.log(`No last step found for game ${idGame}`);
            }
          };
        if (indexPlayer===checkLastStep(gameId)) {
            const status = getValueByXY(gameId, indexPlayer, x, y, 'attack');
            turnUser(receivedMessage, status);
            const filteredClients= filterClientsByIndex(gameId);
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
            const player = killedList.find((player) => player.idPlayer === indexPlayer);
    
            if (player) {
              if (player.ships.length === 10) {
                removePlayerById(gameId);
                filteredClients.forEach((client) => {
                    removeKilledDataByIdPlayer(client.index);
                    removeGameSessionByGameId(gameId);
                    removeIndexByGameId(gameId);
                    const updatedMessage: Request = {
                        type: 'finish',
                        data: JSON.stringify({
                            winPlayer: indexPlayer,
                        }),
                        id: 0,
                    };
                    client.send(JSON.stringify(updatedMessage));
                });
                const name = getPlayerNameByIndex(indexPlayer);  
                updatePlayerWins(name, players);
                const transformedPlayers = players
                .filter((player) => player.wins > 0)
                .map((player) => {
                  return {
                    name: player.name,
                    wins: player.wins,
                  };
                });
              
                filteredClients.forEach((client) => {
                    const updatedMessage: Request = {
                        type: 'update_winners',
                        data: JSON.stringify(transformedPlayers),
                        id: 0,
                    };
                    client.send(JSON.stringify(updatedMessage));
                });
                updateWinners();
              }
            } 
        }
    }

};