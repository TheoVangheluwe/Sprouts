import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const GameSummaryPage = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);

  useEffect(() => {
    fetch(`/api/game/${gameId}/summary/`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setGame(data))
      .catch(err => console.error('Erreur:', err));
  }, [gameId]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center min-h-screen p-4 font-arcade">
      <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-6 text-yellow-300 animate-pulse">
          🧾 Résumé de la partie #{gameId}
        </h1>

        {game ? (
          <div className="text-white space-y-4 text-left">
            <p>
              <span className="text-yellow-400 font-semibold">📅 Créée le :</span> {game.created_at}
            </p>
            <p>
              <span className="text-yellow-400 font-semibold">🎮 Statut :</span> {game.status}
            </p>
            <p>
              <span className="text-yellow-400 font-semibold">👤 Joueurs :</span> {game.players?.join(', ')}
            </p>
            {/* Tu peux afficher ici le gagnant ou durée si dispo */}
          </div>
        ) : (
          <p className="text-white">Chargement...</p>
        )}
      </div>
    </div>
  );
};

export default GameSummaryPage;
