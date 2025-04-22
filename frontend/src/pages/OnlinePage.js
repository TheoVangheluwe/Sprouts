import React, {useEffect, useState, useRef} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import OnlineCanvas from '../components/online/OnlineCanvas';
import {ToastContainer, toast} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const LoadingScreen = () => {
    return (
        <div
            className="bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center min-h-screen p-4 font-arcade">
            <div
                className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">Initialisation de la partie...</h2>
                <div className="loading-container my-6">
                    <div className="loading-points">
                        <div className="point" style={{animationDelay: '0s'}}></div>
                        <div className="point" style={{animationDelay: '0.3s'}}></div>
                        <div className="point" style={{animationDelay: '0.6s'}}></div>
                        <div className="point" style={{animationDelay: '0.9s'}}></div>
                        <div className="point" style={{animationDelay: '1.2s'}}></div>
                        <div className="curve"></div>
                    </div>
                </div>
                <p className="text-white">Préparation du plateau de jeu...</p>
            </div>
            <style jsx>{`
                .loading-container {
                    position: relative;
                    height: 100px;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .loading-points {
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    width: 250px;
                }

                .point {
                    width: 20px;
                    height: 20px;
                    background-color: #EAB308;
                    border-radius: 50%;
                    margin: 0 5px;
                    animation: pulse 1.5s infinite;
                    box-shadow: 0 0 10px rgba(234, 179, 8, 0.7);
                }

                .curve {
                    position: absolute;
                    height: 2px;
                    background-color: #EAB308;
                    top: 50%;
                    left: 0;
                    right: 0;
                    transform: translateY(-50%);
                    animation: grow 2s infinite;
                    box-shadow: 0 0 10px rgba(234, 179, 8, 0.7);
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.3);
                        opacity: 1;
                    }
                }

                @keyframes grow {
                    0% {
                        width: 0;
                        left: 10px;
                    }
                    50% {
                        width: 230px;
                        left: 10px;
                    }
                    100% {
                        width: 0;
                        left: 240px;
                    }
                }
            `}</style>
        </div>
    );
};

