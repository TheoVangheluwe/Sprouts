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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Résumé de la partie #{gameId}</h1>
      {game ? (
        <div className="bg-white p-4 rounded shadow">
          <p><strong>Status :</strong> {game.status}</p>
          <p><strong>Date de création :</strong> {game.created_at}</p>
          <p><strong>Joueurs :</strong> {game.players?.join(', ')}</p>
          {/* Ajoute ici d'autres détails : gagnant, durée, etc. */}
        </div>
      ) : (
        <p>Chargement...</p>
      )}
    </div>
  );
};

export default GameSummaryPage;
