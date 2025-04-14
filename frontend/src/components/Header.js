import React from 'react';
import logo from '../assets/sprouts.png'

const Header = () => {
  return (
      <header className="bg-darkBlue text-white p-4">
        <nav className="container mx-auto flex items-center">

          {/* Left Section: Logo and Sprouts Game */}
          <div className="flex items-center space-x-4 w-1/3 justify-start">
            <img src={logo} alt="Logo" style={{ height: '3.5rem' }} className="w-auto" /> {/* 33px = 8.25rem */}
            <a href="/home"><div className="text-xl font-bold text-lightGreen">Sprouts Game</div></a>
          </div>

          {/* Center Section: Navigation Links */}
          <div className="flex w-1/3 justify-center">
            <ul className="flex space-x-6 text-lg">
              {/*<li>
                <a href="/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
                  Home
                </a>
              </li>*/}
              <li>
                <a href="/game/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
                  Jeu
                </a>
              </li>
              <li>
                <a href="/rules/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
                  Règles
                </a>
              </li>
              <li>
                <a href="/historic/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
                  Historique
                </a>
              </li>
            </ul>
          </div>

          {/* Right Section: Login Link */}
          <div className="w-1/3 flex justify-end">
            <a href="/login/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
              Connexion
            </a>
          </div>

        </nav>
      </header>
  );
};

export default Header;
