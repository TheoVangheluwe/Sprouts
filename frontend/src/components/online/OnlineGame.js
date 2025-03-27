import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OnlineCanvas from './OnlineCanvas';

function OnlineGame() {
    const { gameId } = useParams();
    const [gameState, setGameState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerId, setPlayerId] = useState(null);

    useEffect(() => {
        const fetchPlayerId = async () => {
            try {
                const response = await fetch('/api/join-game');
                const data = await response.json();
                if (response.ok) {
                    setPlayerId(data.player_id);
                    console.log("Player ID fetched:", data.player_id);
                } else {
                    console.error("Failed to fetch player ID:", data.error);
                }
            } catch (error) {
                console.error("Error fetching player ID:", error);
            }
        };

        fetchPlayerId();
    }, []);

    useEffect(() => {
        const fetchGameState = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/state/`);
                const data = await response.json();
                if (response.ok) {
                    console.log("Game state fetched:", data);
                    setGameState(data.state);
                    setCurrentPlayer(data.currentPlayer);
                } else {
                    console.error("Failed to fetch game state:", data.error);
                }
            } catch (error) {
                console.error("Error fetching game state:", error);
            }
        };

        fetchGameState();
    }, [gameId]);

    const handleMove = async (move) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/move/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ move }) // Assurez-vous que move est un objet JSON valide
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Move response:", data);

                // Vérifiez que `curves` est un tableau avant de l'utiliser
                const curves = Array.isArray(data.state.curve) ? data.state.curve : [];

                // Mise à jour de l'état du jeu avec les nouvelles courbes et points
                setGameState(prevState => ({
                    ...prevState,
                    points: move.type === 'place_point' ? [...prevState.points, move.point] : prevState.points,
                    curves: move.type === 'draw_curve' ? [...prevState.curves, ...curves] : prevState.curves,
                    state: data.state,
                    currentPlayer: data.currentPlayer
                }));
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