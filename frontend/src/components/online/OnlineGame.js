import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GameBoard from './GameBoard'; // Assurez-vous de modifier les imports pour correspondre à votre structure de fichier

function OnlineGame() {
    const { gameId } = useParams(); // Utilisez useParams pour récupérer le paramètre gameId depuis l'URL
    const [gameState, setGameState] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/game/${gameId}/state/`) // Assurez-vous d'avoir une vue pour obtenir l'état du jeu
            .then(response => {
                if (!response.ok) {
                    throw new Error('Game not found');
                }
                return response.json();
            })
            .then(data => {
                setGameState(data.state);
                setCurrentPlayer(data.currentPlayer);
            })
            .catch(error => console.error('Erreur récupération état du jeu:', error));
    }, [gameId]);

    const handleMove = (move) => {
        fetch(`http://127.0.0.1:8000/api/game/${gameId}/move/`, { // Assurez-vous d'avoir une vue pour gérer les mouvements
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ move })
        })
        .then(response => response.json())
        .then(data => {
            setGameState(data.state);
            setCurrentPlayer(data.currentPlayer);
        })
        .catch(error => console.error('Erreur lors du mouvement:', error));
    };

    return (
        <div>
            <h1>Jeu en Ligne</h1>
            {gameState && (
                <GameBoard
                    gameState={gameState}
                    currentPlayer={currentPlayer}
                    onMove={handleMove}
                />
            )}
        </div>
    );
}

export default OnlineGame;