import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="text-lg font-bold">Sprouts Game</div>
        <ul className="flex space-x-4">
          <li>
            <Link to="/" className="hover:text-gray-300">Home</Link>
          </li>
          <li>
            <Link to="/game" className="hover:text-gray-300">Game</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
