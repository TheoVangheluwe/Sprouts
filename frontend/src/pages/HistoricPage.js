import React, { useEffect, useState } from 'react';

const HistoricPage = () => {
  const [userId, setUserId] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupération de l'ID utilisateur
  useEffect(() => {
    fetch('/api/player/id/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Utilisateur non connecté');
        }
        return res.json();
      })
      .then(data => {
        setUserId(data.id);
      })
      .catch(err => {
        console.error('Erreur lors de la récupération de l’ID utilisateur :', err);
      });
  }, []);

  // Récupération des parties après obtention de l'ID
  useEffect(() => {
    if (!userId) return;

    fetch('/api/player/games/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur lors du chargement des parties :', err);
        setLoading(false);
      });
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
                <li key={index} className="bg-white shadow p-4 rounded">
                  <p><strong>Partie #{game.game_id}</strong></p>
                  <p>Statut : {game.status}</p>
                  <p>Date de création : {game.created_at || "inconnue"}</p>
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
