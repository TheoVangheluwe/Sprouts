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
        if (navigate) {
            navigate(path);
        } else {
            window.location.href = path;
        }
    };

    const pointOptions = [3, 4, 5, 6, 7];

    // Vérifier si le joueur a une partie active avant de lui permettre de rejoindre la file
    useEffect(() => {
        const checkActiveGame = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/queue/status/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();

                // Si le joueur a une partie active, le rediriger directement
                if (data.active_game && data.game_id) {
                    console.log("Active game found, redirecting to:", data.game_id);
                    navigateTo(`/online-game/${data.game_id}`);
                    return;
                }

                setCheckingActiveGame(false);
            } catch (error) {
                console.error("Error checking active game:", error);
                setCheckingActiveGame(false);
            }
        };

        checkActiveGame();
    }, [navigate]);

    // Vérifier régulièrement l'état de la file d'attente
    useEffect(() => {
        if (!hasJoinedQueue || checkingActiveGame) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/queue/status/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const data = await response.json();
                console.log("Queue Status:", data);

                // Si le joueur a une partie active, le rediriger directement
                if (data.active_game && data.game_id) {
                    console.log("Active game found during polling, redirecting to:", data.game_id);
                    navigateTo(`/online-game/${data.game_id}`);
                    return;
                }

                setQueueInfo(data);

                // Si un jeu a été créé, rediriger vers la page de jeu
                if (data.game_created && data.game_id) {
                    console.log("Game created, redirecting to game:", data.game_id);
                    setGameId(data.game_id);
                    navigateTo(`/online-game/${data.game_id}`);
                }
            } catch (error) {
                console.error("Erreur récupération statut de la file:", error);
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
                // Si le joueur a une partie active, le rediriger directement
                if (data.active_game && data.game_id) {
                    console.log("Active game found during join, redirecting to:", data.game_id);
                    navigateTo(`/online-game/${data.game_id}`);
                    return;
                }

                setHasJoinedQueue(true);
                setQueueInfo(data);
                console.log("Joined queue with points:", selectedPoints);
            } else {
                throw new Error(data.error || "Impossible de rejoindre la file d'attente");
            }
        } catch (error) {
            console.error("Erreur lors de la mise en file d'attente:", error);
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
                console.log("Player ready, response:", data);

                // Si un jeu a été créé, rediriger vers la page de jeu
                if (data.game_id) {
                    console.log("Game created during ready call, redirecting to:", data.game_id);
                    setGameId(data.game_id);
                    navigateTo(`/online-game/${data.game_id}`);
                }
                // Ne pas mettre à jour queueInfo ici pour éviter de perdre les infos de match
            } else {
                throw new Error(data.error || "Erreur lors de la déclaration de l'état de préparation");
            }
        } catch (error) {
            console.error("Erreur lors de la déclaration de l'état de préparation:", error);
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
                console.log("Left the queue successfully.");
            } else {
                throw new Error("Erreur lors de la sortie de la file d'attente");
            }
        } catch (error) {
            console.error("Erreur lors de la sortie de la file d'attente:", error);
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

    // Afficher un écran de chargement pendant la vérification de partie active
    if (checkingActiveGame) {
        return (
            <div style={{ textAlign: "center", padding: "20px" }}>
                <h2>Vérification de partie en cours...</h2>
                <p>Veuillez patienter pendant que nous vérifions si vous avez une partie active.</p>
            </div>
        );
    }

    if (!hasJoinedQueue) {
        return (
            <div style={{ textAlign: "center", padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
                <h2>Sélectionner le nombre de points</h2>
                <p>Choisissez une ou plusieurs options pour être mis en correspondance avec d'autres joueurs:</p>

                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px", margin: "20px 0" }}>
                    {pointOptions.map(option => (
                        <button
                            key={option}
                            onClick={() => togglePointSelection(option)}
                            style={{
                                padding: "10px 15px",
                                margin: "5px",
                                backgroundColor: selectedPoints.includes(option) ? "#4CAF50" : "#f1f1f1",
                                color: selectedPoints.includes(option) ? "white" : "black",
                                border: "1px solid #ddd",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontWeight: selectedPoints.includes(option) ? "bold" : "normal"
                            }}
                        >
                            {option} points
                        </button>
                    ))}
                </div>

                <button
                    onClick={joinQueue}
                    disabled={isLoading || selectedPoints.length === 0}
                    style={{
                        marginTop: "20px",
                        padding: "12px 25px",
                        fontSize: "18px",
                        backgroundColor: selectedPoints.length > 0 ? "#2196F3" : "#cccccc",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: selectedPoints.length > 0 ? "pointer" : "not-allowed"
                    }}
                >
                    {isLoading ? "Recherche en cours..." : "Rejoindre la file d'attente"}
                </button>
            </div>
        );
    }

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Salle d'Attente</h2>
            {queueInfo && (
                <p>Joueurs en file d'attente: {queueInfo.queue_count || 0}</p>
            )}

            <div style={{
                backgroundColor: "#f5f5f5",
                padding: "15px",
                borderRadius: "8px",
                margin: "20px auto",
                maxWidth: "300px"
            }}>
                <h3>Préférences de points</h3>
                <p>{selectedPoints.join(", ")} points</p>
            </div>

            <div style={{
                backgroundColor: "#f9f9f9",
                padding: "15px",
                borderRadius: "8px",
                margin: "20px auto",
                maxWidth: "300px"
            }}>
                <h3>Statut</h3>
                {queueInfo && queueInfo.matched ? (
                    <div>
                        <p>Adversaire trouvé: <strong>{queueInfo.matched_with.username}</strong></p>
                        <p>Statut: {queueInfo.matched_with.ready ? 'Prêt ✅' : 'En attente'}</p>
                        {ready && <p>Vous êtes: <strong>Prêt ✅</strong></p>}
                    </div>
                ) : (
                    <p>En attente d'un adversaire...</p>
                )}
            </div>

            <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "15px" }}>
                {queueInfo && queueInfo.matched && !ready && (
                    <button
                        onClick={setPlayerReady}
                        style={{
                            padding: "10px 20px",
                            fontSize: "16px",
                            backgroundColor: "green",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer"
                        }}
                    >
                        Prêt
                    </button>
                )}

                <button
                    onClick={leaveQueue}
                    style={{
                        padding: "10px 20px",
                        fontSize: "16px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                >
                    Quitter la file
                </button>
            </div>

            {ready && <p style={{ marginTop: "20px" }}>En attente que votre adversaire soit prêt...</p>}
        </div>
    );
}

export default WaitingRoom;
