import { useState, useEffect } from "react";

function WaitingRoom() {
    const [gameId, setGameId] = useState(null);
    const [playerCount, setPlayerCount] = useState(0);
    const [players, setPlayers] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);

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
            fetch(`http://127.0.0.1:8000/api/game/${gameId}/status`)
                .then(response => response.json())
                .then(data => {
                    setPlayerCount(data.player_count);
                    setPlayers(data.players || []); // Évite les erreurs si `players` est `undefined`

                    if (data.status === "started") {
                        window.location.href = `/game/${gameId}`;
                    }
                })
                .catch(error => console.error("Erreur récupération statut du jeu:", error));
        }, 2000);

        return () => clearInterval(interval);
    }, [gameId]);

    const startGame = () => {
        if (!gameId) return;

        fetch(`http://127.0.0.1:8000/api/game/${gameId}/start/`, { method: "POST" })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setGameStarted(true);
                    window.location.href = `/game/${gameId}`;
                } else {
                    console.error("Erreur au démarrage du jeu:", data.message);
                }
            })
            .catch(error => console.error("Erreur lors du démarrage du jeu:", error));
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Salle d'Attente</h2>
            <p>Jeu ID: {gameId ?? "Chargement..."}</p>
            <p>État: {gameStarted ? "En cours..." : "Waiting for players..."}</p>
            <p>Nombre de joueurs: {playerCount}</p>
            <ul style={{ listStyleType: "none", padding: 0 }}>
                {players.map((player, index) => (
                    <li key={index} style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {player.username}
                    </li>
                ))}
            </ul>
            {playerCount >= 2 && (
                <button
                    onClick={startGame}
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
                    Jouer
                </button>
            )}
        </div>
    );
}

export default WaitingRoom;
