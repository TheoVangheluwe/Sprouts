import React from 'react';
import logo from './sprouts.png';
//import { Link } from 'react-router-dom';

const Header = () => {
  return (
      <header className="bg-darkBlue text-white p-4">
        <nav className="container mx-auto flex items-center">

          {/* Left Section: Logo and Sprouts Game */}
          <div className="flex items-center space-x-4 w-1/3 justify-start">
            <img src={logo} alt="Logo" className="h-30 w-auto" />
            <div className="text-xl font-bold text-lightGreen">Sprouts Game</div>
          </div>

          {/* Center Section: Navigation Links */}
          <div className="flex w-1/3 justify-center">
            <ul className="flex space-x-6 text-lg">
              <li>
                <a href="/" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
                  Home
                </a>
              </li>
              <li>
                <a href="/game" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
                  Game
                </a>
              </li>
              <li>
                <a href="/rules" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
                  Rules
                </a>
              </li>
            </ul>
          </div>

          {/* Right Section: Login Link */}
          <div className="w-1/3 flex justify-end">
            <a href="/login" className="text-lightGreen hover:text-softBlue transition-colors duration-300">
              Log in
            </a>
          </div>

        </nav>
      </header>
  );
};

export default Header;