function OnlinePage() {
    const {gameId} = useParams();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [selectedPoints, setSelectedPoints] = useState(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const [opponents, setOpponents] = useState([]);
    const [gameEnded, setGameEnded] = useState(false);
    const [username, setUsername] = useState("");
    const [gameInitialized, setGameInitialized] = useState(false);
    const [graphString, setGraphString] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [iWon, setIWon] = useState(false);
    const [abandon, setAbandon] = useState(false);

    // État pour le chargement des points et la synchronisation avec l'autre joueur
    const [pointsLoaded, setPointsLoaded] = useState(false);
    const [localPointsReady, setLocalPointsReady] = useState(false);
    const [allPlayersReady, setAllPlayersReady] = useState(false);

    const [points, setPoints] = useState([]);
    const [curves, setCurves] = useState([]);

    // Ajout des timers pour les joueurs
    const [myTimer, setMyTimer] = useState(600); // 10 minutes par défaut
    const [opponentTimer, setOpponentTimer] = useState(600);
    const timerInterval = useRef(null);
    const timerCounter = useRef(0);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isMyTurn = currentPlayer !== null &&
        currentPlayer !== undefined &&
        currentPlayer == playerId;

    // Effet pour gérer le timer
    useEffect(() => {
        if (!gameInitialized || gameEnded) {
            // Ne pas démarrer le timer
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
            return;
        }

        // Fonction pour synchroniser les timers avec le serveur
        const syncTimers = async () => {
            try {
                const response = await fetch(`/api/game/${gameId}/timers/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    // Mettre à jour les timers locaux avec les données du serveur
                    if (data.timers) {
                        // Mettre à jour notre timer
                        if (playerId && data.timers[playerId] !== undefined) {
                            setMyTimer(data.timers[playerId]);
                        }

                        // Mettre à jour le timer de l'adversaire
                        if (opponents.length > 0 && opponents[0].id) {
                            const opponentId = opponents[0].id;
                            if (data.timers[opponentId] !== undefined) {
                                setOpponentTimer(data.timers[opponentId]);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Erreur lors de la synchronisation des timers:", error);
            }
        };

        // Synchroniser au démarrage
        syncTimers();

        // Mettre en place un intervalle pour la synchronisation et le décompte
        timerInterval.current = setInterval(() => {
            // Synchroniser avec le serveur toutes les 5 secondes (5000ms)
            if (timerCounter.current % 2 === 0) {
                syncTimers();
            }


            // Décompte local entre les synchronisations
            if (isMyTurn) {
                setMyTimer(prev => Math.max(0, prev - 1));
            } else {
                // Si c'est le tour de l'adversaire, décrémenter son timer
                setOpponentTimer(prev => Math.max(0, prev - 1));
            }

            // Incrémenter le compteur d'intervalles
            timerCounter.current = (timerCounter.current + 1) % 10;
        }, 1000);

        return () => {
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        };
    }, [gameId, playerId, isMyTurn, gameInitialized, gameEnded, opponents]);

    // Fonction pour signaler que ce joueur a chargé ses points
    const signalPointsLoaded = async () => {
        try {
            const response = await fetch(`/api/game/${gameId}/ready_to_play/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAllPlayersReady(data.all_players_ready);

                // Si tous les joueurs sont prêts, activer l'affichage du jeu
                if (data.all_players_ready) {
                    setPointsLoaded(true);
                }
            }
        } catch (error) {
            console.error("Erreur lors de la notification de chargement des points:", error);
        }
    };

    const generateRandomInitialPoints = (numPoints) => {
        const pointCount = Math.max(3, numPoints);

        const canvasWidth = 500;
        const canvasHeight = 500;
        const padding = 50;
        const minDistanceBetweenPoints = 100;

        const initialPoints = [];
        const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

        const isTooClose = (x, y, points) => {
            for (const point of points) {
                const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
                if (distance < minDistanceBetweenPoints) {
                    return true;
                }
            }
            return false;
        };

        for (let i = 0; i < pointCount; i++) {
            let x, y;
            let attempts = 0;
            const maxAttempts = 100;

            do {
                x = padding + Math.random() * (canvasWidth - 2 * padding);
                y = padding + Math.random() * (canvasHeight - 2 * padding);
                attempts++;

                if (attempts > maxAttempts) {
                    break;
                }
            } while (isTooClose(x, y, initialPoints));

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
        if (!gameId || gameId === 'undefined') {
            toast.error("ID de partie invalide");
            setGameEnded(true);
            setTimeout(() => navigate('/menu'), 2000);
            return;
        }

        const fetchPlayerIdAndGameState = async () => {
            try {
                const playerResponse = await fetch('/api/game/create', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const playerData = await playerResponse.json();
                if (playerResponse.ok) {
                    setPlayerId(playerData.player_id);
                    if (playerData.username) {
                        setUsername(playerData.username);
                    }
                }

                const gameResponse = await fetch(`/api/game/${gameId}/state/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!gameResponse.ok) {
                    if (gameResponse.status === 404) {
                        toast.error("Cette partie n'existe plus.");
                        setGameEnded(true);
                        setTimeout(() => navigate('/menu'), 2000);
                        return;
                    }
                    return;
                }

                const gameData = await gameResponse.json();

                setGameState(gameData.state);

                if (gameData.state && gameData.state.timers) {
                    if (gameData.state.timers[playerId]) {
                        setMyTimer(gameData.state.timers[playerId]);
                    }

                    // Trouver l'ID de l'adversaire
                    if (opponents.length > 0 && gameData.state.timers[opponents[0].id]) {
                        setOpponentTimer(gameData.state.timers[opponents[0].id]);
                    }
                }

                if (gameData.graphString) {
                    setGraphString(gameData.graphString);
                } else if (gameData.state && gameData.state.graphString) {
                    setGraphString(gameData.state.graphString);
                }

                if (gameData.currentPlayer !== undefined && gameData.currentPlayer !== null) {
                    setCurrentPlayer(gameData.currentPlayer);
                }

                if (gameData.state && gameData.state.abandoned_by) {


                    if (gameData.state.abandoned_by !== username) {
                        setIWon(true);
                        setWinner(username);
                    } else {
                        setIWon(false);
                        if (gameData.players && gameData.players.length > 0) {
                            const otherPlayer = gameData.players.find(p => p.username !== username);
                            if (otherPlayer) {
                                setWinner(otherPlayer.username);
                            }
                        }
                    }
                    setIsGameOver(true);
                    setGameEnded(true);
                    return;
                }

                if (gameData.status === 'abandoned') {
                    setGameEnded(true);
                    setIsGameOver(true);
                    return;
                }

                try {
                    const timerResponse = await fetch(`/api/game/${gameId}/timers/`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (timerResponse.ok) {
                        const timerData = await timerResponse.json();

                        if (timerData.timers) {
                            // Mettre à jour le timer du joueur local
                            if (playerId && timerData.timers[playerId] !== undefined) {
                                setMyTimer(timerData.timers[playerId]);
                            }

                            // Charger le timer de l'adversaire une fois que les opponents sont définis
                            if (gameData.players) {
                                const otherPlayers = gameData.players.filter(player => String(player.id) !== String(playerId));
                                if (otherPlayers.length > 0 && timerData.timers[otherPlayers[0].id] !== undefined) {
                                    setOpponentTimer(timerData.timers[otherPlayers[0].id]);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération des timers:", error);
                }

                if (gameData.players) {
                    const otherPlayers = gameData.players.filter(player => String(player.id) !== String(playerId));
                    setOpponents(otherPlayers);
                }

                if (gameData.selected_points) {
                    setSelectedPoints(gameData.selected_points);
                } else if (gameData.point_options && gameData.point_options.length > 0) {
                    setSelectedPoints(gameData.point_options[0]);
                } else {
                    setSelectedPoints(3);
                }

                // Vérifier si tous les joueurs sont prêts
                if (gameData.all_players_ready) {
                    setAllPlayersReady(true);
                    setPointsLoaded(true);
                }
                setAllPlayersReady(true);
                setPointsLoaded(true);

                if (gameData.points && gameData.points.length > 0) {
                    setPoints(gameData.points);
                    setLocalPointsReady(true);
                } else if (gameData.state && gameData.state.points && gameData.state.points.length > 0) {
                    setPoints(gameData.state.points);
                    setLocalPointsReady(true);
                } else {
                    const numPoints = gameData.selected_points ||
                        (gameData.point_options && gameData.point_options.length > 0 ?
                            gameData.point_options[0] : 3);

                    const initialPoints = generateRandomInitialPoints(numPoints);
                    setPoints(initialPoints);
                    setLocalPointsReady(true);

                    try {
                        await fetch(`/api/game/${gameId}/move/`, {
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
                    } catch (error) {
                        // Erreur silencieuse
                    }
                }

                if (gameData.curves) {
                    setCurves(gameData.curves);
                } else if (gameData.state && gameData.state.curves) {
                    setCurves(gameData.state.curves);
                }
                if (gameData.isGameOver ||
                    (gameData.state && gameData.state.winner) ||
                    gameData.status === 'completed') {
                    console.log("Partie terminée:", gameData);

                    const winnerFromData = gameData.winner ||
                        (gameData.state && gameData.state.winner ? gameData.state.winner.username : null) ||
                        null;
                    console.log("Gagnant:", winnerFromData);
                    setIsGameOver(true);
                    setWinner(winnerFromData);

                    if (winnerFromData) {
                        // Je suis le gagnant si mon nom d'utilisateur correspond
                        setIWon(winnerFromData === username);
                        toast.info(`Partie terminée! ${winnerFromData} a gagné!`);
                    } else {
                        console.log("aya fraté ya un prob")
                        // Aucun gagnant défini, on considère que l'adversaire a gagné
                        const players = opponents.map(p => p.username).concat([username]);
                        const otherPlayer = players.find(p => p !== username);

                        setWinner(otherPlayer || "Adversaire");
                        setIWon(false);
                        toast.info(`Partie terminée! ${otherPlayer || "Adversaire"} a gagné!`);
                    }

                    setGameEnded(true);
                    return;
                }

                setGameInitialized(true);

            } catch (error) {
                // Erreur silencieuse
            }
        };

        fetchPlayerIdAndGameState();

        // Interval pour vérifier l'état du jeu
        const intervalId = setInterval(async () => {
            if (!gameId || gameId === 'undefined' || gameEnded) {
                return;
            }

            try {
                const gameResponse = await fetch(`/api/game/${gameId}/state/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!gameResponse.ok) {
                    if (gameResponse.status === 404) {
                        if (!gameEnded) {
                            setGameEnded(true);
                            toast.info("La partie n'existe plus. Votre adversaire a peut-être abandonné.");
                            setIWon(true);
                            setWinner(username);
                            setIsGameOver(true);
                        }
                        return;
                    }

                    throw new Error(`HTTP error: ${gameResponse.status}`);
                }

                const gameData = await gameResponse.json();

                // Vérifier si tous les joueurs sont prêts
                if (gameData.all_players_ready) {
                    setAllPlayersReady(true);
                    setPointsLoaded(true);
                }

                if (gameData.state && gameData.state.abandoned_by) {
                    if (gameData.state.abandoned_by.id !== playerId) {
                        toast.warning(`${gameData.state.abandoned_by.username} a abandonné la partie !`);
                        setIWon(true);
                        setWinner(username);
                        setIsGameOver(true);
                        setGameEnded(true);
                        return;
                    }
                }

                if (gameData.status === 'completed') {
                    setGameEnded(true);
                    setIsGameOver(true);
                    setWinner(gameData.state.winner.username);
                    return;
                }

                if (gameData.status === 'abandoned') {
                    setGameEnded(true);
                    setIsGameOver(true);
                    if (gameData.players && gameData.players.length > 0) {
                        const otherPlayer = gameData.players.find(p => p.username !== username);
                        if (otherPlayer) {
                            setWinner(otherPlayer.username);
                            setIWon(false);
                        }
                    }
                    return;
                }

                setGameState(gameData.state);

                if (gameData.currentPlayer !== undefined && gameData.currentPlayer !== null) {
                    setCurrentPlayer(gameData.currentPlayer);
                }

                if (gameData.players) {
                    const otherPlayers = gameData.players.filter(player => String(player.id) !== String(playerId));

                    if (otherPlayers.length < opponents.length) {
                        toast.warning("Votre adversaire a quitté la partie !");
                        setIWon(true);
                        setWinner(username);
                        setIsGameOver(true);
                        setGameEnded(true);
                        return;
                    }

                    setOpponents(otherPlayers);
                }

                if (gameData.selected_points && gameData.selected_points !== selectedPoints) {
                    setSelectedPoints(gameData.selected_points);
                }

                if (gameData.points) {
                    setPoints(gameData.points);
                } else if (gameData.state && gameData.state.points) {
                    setPoints(gameData.state.points);
                }

                let serverCurves = [];
                if (gameData.curves) {
                    serverCurves = gameData.curves;
                } else if (gameData.state && gameData.state.curves) {
                    serverCurves = gameData.state.curves;
                }

                if (serverCurves.length > 0) {
                    setCurves(serverCurves);
                } else {
                    if (curves.length > 0) {
                        try {
                            await fetch(`/api/game/${gameId}/sync-curves/`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({curves: curves})
                            });
                        } catch (error) {
                            // Erreur silencieuse
                        }
                    }
                }

                if (gameData.graphString) {
                    setGraphString(gameData.graphString);
                } else if (gameData.state && gameData.state.graphString) {
                    setGraphString(gameData.state.graphString);
                }

                if (gameData.isGameOver) {
                    setIsGameOver(true);
                    setWinner(gameData.winner);
                    setIWon(gameData.winner === username);
                    toast.info(`Partie terminée! ${gameData.winner ? `${gameData.winner} a gagné!` : 'Match nul!'}`);
                    setGameEnded(true);
                    return;
                }
            } catch (error) {
                if (error.message && error.message.includes("404")) {
                    if (!gameEnded) {
                        setGameEnded(true);
                        toast.info("La partie n'existe plus. Votre adversaire a peut-être abandonné.");
                        setIWon(true);
                        setWinner(username);
                        setIsGameOver(true);
                    }
                }
            }
        }, 2000);

        return () => clearInterval(intervalId);
    }, [gameId, selectedPoints, navigate, username, playerId]);

    // Effet pour signaler que les points sont chargés localement
    useEffect(() => {
        if (localPointsReady && gameInitialized && !allPlayersReady && !gameEnded) {
            signalPointsLoaded();
        }
    }, [localPointsReady, gameInitialized, allPlayersReady, gameEnded]);

    const updateGraphString = (data) => {
        if (data.graphString) {
            setGraphString(data.graphString);
        } else if (data.state && data.state.graphString) {
            setGraphString(data.state.graphString);
        }
    };

    const handleMove = async (move) => {
        if (gameEnded) return;

        try {
            if (move.type === 'draw_curve' && (!move.startPoint || !move.endPoint)) {
                toast.error("Données invalides pour le mouvement.");
                return;
            }

            if (move.type === 'place_point' && !move.point) {
                toast.error("Données invalides pour le placement du point.");
                return;
            }

            if (move.graphString && !move.graphString.endsWith('}!')) {
                move.graphString += '}!';
            }

            move.timer = myTimer;


            const response = await fetch(`/api/game/${gameId}/move/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(move),
            });

            const data = await response.json();

            if (response.ok) {
                setGameState(data.state);
                if (data.currentPlayer !== undefined && data.currentPlayer !== null) {
                    setCurrentPlayer(data.currentPlayer);
                }

                if (data.points) {
                    setPoints(data.points);
                } else if (data.state && data.state.points) {
                    setPoints(data.state.points);
                }

                updateCurves(data);
                updateGraphString(data);
                try {
                    const timerResponse = await fetch(`/api/game/${gameId}/timers/`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (timerResponse.ok) {
                        const timerData = await timerResponse.json();

                        if (timerData.timers) {
                            if (playerId && timerData.timers[playerId] !== undefined) {
                                setMyTimer(timerData.timers[playerId]);
                            }

                            if (opponents.length > 0 && timerData.timers[opponents[0].id] !== undefined) {
                                setOpponentTimer(timerData.timers[opponents[0].id]);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Erreur lors de la synchronisation des timers après mouvement:", error);
                }

                if (data.isGameOver) {
                    setIsGameOver(true);
                    let winnerId;
                    let winnerUsername;

                    if (data.state && data.state.winner) {
                        // Utiliser le gagnant défini par le backend s'il existe
                        console.log("Le gagnant est:", data.state.winner);
                        console.log("Le joueur actuel est:", playerId);
                        winnerId = data.state.winner.id;
                        winnerUsername = data.state.winner.username;
                        setIWon(winnerId === playerId);
                    } else {
                        // Sinon, le gagnant est l'adversaire du joueur courant
                        // Car dans Sprouts, celui qui ne peut plus jouer perd
                        if (data.currentPlayer == playerId) {
                            // Si le joueur actuel est celui qui vient de jouer, alors son adversaire gagne
                            setIWon(false);
                            // Trouver l'adversaire pour définir comme gagnant
                            const opponent = opponents.length > 0 ? opponents[0] : null;
                            winnerId = opponent ? opponent.id : null;
                            winnerUsername = opponent ? opponent.username : "Adversaire";
                        } else {
                            // Si c'est l'adversaire qui est le joueur actuel, alors le joueur local gagne
                            winnerId = playerId;
                            winnerUsername = username;
                            setIWon(true);
                        }
                    }

                    setWinner(winnerUsername);

                    toast.info(`Partie terminée! ${winnerUsername ? `${winnerUsername} a gagné!` : 'Match nul!'}`);
                    setGameEnded(true);

                    try {
                        // Informer le backend du gagnant
                        const response = await fetch(`/api/game/${gameId}/move/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                type: 'update_winner',
                                winner: {
                                    id: winnerId,
                                    username: winnerUsername
                                },
                                isGameOver: true
                            })
                        });

                        const responseData = await response.json();
                        if (!response.ok) {
                            console.error("Erreur lors de l'envoi du gagnant:", responseData);
                        }
                    } catch (error) {
                        console.error("Erreur lors de l'envoi du gagnant:", error);
                    }
                    return;
                }
            } else {
                toast.error(`Erreur: ${data.error || 'Impossible de jouer ce coup'}`);
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'envoi du coup.");
        }
    };

    const updateCurves = (data) => {
        let updatedCurves = [];
        if (data.curves) {
            updatedCurves = data.curves;
        } else if (data.state && data.state.curves) {
            updatedCurves = data.state.curves;
        }
        setCurves(updatedCurves);
    };

    const executeLeaveGame = async () => {
        setIsLeaving(true);
        setAbandon(true);
        setGameEnded(true);

        try {
            const response = await fetch(`/api/game/${gameId}/leave/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            console.log("Réponse de la tentative de quitter la partie:", data);

            if (response.ok) {
                toast.warn("Vous avez quitté la partie.");
                setIWon(false);
                setIsGameOver(true);

                if (data.winner) {
                    setWinner(data.winner);
                    console.log("Vous avez gagné", data.winner);
                } else {

                }
            } else {
                toast.error(`Erreur: ${data.error || 'Impossible de quitter la partie'}`);
                setIsLeaving(false);
                setGameEnded(false);
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de la tentative de quitter la partie.");
            setIsLeaving(false);
            setGameEnded(false);
        }
    };

    const handleLeaveGame = () => {
        toast((t) => (
            <div className="bg-gray-800 border-2 border-yellow-400 rounded-lg p-4 shadow-lg">
                <h3 className="text-yellow-300 font-bold text-lg mb-2">Abandonner la partie ?</h3>
                <p className="text-white mb-4">Cela comptera comme une défaite. Êtes-vous sûr ?</p>
                <div className="flex justify-end gap-3">
                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transform transition hover:scale-105"
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeLeaveGame();
                        }}
                    >
                        Abandonner
                    </button>
                    <button
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transform transition hover:scale-105"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Continuer
                    </button>
                </div>
            </div>
        ), {
            position: "top-center",
            autoClose: 8000,
            hideProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: false,
            closeButton: false,
        });
    };

    // Condition modifiée pour l'écran de chargement
    if (!gameInitialized || !pointsLoaded) {
        return <LoadingScreen/>;
    }

    if (isGameOver && iWon && !abandon) {
        return (
            <div
                className="bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center min-h-screen p-4 font-arcade">
                <div
                    className="bg-gray-800 border-4 border-yellow-400 p-4 pt-8 rounded-lg shadow-2xl text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-6 text-yellow-300 animate-pulse">🏆 VICTOIRE 🏆</h1>
                    <div className="bg-green-900 p-6 rounded-lg mb-6">
                        <p className="text-white text-2xl mb-2">Félicitations!</p>
                        <p className="text-white">Vous avez remporté la partie</p>
                    </div>
                    <Link
                        to="/menu"
                        className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block"
                    >
                        Retour au menu
                    </Link>
                </div>
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}/>
            </div>
        );
    }
    if (isGameOver && !iWon && abandon) {
        return (
            <div
                className="bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center min-h-screen p-4 font-arcade">
                <div
                    className="bg-gray-800 border-4 border-yellow-400 p-4 pt-8 rounded-lg shadow-2xl text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-6 text-red-500">DÉFAITE</h1>
                    <div className="bg-red-900 p-6 rounded-lg mb-6">
                        <p className="text-white text-xl mb-2">Vous avez abandonné la partie</p>
                        {winner && <p className="text-white">{winner} a remporté la victoire</p>}
                    </div>
                    <Link
                        to="/menu"
                        className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block"
                    >
                        Retour au menu
                    </Link>
                </div>
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}/>
            </div>
        );
    } else if (isGameOver && !iWon) {
        return (
            <div
                className="bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center min-h-screen p-4 font-arcade">
                <div
                    className="bg-gray-800 border-4 border-yellow-400 p-4 pt-8  rounded-lg shadow-2xl text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-6 text-red-500">DÉFAITE</h1>
                    <div className="bg-red-900 p-6 rounded-lg mb-6">
                        <p className="text-white text-xl mb-2">Vous avez perdu la partie</p>
                        {winner && <p className="text-white">{winner} a remporté la victoire</p>}
                    </div>
                    <Link
                        to="/menu"
                        className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block"
                    >
                        Retour au menu
                    </Link>
                </div>
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}/>
            </div>
        );
    }


    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black font-arcade text-white p-4">
            <div
                className="bg-gray-800 border-4 border-yellow-400 p-6 rounded-lg shadow-2xl w-full max-w-screen-lg text-center flex flex-row items-center justify-center space-x-4">
                {gameState && (
                    <div style={{
                        width: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div className="flex justify-between items-center mb-4 w-full max-w-lg">
                            <div className={`flex flex-col items-center p-2 rounded-lg ${
                                isMyTurn ? "bg-green-600" : "bg-gray-700"
                            }`}>
                                <span className="text-white font-bold">Vous</span>
                                <span className={`text-2xl font-mono ${myTimer < 60 ? "text-red-400" : "text-white"}`}>
                                {formatTime(myTimer)}
                            </span>
                            </div>

                            <div className="text-white text-xl px-4">
                                VS
                            </div>

                            <div className={`flex flex-col items-center p-2 rounded-lg ${
                                !isMyTurn ? "bg-green-600" : "bg-gray-700"
                            }`}>
                            <span className="text-white font-bold">
                                {opponents.length > 0 ? opponents[0].username : "Adversaire"}
                            </span>
                                <span
                                    className={`text-2xl font-mono ${opponentTimer < 60 ? "text-red-400" : "text-white"}`}>
                                {formatTime(opponentTimer)}
                            </span>
                            </div>
                        </div>
                        <div style={{
                            backgroundColor: 'white',
                            width: '100%',
                            aspectRatio: '5/3',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                            <OnlineCanvas
                                points={points}
                                setPoints={setPoints}
                                curves={curves}
                                setCurves={setCurves}
                                currentPlayer={currentPlayer}
                                myTurn={isMyTurn === true}
                                onMove={handleMove}
                                selectedPoints={selectedPoints}
                            />
                        </div>

                        <div style={{
                            marginTop: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <div className={`py-2 px-4 rounded-lg text-center font-bold text-white min-w-[250px] ${
                                isMyTurn ? "bg-green-600" : "bg-red-600"
                            }`}>
                                {isMyTurn
                                    ? "C'est à votre tour de jouer"
                                    : "En attente du tour de l'adversaire"}
                            </div>

                            <button
                                onClick={handleLeaveGame}
                                disabled={isLeaving}
                                className={`bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-500 transform transition ${
                                    isLeaving ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
                                } shadow-md w-[200px]`}
                            >
                                {isLeaving ? 'Sortie en cours...' : 'Quitter la partie'}
                            </button>
                        </div>
                    </div>
                )}
                <ToastContainer position="top-right" autoClose={1500} hideProgressBar={true} newestOnTop={false}
                                closeOnClick={false} rtl={false} pauseOnFocusLoss={false} draggable={false}
                                pauseOnHover={false}/>
            </div>
        </div>
    );
}

export default OnlinePage;