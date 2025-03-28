import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OnlineCanvas from './OnlineCanvas';

function OnlineGame() {
    const { gameId } = useParams();
    const [gameState, setGameState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerId, setPlayerId] = useState(null);

    useEffect(() => {
        const fetchPlayerIdAndGameState = async () => {
            try {
                const playerResponse = await fetch('/api/join-game');
                const playerData = await playerResponse.json();
                if (playerResponse.ok) {
                    setPlayerId(playerData.player_id);
                } else {
                    console.error("Failed to fetch player ID:", playerData.error);
                }

                const gameResponse = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/state/`);
                const gameData = await gameResponse.json();
                if (gameResponse.ok) {
                    setGameState(gameData.state);
                    setCurrentPlayer(gameData.currentPlayer);
                } else {
                    console.error("Failed to fetch game state:", gameData.error);
                }
            } catch (error) {
                console.error("Error fetching player ID and game state:", error);
            }
        };

        fetchPlayerIdAndGameState();

        // Ajouter un intervalle de mise à jour de l'état du jeu pour synchroniser avec les autres joueurs
        const intervalId = setInterval(async () => {
            try {
                const gameResponse = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/state/`);
                const gameData = await gameResponse.json();
                if (gameResponse.ok) {
                    setGameState(gameData.state);
                    setCurrentPlayer(gameData.currentPlayer);
                } else {
                    console.error("Failed to fetch game state:", gameData.error);
                }
            } catch (error) {
                console.error("Error fetching game state:", error);
            }
        }, 2000); // Mettre à jour toutes les 2 secondes

        return () => clearInterval(intervalId);
    }, [gameId]);

    const handleMove = async (move) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/move/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(move)
            });

            const data = await response.json();

            if (response.ok) {
                setGameState(data.state);
                setCurrentPlayer(data.currentPlayer);
            } else {
                console.error("Failed to make move:", data.error);
            }
        } catch (error) {
            console.error("Error making move:", error);
        }
    };

    return (
        <div>
            <h1>Jeu en Ligne</h1>
            {gameState && (
                <OnlineCanvas
                    points={gameState.points}
                    setPoints={(newPoints) => setGameState(prevState => ({ ...prevState, points: newPoints }))}
                    curves={gameState.curves}
                    setCurves={(newCurves) => setGameState(prevState => ({ ...prevState, curves: newCurves }))}
                    currentPlayer={currentPlayer}
                    myTurn={currentPlayer === playerId}
                    onMove={handleMove}
                />
            )}
        </div>
    );
}

export default OnlineGame;