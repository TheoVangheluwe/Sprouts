import React from 'react';
import { Link } from 'react-router-dom';

const RulesPage = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 h-full font-arcade">
      <div className="bg-gray-800 border-4 border-yellow-400 p-8 rounded-lg shadow-2xl text-left w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 text-yellow-300 animate-pulse text-center">Règles du Jeu de Sprouts</h1>
        <p className="text-gray-300 mb-4">
          Bienvenue dans le jeu de Sprouts, un jeu de stratégie captivant inventé par les mathématiciens John H. Conway et Michael S. Paterson. Ce jeu se joue avec un papier et un crayon et peut être apprécié par des joueurs de tous âges. Voici comment y jouer :
        </p>
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Objectif du Jeu</h2>
        <p className="text-gray-300 mb-4">
          L'objectif est d'être le dernier joueur capable de dessiner une ligne conforme aux règles. Le joueur qui ne peut plus jouer perd la partie.
        </p>
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Mise en Place</h2>
        <p className="text-gray-300 mb-4">
          Le jeu commence avec quelques points (généralement entre 3 et 5) dessinés sur une feuille de papier. Ces points sont appelés "pousses".
        </p>
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Déroulement du Jeu</h2>
        <ol className="text-gray-200 list-decimal list-inside mb-4">
          <li>Les joueurs jouent à tour de rôle.</li>
          <li>À chaque tour, un joueur doit dessiner une ligne qui relie deux points existants ou qui forme une boucle à partir d'un seul point.</li>
          <li>Après avoir dessiné la ligne, le joueur doit ajouter un nouveau point quelque part sur cette ligne.</li>
          <li>Les lignes ne peuvent pas traverser des lignes ou des points déjà existants.</li>
          <li>Chaque point ne peut avoir qu'un maximum de trois lignes qui en sortent. Une fois qu'un point a trois lignes, il est considéré comme "saturé" et ne peut plus être utilisé.</li>
        </ol>
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Fin de Partie</h2>
        <p className="text-gray-300 mb-4">
          Le jeu se termine lorsqu'un joueur ne peut plus effectuer de mouvement légal. Ce joueur perd la partie.
        </p>
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Stratégie et Conseils</h2>
        <ul className="text-gray-200 list-disc list-inside mb-4">
          <li><strong>Anticipation :</strong> Essayez d'anticiper les mouvements de votre adversaire pour limiter ses options.</li>
          <li><strong>Placement des Points :</strong> Placez les nouveaux points de manière à maximiser vos propres options futures tout en restreignant celles de votre adversaire.</li>
          <li><strong>Saturation :</strong> Soyez conscient du nombre de lignes sortant de chaque point pour éviter de saturer vos propres points trop rapidement.</li>
        </ul>
        <h2 className="text-2xl font-bold mb-2 text-yellow-300">Variantes</h2>
        <p className="text-gray-300 mb-4">
          Vous pouvez ajuster le nombre initial de points pour rendre le jeu plus court ou plus long. Pour des parties plus animées, essayez de jouer en équipes !
        </p>
        <p className="text-gray-300 mb-6">
          Le jeu de Sprouts est à la fois simple à apprendre et complexe à maîtriser, offrant des heures de divertissement et de défis stratégiques. Amusez-vous bien !
        </p>
        <Link
          to="/menu"
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-500 transform transition hover:scale-105 shadow-md w-full block text-center"
        >
          Retour au Menu
        </Link>
      </div>
    </div>
  );
};

export default RulesPage;
