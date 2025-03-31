import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import GamePage from './pages/GamePage';
import HomePage from './pages/HomePage';
import RulesPage from './pages/RulesPage';
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
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
