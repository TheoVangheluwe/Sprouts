import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
//pages
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RulesPage from './pages/RulesPage';
import MenuPage from './pages/MenuPage';
import PVEGamePage from './pages/PVEGamePage';
import AIGamePage from './pages/AIGamePage';
import WaitingRoom from './components/game/WaitingRoom';
import OnlinePage from './pages/OnlinePage';
import LegalPage from './pages/LegalPage';
import HistoricPage from './pages/HistoricPage';
import GameSummaryPage from './pages/GameSummaryPage';
import MenuProfilPage from './pages/MenuProfilPage';
import TechnicPDF_Page from './pages/TechnicPage';

const App = () => {
  return (
    <Router>
      <div className="bg-gradient-to-br from-gray-900 to-black h-screen flex flex-col">
        <Header />
        <main className="bg-gradient-to-br from-gray-900 to-black flex-1">
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/pve" element={<PVEGamePage />} />
            <Route path="/ai" element={<AIGamePage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/online-game/:gameId" element={<OnlinePage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/historic" element={<HistoricPage />} />
            <Route path="/historic/:gameId" element={<GameSummaryPage />} />
            <Route path="/profil" element={<MenuProfilPage />} />
            <Route path="/technic" element={<TechnicPDF_Page />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </Router>
  );
};

export default App;
