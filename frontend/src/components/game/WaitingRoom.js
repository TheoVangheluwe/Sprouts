import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function WaitingRoom({ setInWaitingRoom }) {
    const [gameId, setGameId] = useState(null);
    const [queueInfo, setQueueInfo] = useState(null);
    const [ready, setReady] = useState(false);
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [hasJoinedQueue, setHasJoinedQueue] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [checkingActiveGame, setCheckingActiveGame] = useState(true);
    const navigate = useNavigate();

    const navigateTo = (path) => {
        if (!path.includes("undefined")) {
            navigate(path);
        }
    };

    const pointOptions = [3, 4, 5, 6, 7];

    useEffect(() => {
        const checkActiveGame = async () => {
            try {
                const response = await fetch(`/api/queue/status/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (data.active_game && data.game_id) {
                    navigateTo(`/online-game/${data.game_id}`);
                } else {
                    setCheckingActiveGame(false);
                }
            } catch {
                setCheckingActiveGame(false);
            }
        };
        checkActiveGame();
    }, [navigate]);

    useEffect(() => {
        if (!hasJoinedQueue || checkingActiveGame) return;
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/queue/status/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (data.active_game && data.game_id) {
                    navigateTo(`/online-game/${data.game_id}`);
                } else {
                    setQueueInfo(data);
                    if (data.game_created && data.game_id) {
                        setGameId(data.game_id);
                        navigateTo(`/online-game/${data.game_id}`);
                    }
                }
            } catch {}
        }, 2000);
        return () => clearInterval(interval);
    }, [hasJoinedQueue, navigate, ready, checkingActiveGame]);

    const togglePointSelection = (points) => {
        setSelectedPoints(prev => prev.includes(points) ? prev.filter(p => p !== points) : [...prev, points]);
    };

    const joinQueue = async () => {
        if (selectedPoints.length === 0) {
            alert("Veuillez sélectionner au moins une option de points.");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`/api/queue/join/`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ pointPreferences: selectedPoints })
            });
            const data = await response.json();
            if (response.ok) {
                if (data.active_game && data.game_id) {
                    navigateTo(`/online-game/${data.game_id}`);
                } else {
                    setHasJoinedQueue(true);
                    setQueueInfo(data);
                }
            } else {
                throw new Error(data.error || "Impossible de rejoindre la file d'attente");
            }
        } catch {
            alert("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const setPlayerReady = async () => {
        try {
            const response = await fetch(`/api/queue/ready/`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setReady(true);
                if (data.game_id) {
                    setGameId(data.game_id);
                    navigateTo(`/online-game/${data.game_id}`);
                }
            } else {
                throw new Error(data.error || "Erreur lors de la déclaration de l'état de préparation");
            }
        } catch {
            alert("Une erreur est survenue. Veuillez réessayer.");
        }
    };

    const leaveQueue = async () => {
        try {
            const response = await fetch(`/api/queue/leave/`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                resetState();
            } else {
                throw new Error("Erreur lors de la sortie de la file d'attente");
            }
        } catch {
            alert("Une erreur est survenue. Veuillez réessayer.");
        }
    };

    const resetState = () => {
        setHasJoinedQueue(false);
        setGameId(null);
        setQueueInfo(null);
        setReady(false);
        setInWaitingRoom(false);
    };

    if (checkingActiveGame) {
        return (
            <div className="to-black flex flex-col items-center justify-center h-full p-4 font-arcade text-white">
                <div className="bg-gray-800 border-4 border-yellow-400 p-6 rounded-lg shadow-xl text-center w-full max-w-md">
                    <h2 className="text-2xl font-bold text-yellow-300 mb-4">Vérification de partie en cours...</h2>
                    <p>Veuillez patienter pendant que nous vérifions votre statut.</p>
                </div>
            </div>
        );
    }

    if (!hasJoinedQueue) {
        return (
            <div className="to-black flex flex-col items-center justify-center h-full p-4 font-arcade text-white">
                <div className="bg-gray-800 border-4 border-yellow-400 p-6 rounded-lg shadow-xl text-center w-full max-w-md">
                    <h1 className="text-3xl mb-4 animate-pulse text-yellow-300">🎮 Choix du nombre de points 🎮</h1>
                    <p className="mb-6">Sélectionnez les configurations de points que vous acceptez :</p>
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                        {pointOptions.map(option => (
                            <button
                                key={option}
                                onClick={() => togglePointSelection(option)}
                                className={`px-4 py-2 rounded-lg border-2 border-white transition transform hover:scale-105 ${
                                    selectedPoints.includes(option)
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-700 text-white"
                                }`}
                            >
                                {option} points
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={joinQueue}
                            disabled={isLoading || selectedPoints.length === 0}
                            className={`px-6 py-3 rounded border-2 border-white transition transform ${
                                selectedPoints.length > 0
                                    ? "bg-blue-600 hover:bg-blue-500"
                                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                            }`}
                        >
                            {isLoading ? "Recherche en cours..." : "Rejoindre"}
                        </button>
                        <button
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded border-2 border-white"
                            onClick={() => window.location.href = '/menu'}
                        >
                            ❌ Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="to-black flex flex-col items-center justify-center h-full p-4 font-arcade text-white">
            <div className="bg-gray-800 border-4 border-yellow-400 p-6 rounded-lg shadow-2xl text-center max-w-md w-full">
                <h2 className="text-3xl font-bold text-yellow-300 mb-4">Salle d’attente</h2>
                {queueInfo && <p className="mb-4">Joueurs en attente : {queueInfo.queue_count || 0}</p>}

                <div className="bg-gray-700 p-4 rounded mb-4">
                    <h3 className="text-xl text-yellow-300 mb-2">Préférences de points</h3>
                    <p>{selectedPoints.join(", ")} points</p>
                </div>

                <div className="bg-gray-700 p-4 rounded mb-4">
                    <h3 className="text-xl text-yellow-300 mb-2">Statut</h3>
                    {queueInfo?.matched ? (
                        <div>
                            <p>Adversaire : <strong>{queueInfo.matched_with.username}</strong></p>
                            <p>Statut : {queueInfo.matched_with.ready ? 'Prêt ✅' : 'En attente'}</p>
                            {ready && <p>Vous êtes : <strong>Prêt ✅</strong></p>}
                        </div>
                    ) : <p>En attente d'un adversaire...</p>}
                </div>

                <div className="flex justify-center gap-4">
                    {queueInfo?.matched && !ready && (
                        <button
                            onClick={setPlayerReady}
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-500"
                        >
                            ✅ Prêt
                        </button>
                    )}
                    <button
                        onClick={leaveQueue}
                        className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500"
                    >
                        ❌ Quitter
                    </button>
                </div>

                {ready && (
                    <p className="mt-4 animate-pulse">En attente que l'adversaire se prépare...</p>
                )}
            </div>
        </div>
    );
}

export default WaitingRoom;
