import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OnlineCanvas from './OnlineCanvas';
import { ToastContainer, toast } from "react-toastify";

function OnlineGame() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [selectedPoints, setSelectedPoints] = useState(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const [opponents, setOpponents] = useState([]);
    const [gameEnded, setGameEnded] = useState(false);
    const [username, setUsername] = useState("");

    const [points, setPoints] = useState([]);
    const [curves, setCurves] = useState([]);

    // Fonction pour générer des points initiaux aléatoires
    const generateRandomInitialPoints = (numPoints) => {
        // Si le nombre de points est inférieur à 3, utiliser au moins 3 points
        const pointCount = Math.max(3, numPoints);

        // Canvas dimensions
        const canvasWidth = 600;
        const canvasHeight = 500;
        const padding = 50; // Espace minimum depuis les bords
        const minDistanceBetweenPoints = 100; // Distance minimale entre les points

        const initialPoints = [];
        const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

        // Fonction pour vérifier si un nouveau point est trop proche des points existants
        const isTooClose = (x, y, points) => {
            for (const point of points) {
                const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
                if (distance < minDistanceBetweenPoints) {
                    return true;
                }
            }
            return false;
        };

        // Générer chaque point
        for (let i = 0; i < pointCount; i++) {
            let x, y;
            let attempts = 0;
            const maxAttempts = 50; // Limite pour éviter une boucle infinie

            // Essayer de trouver une position valide
            do {
                x = padding + Math.random() * (canvasWidth - 2 * padding);
                y = padding + Math.random() * (canvasHeight - 2 * padding);
                attempts++;

                // Si on ne trouve pas de position après plusieurs tentatives, assouplir les contraintes
                if (attempts > maxAttempts) {
                    console.log(`Couldn't find ideal position for point ${i}, placing it anyway`);
                    break;
                }
            } while (isTooClose(x, y, initialPoints));

            // Ajouter le point avec un label
            initialPoints.push({
                x: x,
                y: y,
                connections: 0,
                label: labels[i % labels.length]
            });
        }

        return initialPoints;
    };


    useEffect(() => {
        // Récupérer les informations sur l'utilisateur

        const fetchPlayerIdAndGameState = async () => {
            try {
                const playerResponse = await fetch('/api/join-game', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const playerData = await playerResponse.json();
                if (playerResponse.ok) {
                    setPlayerId(playerData.player_id);
                } else {
                    console.error("Failed to fetch player ID:", playerData.error);
                }

                const gameResponse = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/state/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const gameData = await gameResponse.json();
                if (gameResponse.ok) {
                    setGameState(gameData.state);
                    setCurrentPlayer(gameData.currentPlayer);

                    // Vérifier si le jeu a été abandonné
                    if (gameData.state && gameData.state.abandoned_by) {
                        console.log(`Game was abandoned by ${gameData.state.abandoned_by}`);
                        toast.warning(`${gameData.state.abandoned_by} a abandonné la partie !`);
                        setGameEnded(true);
                        setTimeout(() => navigate('/'), 3000);
                        return;
                    }

                    // Vérifier si le jeu est marqué comme "abandonné"
                    if (gameData.status === 'abandoned') {
                        console.log("Game status is 'abandoned'");
                        toast.warning("La partie a été abandonnée !");
                        setGameEnded(true);
                        setTimeout(() => navigate('/'), 3000);
                        return;
                    }

                    // Récupérer les adversaires
                    if (gameData.players) {
                        const otherPlayers = gameData.players.filter(player => player.id !== playerData.player_id);
                        setOpponents(otherPlayers);
                    }

                    // Récupérer le nombre de points sélectionné pour la partie
                    if (gameData.selected_points) {
                        setSelectedPoints(gameData.selected_points);
                    } else if (gameData.point_options && gameData.point_options.length > 0) {
                        setSelectedPoints(gameData.point_options[0]);
                    } else {
                        setSelectedPoints(3);
                    }

                    // Vérifier si le serveur a déjà des points
                    if (gameData.points && gameData.points.length > 0) {
                        console.log("Setting points from server:", gameData.points);
                        setPoints(gameData.points);
                    } else if (gameData.state && gameData.state.points && gameData.state.points.length > 0) {
                        console.log("Setting points from server state:", gameData.state.points);
                        setPoints(gameData.state.points);
                    } else {
                        // Aucun point n'existe, en créer de nouveaux en fonction du nombre sélectionné
                        const numPoints = gameData.selected_points ||
                                         (gameData.point_options && gameData.point_options.length > 0 ?
                                          gameData.point_options[0] : 3);

                        const initialPoints = generateRandomInitialPoints(numPoints);
                        console.log(`Generating ${numPoints} random initial points:`, initialPoints);
                        setPoints(initialPoints);

                        // Envoyer les points initiaux au serveur
                        await fetch(`http://127.0.0.1:8000/api/game/${gameId}/move/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                type: 'initialize_points',
                                points: initialPoints
                            })
                        });
                    }

                    // Récupérer les courbes existantes
                    if (gameData.curves) {
                        setCurves(gameData.curves);
                    } else if (gameData.state && gameData.state.curves) {
                        setCurves(gameData.state.curves);
                    }
                } else {
                    console.error("Failed to fetch game state:", gameData.error);

                    // Si le jeu n'existe pas (404), rediriger
                    if (gameResponse.status === 404) {
                        toast.error("Cette partie n'existe plus.");
                        setGameEnded(true);
                        setTimeout(() => navigate('/'), 2000);
                    }
                }
            } catch (error) {
                console.error("Error fetching player ID and game state:", error);
            }
        };

        fetchPlayerIdAndGameState();

        const intervalId = setInterval(async () => {
            // Ne pas effectuer la mise à jour si le jeu est terminé
            if (gameEnded) return;

            try {
                const gameResponse = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/state/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!gameResponse.ok) {
                    // Si erreur 404, c'est peut-être que la partie a été supprimée
                    if (gameResponse.status === 404) {
                        console.log("Game no longer exists, it might have been deleted");
                        if (!gameEnded) {
                            setGameEnded(true);
                            toast.info("La partie n'existe plus. Votre adversaire a peut-être abandonné.");
                            setTimeout(() => navigate('/'), 3000);
                        }
                        return;
                    }

                    throw new Error(`HTTP error: ${gameResponse.status}`);
                }

                const gameData = await gameResponse.json();

                // Vérifier si le jeu a été abandonné
                if (gameData.state && gameData.state.abandoned_by) {
                    if (gameData.state.abandoned_by !== username) {
                        console.log(`Game was abandoned by ${gameData.state.abandoned_by}`);
                        toast.warning(`${gameData.state.abandoned_by} a abandonné la partie !`);
                        setGameEnded(true);
                        setTimeout(() => navigate('/'), 3000);
                        return;
                    }
                }

                // Vérifier si le jeu est marqué comme "abandonné"
                if (gameData.status === 'abandoned') {
                    console.log("Game status is 'abandoned'");
                    toast.warning("La partie a été abandonnée !");
                    setGameEnded(true);
                    setTimeout(() => navigate('/'), 3000);
                    return;
                }

                setGameState(gameData.state);
                setCurrentPlayer(gameData.currentPlayer);

                // Vérifier si les joueurs sont toujours là
                if (gameData.players) {
                    const otherPlayers = gameData.players.filter(player => player.id !== playerId);

                    // Si les adversaires ont changé (quelqu'un est parti)
                    if (otherPlayers.length < opponents.length) {
                        console.log("Opponent left the game");
                        toast.warning("Votre adversaire a quitté la partie !");
                        setGameEnded(true);
                        setTimeout(() => navigate('/'), 3000);
                        return;
                    }

                    setOpponents(otherPlayers);
                }

                // Mettre à jour le nombre de points sélectionné si disponible
                if (gameData.selected_points && gameData.selected_points !== selectedPoints) {
                    setSelectedPoints(gameData.selected_points);
                }

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
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ curves: curves })
                            });
                            console.log("Synchronized curves with server");
                        } catch (error) {
                            console.error("Error synchronizing curves:", error);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching game state:", error);

                // Si plusieurs erreurs consécutives, considérer que la partie est terminée
                if (error.message.includes("404")) {
                    console.log("Game may have been deleted");
                    if (!gameEnded) {
                        setGameEnded(true);
                        toast.info("La partie n'existe plus. Votre adversaire a peut-être abandonné.");
                        setTimeout(() => navigate('/'), 3000);
                    }
                }
            }
        }, 2000);

        return () => clearInterval(intervalId);
    }, [gameId, selectedPoints, playerId, navigate, opponents, gameEnded, username]);

    const handleMove = async (move) => {
        if (gameEnded) return;

        try {
            console.log("Sending move to server:", move);
            const response = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/move/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
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

    const handleLeaveGame = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir quitter la partie ? Cela comptera comme un abandon.")) {
            setIsLeaving(true);
            setGameEnded(true);

            try {
                const response = await fetch(`http://127.0.0.1:8000/api/game/${gameId}/leave/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success("Vous avez quitté la partie.");
                    // Rediriger vers la page d'accueil ou le lobby après quelques secondes
                    setTimeout(() => {
                        navigate('/');
                    }, 1500);
                } else {
                    toast.error(`Erreur: ${data.error || 'Impossible de quitter la partie'}`);
                    setIsLeaving(false);
                    setGameEnded(false);
                }
            } catch (error) {
                console.error("Error leaving game:", error);
                toast.error("Une erreur est survenue lors de la tentative de quitter la partie.");
                setIsLeaving(false);
                setGameEnded(false);
            }
        }
    };

    // Afficher un message si le jeu est terminé
    if (gameEnded) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '50px',
                backgroundColor: '#f9f9f9',
                borderRadius: '10px',
                margin: '50px auto',
                maxWidth: '500px'
            }}>
                <h2>Partie terminée</h2>
                <p>Vous allez être redirigé vers l'accueil...</p>
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            {gameState && (
                <>
                    <OnlineCanvas
                        points={points}
                        setPoints={setPoints}
                        curves={curves}
                        setCurves={setCurves}
                        currentPlayer={currentPlayer}
                        myTurn={currentPlayer === playerId}
                        onMove={handleMove}
                        selectedPoints={selectedPoints}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 1000
                    }}>
                        <button
                            onClick={handleLeaveGame}
                            disabled={isLeaving}
                            style={{
                                padding: '8px 15px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isLeaving ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                opacity: isLeaving ? 0.7 : 1
                            }}
                        >
                            {isLeaving ? 'Sortie en cours...' : 'Quitter la partie'}
                        </button>
                    </div>
                </>
            )}
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={true} newestOnTop={false} closeOnClick={false} rtl={false} pauseOnFocusLoss={false} draggable={false} pauseOnHover={false} />
        </div>
    );
}

export default OnlineGame;
