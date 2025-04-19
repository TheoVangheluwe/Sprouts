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

  return (
    <header className="bg-darkBlue text-white p-4">
      <nav className="container mx-auto flex items-center">
        <div className="flex items-center space-x-4 w-1/3 justify-start">
          <img src={logo} alt="Logo" style={{ height: '3.5rem' }} className="w-auto" />
          <a href="/home"><div className="text-xl font-bold text-lightGreen">Sprouts Game</div></a>
        </div>


        <div className="flex w-1/3 justify-center">
        </div>

        <div className="w-1/3 flex justify-end">
        {user ? (
          <a
            href="/profil"
            className="text-lightGreen hover:text-softBlue transition-colors duration-300"
            title="Profil"
          >
            {user}
          </a>
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
