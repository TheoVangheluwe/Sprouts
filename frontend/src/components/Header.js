import React, { useEffect, useState } from 'react';
import logo from '../assets/sprouts.png';

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
        setUser(data.username + " #" + data.id);
      })
      .catch(() => setUser(null));
  }, []);

  return (
    <header className="bg-gray-900 border-b-4 border-yellow-400 text-yellow-300 font-['Press_Start_2P'] shadow-md z-50">
      <nav className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo et Titre */}
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-10 w-auto drop-shadow-md" />
          <a
            href="/home"
            className="text-sm text-yellow-300 hover:text-white transition tracking-tight"
          >
            Sprouts Game
          </a>
        </div>

        {/* Utilisateur ou Connexion */}
        <div>
          <a
            href={user ? '/profil' : '/login/'}
            className="text-sm text-yellow-300 hover:text-white transition tracking-tight"
            title={user ? 'Profil' : 'Connexion'}
          >
            {user || 'Connexion'}
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Header;
