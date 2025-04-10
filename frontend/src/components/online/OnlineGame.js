import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import OnlineCanvas from './OnlineCanvas';
import { ToastContainer } from "react-toastify";

function OnlineGame() {
    const { gameId } = useParams();
    const [gameState, setGameState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerId, setPlayerId] = useState(null);

    const [points, setPoints] = useState([]);
    const [curves, setCurves] = useState([]);
    const [isSendingMove, setIsSendingMove] = useState(false); // Nouvelle variable pour bloquer les mouvements simultanés

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

                    if (gameData.points && gameData.points.length > 0) {
                        console.log("Setting points from server:", gameData.points);
                        setPoints(gameData.points);
                    } else {
                        const initialPoints = [
                            { x: 385.6, y: 366.5, connections: 0, label: 'A' },
                            { x: 168.7, y: 491.73, connections: 0, label: 'B' },
                            { x: 168.7, y: 241.27, connections: 0, label: 'C' }
                        ];
                        setPoints(initialPoints);

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

            // Mettre à jour les points
            if (gameData.points) {
                setPoints(gameData.points);
            } else if (gameData.state && gameData.state.points) {
                setPoints(gameData.state.points);
            }

            // Récupérer les courbes du serveur
            let serverCurves = [];
            if (gameData.curves) {
                serverCurves = gameData.curves;
            } else if (gameData.state && gameData.state.curves) {
                serverCurves = gameData.state.curves;
            }

            // Si le serveur a renvoyé des courbes, les utiliser
            if (serverCurves.length > 0) {
                setCurves(serverCurves);
            } else {
                // Si aucune courbe n'est renvoyée mais que nous avons des points,
                // envoyons nos courbes locales au serveur pour synchroniser
                if (curves.length > 0) {
                    try {
                        await fetch(`http://127.0.0.1:8000/api/game/${gameId}/sync-curves/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ curves: curves })
                        });
                        console.log("Synchronized curves with server");
                    } catch (error) {
                        console.error("Error synchronizing curves:", error);
                    }
                }
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
            body: JSON.stringify(move),
        });

        const data = await response.json();
        console.log("Server response:", data);

        if (response.ok) {
            setGameState(data.state);
            setCurrentPlayer(data.currentPlayer);

            // Mettre à jour les points si renvoyés par le serveur
            if (data.points) {
                console.log("Updated points from server:", data.points);
                setPoints(data.points);
            } else if (data.state && data.state.points) {
                console.log("Updated points from server state:", data.state.points);
                setPoints(data.state.points);
            }

            // Mettre à jour les courbes
            let updatedCurves = [];
            if (data.curves) {
                updatedCurves = data.curves;
            } else if (data.state && data.state.curves) {
                updatedCurves = data.state.curves;
            }

            // Si c'est un mouvement de type 'place_point', s'assurer que la courbe est incluse
            if (move.type === 'place_point' && move.curve && move.curve.length > 0) {
                // Vérifier si la courbe existe déjà dans les courbes mises à jour
                const curveExists = updatedCurves.some(curve =>
                    JSON.stringify(curve) === JSON.stringify(move.curve)
                );

                // Si elle n'existe pas, l'ajouter
                if (!curveExists) {
                    updatedCurves = [...updatedCurves, move.curve];
                }
            }

            // Mettre à jour les courbes dans l'état
            setCurves(updatedCurves);
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