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
import MultiplayerGamePage from './pages/MultiplayerGamePage';
import WaitingRoom from './components/game/WaitingRoom';
import OnlineGame from './components/online/OnlineGame';
import LegalPage from './pages/LegalPage';
import HistoricPage from './pages/HistoricPage';
import GameSummaryPage from './pages/GameSummaryPage';

const App = () => {
  return (
    <Router>
      <div className="h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/home" element={<HomePage />} />
            <Route path="/game" element={<MenuPage />} />
            <Route path="/pve" element={<PVEGamePage />} />
            <Route path="/ai" element={<AIGamePage />} />
            <Route path="/multiplayer" element={<MultiplayerGamePage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/online-game/:gameId" element={<OnlineGame />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/historic" element={<HistoricPage />} />
            <Route path="/game-summary/:gameId" element={<GameSummaryPage />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </Router>
  );
};

export default App;
