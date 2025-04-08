import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RulesPage from './pages/RulesPage';
import MenuPage from './pages/MenuPage';
import LocalGameOptions from './pages/LocalGameOptions';
import PVPGamePage from './pages/PVPGamePage';
import PVEGamePage from './pages/PVEGamePage.js';

const App = () => {
  return (
    <Router>
      <div className="h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<MenuPage />} />
            <Route path="/local" element={<LocalGameOptions />} />
            <Route path="/local/pvp" element={<PVPGamePage />} />
            <Route path="/local/pve" element={<PVEGamePage />} />
            <Route path="/rules" element={<RulesPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
