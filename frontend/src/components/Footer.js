import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t-4 border-yellow-400 text-yellow-300 font-['Press_Start_2P'] text-xs text-center py-4 px-2 tracking-tight">
      © 2025 Sprouts Game. Tous droits réservés.&nbsp;
      <a
        href="/legal/"
        className="text-white hover:text-yellow-300 transition"
      >
        Mentions Légales
      </a>
    </footer>
  );
};

export default Footer;
