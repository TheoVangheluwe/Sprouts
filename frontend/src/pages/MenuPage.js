import React from 'react';
import { Link } from 'react-router-dom';

const MenuPage = () => {
  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-6">Menu Principal</h1>
        <div className="space-y-4">
          <Link
            to="/pve"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 block"
          >
            Joueur contre Joueur (Local)
          </Link>
          <Link
            to="/ai"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 block"
          >
            Joueur contre IA (Local)
          </Link>
          <Link
            to="/multi"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 block"
          >
            Jeux Multi
          </Link>
          <Link
            to="/settings"
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 block"
          >
            Paramètres
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
