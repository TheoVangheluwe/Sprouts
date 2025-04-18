import React, { useEffect, useState } from 'react';
import logo from '../assets/sprouts.png';
import toast from 'react-hot-toast';

const Header = () => {
  const [user, setUser] = useState(null);

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
        setUser(data.username + ` (#${data.id})`); //potentiellement enlever l'ID (je l'ai ajouté pour le debug mais jsp si c joli)
      })
      .catch(() => setUser(null));
  }, []);  

  const confirmLogout = () => {
    toast((t) => (
      <span className="flex flex-col">
        <span>Se déconnecter ?</span>
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="text-sm text-red-600 font-semibold"
            onClick={() => {
              toast.dismiss(t.id); // ferme le toast
              handleLogout();
            }}
          >
            Oui
          </button>
          <button
            className="text-sm text-gray-500"
            onClick={() => toast.dismiss(t.id)}
          >
            Annuler
          </button>
        </div>
      </span>
    ), {
      duration: 5000,
    });
  };

  const handleLogout = () => {
    fetch('/api/logout/', {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      toast.success('Déconnexion réussie');
      setUser(null);
      setTimeout(() => {
        window.location.href = '/login/';
      }, 1000);
    }).catch(() => {
      toast.error('Erreur lors de la déconnexion');
    });
  };

  return (
    <header className="bg-darkBlue text-white p-4">
      <nav className="container mx-auto flex items-center">
        <div className="flex items-center space-x-4 w-1/3 justify-start">
          <img src={logo} alt="Logo" style={{ height: '3.5rem' }} className="w-auto" />
          <a href="/home"><div className="text-xl font-bold text-lightGreen">Sprouts Game</div></a>
        </div>

        <div className="flex w-1/3 justify-center">
          <ul className="flex space-x-6 text-lg">
            <li><a href="/menu/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">Jeu</a></li>
            <li><a href="/rules/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">Règles</a></li>
            <li><a href="/historic/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">Historique</a></li>
          </ul>
        </div>

        <div className="w-1/3 flex justify-end">
          {user ? (
            <button
              onClick={confirmLogout}
              className="text-lightGreen hover:text-red-400 transition-colors duration-300"
              title="Se déconnecter"
            >
              {user}
            </button>
          ) : (
            <a href="/login/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
              Connexion
            </a>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
