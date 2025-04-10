import React, { useState } from 'react';
import GameBoard from '../components/game/GameBoard';
import WaitingRoom from '../components/game/WaitingRoom';

const GamePage = () => {
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [inWaitingRoom, setInWaitingRoom] = useState(false);

  const handleMultiplayerClick = () => {
    setIsMultiplayer(true);
    setInWaitingRoom(true);
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
      {inWaitingRoom && <WaitingRoom setInWaitingRoom={setInWaitingRoom} />}
      {!inWaitingRoom && isMultiplayer && <GameBoard />}
      {!isMultiplayer && <GameBoard />}
    </div>
  );
};

export default GamePage;
