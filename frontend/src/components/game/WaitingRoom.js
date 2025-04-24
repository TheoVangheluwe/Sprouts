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
        if (path.includes("undefined")) {
            return;
        }

        if (navigate) {
            navigate(path);
        } else {
            window.location.href = path;
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
                    return;
                }

                setCheckingActiveGame(false);
            } catch (error) {
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
                    return;
                }

                setQueueInfo(data);

                if (data.game_created && data.game_id) {
                    setGameId(data.game_id);
                    navigateTo(`/online-game/${data.game_id}`);
                }
            } catch (error) {
                // Erreur silencieuse
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [hasJoinedQueue, navigate, ready, checkingActiveGame]);

    const togglePointSelection = (points) => {
        setSelectedPoints(prev => {
            if (prev.includes(points)) {
                return prev.filter(p => p !== points);
            } else {
                return [...prev, points];
            }
        });
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
                body: JSON.stringify({
                    pointPreferences: selectedPoints
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.active_game && data.game_id) {
                    navigateTo(`/online-game/${data.game_id}`);
                    return;
                }

                setHasJoinedQueue(true);
                setQueueInfo(data);
            } else {
                throw new Error(data.error || "Impossible de rejoindre la file d'attente");
            }
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
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
            <div className="to-black flex flex-col items-center justify-center p-4 font-arcade">
                <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold text-yellow-300 mb-4">Vérification de partie en cours...</h2>
                    <p className="text-white">Veuillez patienter pendant que nous vérifions si vous avez une partie active.</p>
                </div>
            </div>
        );
    }

    if (!hasJoinedQueue) {
        return (
            <div className="to-black flex flex-col items-center justify-center p-4 font-arcade">
                <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold text-yellow-300 mb-4">Sélectionner le nombre de points</h2>
                    <p className="text-white mb-6">Choisissez une ou plusieurs options pour être mis en correspondance avec d'autres joueurs:</p>

                    <div className="flex justify-center flex-wrap gap-2 mb-6">
                        {pointOptions.map(option => (
                            <button
                                key={option}
                                onClick={() => togglePointSelection(option)}
                                className={`py-2 px-4 rounded-lg transform transition hover:scale-105 ${
                                    selectedPoints.includes(option) 
                                        ? "bg-green-600 text-white font-bold" 
                                        : "bg-gray-600 text-white"
                                }`}
                            >
                                {option} points
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={joinQueue}
                        disabled={isLoading || selectedPoints.length === 0}
                        className={`py-3 px-6 rounded-lg transform transition w-full ${
                            selectedPoints.length > 0 
                                ? "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105" 
                                : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }`}
                    >
                        {isLoading ? "Recherche en cours..." : "Rejoindre la file d'attente"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="to-black flex flex-col items-center justify-center p-4 font-arcade">
            <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
                <h2 className="text-3xl font-bold text-yellow-300 mb-6">Salle d'Attente</h2>

                {queueInfo && (
                    <p className="text-white mb-4">Joueurs en file d'attente: {queueInfo.queue_count || 0}</p>
                )}

                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                    <h3 className="text-xl text-yellow-300 mb-2">Préférences de points</h3>
                    <p className="text-white">{selectedPoints.join(", ")} points</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                    <h3 className="text-xl text-yellow-300 mb-2">Statut</h3>
                    {queueInfo && queueInfo.matched ? (
                        <div className="text-white">
                            <p>Adversaire trouvé: <strong>{queueInfo.matched_with.username}</strong></p>
                            <p>Statut: {queueInfo.matched_with.ready ? 'Prêt ✅' : 'En attente'}</p>
                            {ready && <p>Vous êtes: <strong>Prêt ✅</strong></p>}
                        </div>
                    ) : (
                        <p className="text-white">En attente d'un adversaire...</p>
                    )}
                </div>

                <div className="flex justify-center gap-3">
                    {queueInfo && queueInfo.matched && !ready && (
                        <button
                            onClick={setPlayerReady}
                            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-500 transform transition hover:scale-105 shadow-md"
                        >
                            Prêt
                        </button>
                    )}

                    <button
                        onClick={leaveQueue}
                        className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-500 transform transition hover:scale-105 shadow-md"
                    >
                        Quitter la file
                    </button>
                </div>

                {ready && (
                    <p className="text-white mt-4 animate-pulse">
                        En attente que votre adversaire soit prêt...
                    </p>
                )}
            </div>
        </div>
    );
}

export default WaitingRoom;
