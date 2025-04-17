import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HistoricPage = () => {
  const [userId, setUserId] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/player/id/', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setUserId(data.id))
      .catch(() => setUserId(null));
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetch('/api/player/games/', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historique des parties</h1>
      
      {loading ? (
        <p>Chargement...</p>
      ) : userId ? (
        <div>
          <p className="mb-4">Utilisateur connecté : #{userId}</p>

          {games.length > 0 ? (
            <ul className="space-y-2">
              {games.map((game, index) => (
                <li key={index} className="bg-white shadow rounded hover:bg-gray-100 transition">
                <Link
                  to={`/game-summary/${game.game_id}`}
                  className="block w-full h-full p-4"
                >
                  <strong>Partie #{game.game_id}</strong> — Status : {game.status} — Créée le : {game.created_at || "inconnue"}
                </Link>
              </li>              
              ))}
            </ul>
          ) : (
            <p>Aucune partie trouvée.</p>
          )}
        </div>
      ) : (
        <p>Utilisateur non connecté</p>
      )}
    </div>
  );
};

export default HistoricPage;
