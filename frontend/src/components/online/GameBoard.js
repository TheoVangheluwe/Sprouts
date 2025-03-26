import React, { useState, useEffect } from 'react';
import Canvas from './Canvas';
import { calculateNextMove, updateGameState } from './Utils';

function GameBoard({ gameState, currentPlayer, myTurn, onMove }) {
    const [localGameState, setLocalGameState] = useState(gameState);
    const [currentMove, setCurrentMove] = useState(null);

    useEffect(() => {
        setLocalGameState(gameState);
    }, [gameState]);

    const handleMove = (move) => {
        onMove(move);
    };

    const draw = (context, options) => {
        // Logique pour dessiner l'état du jeu actuel sur le canvas
        // Peut-être différent pour le jeu en ligne
        // Implémentez toute logique spécifique au jeu en ligne ici
    };

    return (
        <Canvas
            draw={draw}
            options={{
                onClick: handleMove,
                width: 800,
                height: 600,
            }}
            points={localGameState.points}
            setPoints={(points) => setLocalGameState({ ...localGameState, points })}
            curves={localGameState.curves}
            setCurves={(curves) => setLocalGameState({ ...localGameState, curves })}
            currentPlayer={currentPlayer}
            myTurn={myTurn}
            onMove={handleMove}
        />
    );
}

export default GameBoard;