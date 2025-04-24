import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 font-arcade">
      <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-center w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-6 text-yellow-300 animate-pulse">Sprouts Game</h1>
        <p className="text-gray-300 mb-8">Bienvenue dans le monde captivant du jeu de Sprouts ! Jouez en ligne avec vos amis ou défiez l'IA.</p>
        <div className="space-y-4 mb-8">
          <Link
            to="/menu"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block"
          >
            Jouer !
          </Link>
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Pourquoi jouer ici ?</h2>
          <ul className="text-gray-200 list-disc list-inside mb-6">
            <li>Interface fluide et interactive, sans erreurs d’encre.</li>
            <li>Jouez n’importe où, sur PC ou mobile.</li>
            <li>Défiez vos amis ou jouez contre l'IA.</li>
          </ul>
        </div>
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">Fonctionnalités du Site</h2>
          <ul className="text-gray-200 list-disc list-inside">
            <li>Modes de jeu variés : Joueur contre Joueur, Joueur contre IA, et Multijoueur en ligne.</li>
            <li>Paramètres personnalisables pour adapter l'expérience de jeu.</li>
            <li>Interface utilisateur intuitive et design moderne.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
