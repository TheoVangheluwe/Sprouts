import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OnlineCanvas from './OnlineCanvas';
import { ToastContainer } from "react-toastify";

function OnlineGame() {
    const { gameId } = useParams();
    const [gameState, setGameState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerId, setPlayerId] = useState(null);

    // Ajoutons un état dédié pour les points et les courbes
    const [points, setPoints] = useState([]);
    const [curves, setCurves] = useState([]);

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

                // Mettre à jour les points et courbes avec les données du serveur
                if (gameData.points && gameData.points.length > 0) {
                    console.log("Setting points from server:", gameData.points);
                    setPoints(gameData.points);
                } else {
                    // Si le serveur n'a pas de points, initialisez les points de base
                    const initialPoints = [
                        { x: 385.6, y: 366.5, connections: 0, label: 'A' },
                        { x: 168.7, y: 491.73, connections: 0, label: 'B' },
                        { x: 168.7, y: 241.27, connections: 0, label: 'C' }
                    ];
                    setPoints(initialPoints);

                    // Envoyer les points de base au serveur
                    await fetch(`http://127.0.0.1:8000/api/game/${gameId}/move/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'initialize_points',
                            points: initialPoints
                        })
                    });
                }

                if (gameData.curves) {
                    setCurves(gameData.curves);
                } else if (gameData.state && gameData.state.curves) {
                    setCurves(gameData.state.curves);
                }
            } else {
                console.error("Failed to fetch game state:", gameData.error);
            }
        } catch (error) {
            console.error("Error fetching player ID and game state:", error);
        }
    };

    fetchPlayerIdAndGameState();

    const intervalId = setInterval(async () => {
        try {
            const gameResponse = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/state/`);
            const gameData = await gameResponse.json();
            if (gameResponse.ok) {
                setGameState(gameData.state);
                setCurrentPlayer(gameData.currentPlayer);

                // Mettre à jour les points et courbes avec les données du serveur
                if (gameData.points) {
                    setPoints(gameData.points);
                } else if (gameData.state && gameData.state.points) {
                    setPoints(gameData.state.points);
                }

                if (gameData.curves) {
                    setCurves(gameData.curves);
                } else if (gameData.state && gameData.state.curves) {
                    setCurves(gameData.state.curves);
                }
            } else {
                console.error("Failed to fetch game state:", gameData.error);
            }
        } catch (error) {
            console.error("Error fetching game state:", error);
        }
    }, 2000);

    return () => clearInterval(intervalId);
}, [gameId]);

    const handleMove = async (move) => {
    try {
        console.log("Sending move to server:", move);
        const response = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/move/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(move)
        });

        const data = await response.json();
        console.log("Server response:", data);

        if (response.ok) {
            setGameState(data.state);
            setCurrentPlayer(data.currentPlayer);

            // Mettre à jour les points et les courbes uniquement si le serveur les renvoie
            if (data.points) {
                console.log("Updated points from server:", data.points);
                setPoints(data.points);
            } else if (data.state && data.state.points) {
                console.log("Updated points from server state:", data.state.points);
                setPoints(data.state.points);
            } else {
                // Si le serveur ne renvoie pas les points, ajoutez manuellement le nouveau point
                setPoints(prevPoints => [...prevPoints, move.point]);
            }

            if (data.curves) {
                setCurves(data.curves);
            } else if (data.state && data.state.curves) {
                setCurves(data.state.curves);
            }
        } else {
            console.error("Failed to make move:", data.error);
        }
    } catch (error) {
        console.error("Error making move:", error);
    }
};
    return (
        <div>
            {gameState && (
                <OnlineCanvas
                    // Utiliser directement nos états locaux pour les points et courbes
                    points={points}
                    setPoints={setPoints}
                    curves={curves}
                    setCurves={setCurves}
                    currentPlayer={currentPlayer}
                    myTurn={currentPlayer === playerId}
                    onMove={handleMove}
                />
            )}
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={true} newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss={false} draggable={false} pauseOnHover={false} />

        </div>
    );
}

export default OnlineGame;
