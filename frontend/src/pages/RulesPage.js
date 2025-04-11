import React from 'react';

const RulesPage = () => {
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-left">
        <h1 className="text-3xl font-bold mb-4">Règles du Jeu de Sprouts</h1>
        <p className="text-gray-600 mb-4">
          Le jeu de Sprouts est un jeu de papier et crayon inventé par deux mathématiciens, John H. Conway et Michael S. Paterson. Voici comment jouer :
        </p>
        <ol className="text-gray-700 list-decimal list-inside mb-4">
          <li>Le jeu commence avec quelques points dessinés sur une feuille de papier.</li>
          <li>Les joueurs jouent à tour de rôle en dessinant une ligne entre deux points (ou en boucle sur un seul point) et en ajoutant un nouveau point sur cette ligne.</li>
          <li>Les lignes ne peuvent pas traverser des lignes ou des points existants.</li>
          <li>Aucun point ne peut avoir plus de trois lignes qui en sortent.</li>
          <li>Le joueur qui ne peut plus jouer perd la partie.</li>
        </ol>
        <p className="text-gray-600">
          L'objectif est d'être le dernier joueur à pouvoir dessiner une ligne. Bonne chance !
        </p>
      </div>
    </div>
  );
};

export default RulesPage;
