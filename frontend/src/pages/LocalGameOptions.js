import React from 'react';
import { Link } from 'react-router-dom';

const LocalGameOptions = () => {
  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6">Choisissez votre mode de jeu</h1>
        <div className="space-y-4">
          <Link
            to="/local/pvp"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 block"
          >
            Joueur contre Joueur
          </Link>
          <Link
            to="/local/pve"
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 block"
          >
            Joueur contre IA
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LocalGameOptions;
