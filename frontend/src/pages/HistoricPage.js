import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HistoricPage = () => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/player/info/', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setUserId(data.id);
        setUsername(data.username);
      })
      .catch(() => {
        setUserId(null);
        setUsername(null);
      });
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
    <div className="bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center min-h-screen p-4 font-arcade">
      <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-yellow-300 animate-pulse">
          🕹️ Historique de : {username}
        </h1>

        {loading ? (
          <p className="text-white">Chargement...</p>
        ) : userId ? (
          <div
            className="space-y-4 overflow-y-auto"
            style={{
              maxHeight: '400px',
              paddingRight: '0.5rem',
              overflowX: 'hidden' // Anti-scroll horizontal local
            }}
          >
            {games.length > 0 ? (
              games.map((game, index) => (
                <Link
                  key={index}
                  to={`/historic/${game.game_id}`}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block text-sm"
                >
                  Partie #{game.game_id} — {game.status} — {game.created_at || "inconnue"}
                </Link>
              ))
            ) : (
              <p className="text-white">Aucune partie trouvée.</p>
            )}
          </div>
        ) : (
          <p className="text-white">Utilisateur non connecté</p>
        )}
      </div>
    </div>
  );
};

export default HistoricPage;
