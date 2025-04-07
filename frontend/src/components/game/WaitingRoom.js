import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Importez useNavigate

function WaitingRoom() {
    const [gameId, setGameId] = useState(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [players, setPlayers] = useState([]);
    const [ready, setReady] = useState(false);
    const navigate = useNavigate(); // Utilisez useNavigate pour la redirection

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/game/`)
            .then(response => response.json())
            .then(data => {
                console.log("Liste des jeux en cours:", data);
                if (data.length > 0) {
                    setGameId(data[data.length - 1].id); // Prendre le dernier jeu créé
                }
            })
            .catch(error => console.error("Erreur récupération jeux:", error));
    }, []);

    useEffect(() => {
        if (!gameId) return;

        const interval = setInterval(() => {
            fetch(`http://127.0.0.1:8000/api/game/${gameId}/status/`)
                .then(response => response.json())
                .then(data => {
                    setPlayerCount(data.player_count);
                    setPlayers(data.players || []);

                    // Vérifiez si tous les joueurs sont prêts
                    const allPlayersReady = data.players.every(player => player.ready);

                    if (allPlayersReady) {
                        navigate(`/online-game/${gameId}`); // Redirigez vers votre composant OnlineGame
                    }
                })
                .catch(error => console.error("Erreur récupération statut du jeu:", error));
        }, 2000);

        return () => clearInterval(interval);
    }, [gameId, navigate]);

    const setPlayerReady = () => {
        if (!gameId) return;

        fetch(`http://127.0.0.1:8000/api/game/${gameId}/ready/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Assurez-vous que l'utilisateur est authentifié
            }
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error("Vous n'êtes pas autorisé à vous déclarer prêt.");
                    } else if (response.status === 404) {
                        throw new Error("Jeu non trouvé.");
                    } else {
                        throw new Error("Erreur lors de la déclaration de l'état de préparation.");
                    }
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    setReady(true);
                } else {
                    console.error("Erreur lors de la déclaration de l'état de préparation:", data.message);
                }
            })
            .catch(error => console.error("Erreur lors de la déclaration de l'état de préparation:", error.message));
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Salle d'Attente</h2>
            <p>Jeu ID: {gameId ?? "Chargement..."}</p>
            <p>Nombre de joueurs: {playerCount}</p>
            <ul style={{ listStyleType: "none", padding: 0 }}>
                {players.map((player, index) => (
                    <li key={index} style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {player.username} {player.ready ? '✅' : ''}
                    </li>
                ))}
            </ul>

            {playerCount > 1 && !ready && (
                <button
                    onClick={setPlayerReady}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        fontSize: "20px",
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
            {ready && <p>En attente des autres joueurs...</p>}
        </div>
    );
}

export default WaitingRoom;