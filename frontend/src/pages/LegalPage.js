import React from 'react';

const LegalPage = () => {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen flex items-center justify-center p-6 font-['Press_Start_2P'] text-sm text-yellow-300">
      <div className="bg-gray-800 border-4 border-yellow-400 p-6 sm:p-10 rounded-lg shadow-2xl max-w-4xl w-full overflow-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-yellow-300 text-center animate-pulse">
          Mentions Légales
        </h1>

        <p className="text-gray-300 mb-4 text-justify leading-relaxed">
          Ce site web est un projet universitaire développé dans le cadre d’un enseignement à l'ISEN Lille.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2 text-white underline underline-offset-4">Responsables du projet</h2>
        <p className="text-gray-300 mb-2">Ce projet a été réalisé par les étudiants de M1 :</p>
        <ul className="list-disc list-inside text-gray-300 mb-4 pl-4">
          <li>Théo DANIEL</li>
          <li>Maxence DE POORTER</li>
          <li>Marco FORDELONE</li>
          <li>Quentin PRUVOT</li>
          <li>Théo STOORDER</li>
          <li>Théo VANGHELUWE</li>
        </ul>
        <p className="text-gray-300 mb-6">
          Sous la supervision de Mme. BAUDEL Manon, enseignante à l'ISEN Lille.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2 text-white underline underline-offset-4">Hébergement</h2>
        <p className="text-gray-300 mb-6">
          Ce site est hébergé localement pour les besoins du développement et des démonstrations pédagogiques.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2 text-white underline underline-offset-4">Données personnelles</h2>
        <p className="text-gray-300 mb-6">
          Aucune donnée personnelle n’est collectée ni stockée à des fins commerciales. Les données utilisateurs sont uniquement utilisées pour le bon fonctionnement du jeu et ne sont jamais partagées avec des tiers.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2 text-white underline underline-offset-4">Conditions d'utilisation</h2>
        <p className="text-gray-300 mb-6">
          En accédant à ce site, l’utilisateur accepte les règles du jeu, les modalités d’usage, et s’engage à en faire une utilisation respectueuse dans le cadre du projet.
        </p>

        <p className="text-xs text-gray-400 mt-10 text-center">
          Dernière mise à jour : mai 2025
        </p>
      </div>
    </div>
  );
};

export default LegalPage;
