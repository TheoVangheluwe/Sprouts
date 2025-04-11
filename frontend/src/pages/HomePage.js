import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4">Sprouts Game</h1>
        <p className="text-gray-600 mb-6">Jouez au célèbre jeu de Sprouts en ligne !</p>
        <div className="mb-6">
          <Link
            to="/game"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mr-2 inline-block"
          >
            Jouer maintenant !
          </Link>
          <Link
            to="/rules"
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 inline-block"
          >
            Voir les règles
          </Link>
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-2">Pourquoi jouer ici ?</h2>
          <ul className="text-gray-600 list-disc list-inside">
            <li>Fini les erreurs d’encre, profitez d’une interface fluide et interactive !</li>
            <li>Jouez n’importe où, sur PC ou mobile.</li>
          </ul>
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-2">Fonctionnalités du Site</h2>
          <ul className="text-gray-600 list-disc list-inside">
            <li>Jouez seul ou avec un ami.</li>
            <li>Affrontez des joueurs en ligne.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
