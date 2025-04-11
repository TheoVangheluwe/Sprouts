import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import RulesPage from './pages/RulesPage';
import WaitingRoom from './components/game/WaitingRoom';
import OnlineGame from './components/Online/OnlineGame';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/online-game/:gameId" element={<OnlineGame />} />
          </Routes>
        </main>
        <Footer />
      </div>
        
    </Router>
  );
};

export default App;