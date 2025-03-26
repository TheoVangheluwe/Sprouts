import React, { useState } from 'react';
import GameBoard from '../components/game/GameBoard';
import WaitingRoom from '../components/game/WaitingRoom'; // Assurez-vous que le chemin est correct

const GamePage = () => {
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [gameId, setGameId] = useState(null);

  const handleMultiplayerClick = () => {
    setIsMultiplayer(true);
    setInWaitingRoom(true);
    // Logique pour rejoindre la salle d'attente et obtenir gameId
    // Par exemple, via une requête à votre backend
    fetch('/api/join-game')
      .then(response => response.json())
      .then(data => {
        setGameId(data.game_id);
      })
      .catch(error => console.error('Error joining game:', error));
  };

  const handleLocalPlayClick = () => {
    setIsMultiplayer(false);
  };

  return (
    <div>
      {!isMultiplayer && !inWaitingRoom && (
        <div>
          <button onClick={handleLocalPlayClick}>Jouer en local</button>
          <button onClick={handleMultiplayerClick}>Jouer en multijoueur</button>
        </div>
      )}
      {inWaitingRoom && gameId && <WaitingRoom gameId={gameId} />}
      {!inWaitingRoom && isMultiplayer && <GameBoard />}
      {!isMultiplayer && <GameBoard />}
    </div>
  );
};

export default GamePage;
