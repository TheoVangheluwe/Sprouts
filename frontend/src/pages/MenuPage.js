import React from 'react';
import { Link } from 'react-router-dom';

const MenuPage = () => {
  return (
    <div className="flex flex-col  items-center justify-center p-4 h-full font-arcade">
      <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-8 text-yellow-300 animate-pulse">🎮 Menu 🎮</h1>
        <div className="space-y-6">
          <Link
            to="/pve"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Joueur contre Joueur (LAN)
          </Link>
          <Link
            to="/ai"
            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Joueur contre IA (Local)
          </Link>
          <Link
            to="/waiting-room"
            className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Multijoueur
          </Link>
          <Link
            to="/rules"
            className="bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-gray-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Règles du jeu
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
