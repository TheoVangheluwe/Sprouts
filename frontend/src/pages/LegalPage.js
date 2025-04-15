import React from 'react';

const LegalPage = () => {
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl text-left">
        <h1 className="text-3xl font-bold mb-4">Mentions légales</h1>
        <p className="text-gray-600 mb-4">
          Ce site web est un projet universitaire développé dans le cadre d’un enseignement à l'ISEN Lille.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Responsables du projet</h2>
        <p className="text-gray-700 mb-2">
          Ce projet a été réalisé par ces étudiants de M1 :
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-4">
          <li>Théo DANIEL</li>
          <li>Maxence DE POORTER</li>
          <li>Marco FORDELONE</li>
          <li>Quentin PRUVOT</li>
          <li>Théo STOORDER</li>
          <li>Théo VANGHELUWE</li>
        </ul>
        <p className="text-gray-700 mb-2">
          Sous la superivsion de Mme. BAUDEL Manon, enseignante à l'ISEN Lille.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Hébergement</h2>
        <p className="text-gray-700 mb-2">
          Ce site est hébergé localement pour les besoins du développement et des démonstrations pédagogiques.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Données personnelles</h2>
        <p className="text-gray-700 mb-2">
          Aucune donnée personnelle n’est collectée ni stockée à des fins commerciales. Les données utilisateurs sont uniquement utilisées pour le bon fonctionnement du jeu et ne sont jamais partagées avec des tiers.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">Conditions d'utilisation</h2>
        <p className="text-gray-700 mb-2">
          En accédant à ce site, l’utilisateur accepte les règles du jeu, les modalités d’usage, et s’engage à en faire une utilisation respectueuse dans le cadre du projet.
        </p>

        <p className="text-sm text-gray-500 mt-6">
          Dernière mise à jour : avril 2025
        </p>
      </div>
    </div>
  );
};

export default LegalPage;
