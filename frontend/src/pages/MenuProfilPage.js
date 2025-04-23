import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MenuProfilPage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // pour redirection

  useEffect(() => {
    fetch('/api/player/name/', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setUser(data.username);
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = () => {
    fetch('/logout/', {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => {
        toast.success('Déconnexion réussie 👍');
        setTimeout(() => {
          window.location.reload(); // refresh necessaire car redirect marche pas (django / react aaaaaaaah)
        }, 1000);
      })
      .catch(() => {
        toast.error("Erreur lors de la déconnexion");
      });
  };
  

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center min-h-screen p-4 font-arcade">
      <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-8 text-yellow-300 animate-pulse">
          Profil de: {user}
        </h1>
        <div className="space-y-6">
          <Link
            to="/historic"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Historique de Jeu
          </Link>
          <Link
            to="/legal"
            className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Mentions Légales
          </Link>
          <Link
            to="/technic"
            className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Documentation Technique
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-gray-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuProfilPage;
