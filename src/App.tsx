import { useState } from 'react';
import Dashboard from './components/Dashboard';
import QuizContainer from './features/quiz/components/QuizContainer';
import './App.css';

type AppTab = 'quiz' | 'simulation';

function App() {
  const [tab, setTab] = useState<AppTab>('quiz');

  return (
    <div className="app">
      <header className="app-header">
        <h1>CalibrateMe</h1>
        <p>Metacognitive Calibration in Adaptive Learning</p>
      </header>

      <nav className="app-nav">
        <button
          className={`app-nav__tab ${tab === 'quiz' ? 'app-nav__tab--active' : ''}`}
          onClick={() => setTab('quiz')}
        >
          Practice
        </button>
        <button
          className={`app-nav__tab ${tab === 'simulation' ? 'app-nav__tab--active' : ''}`}
          onClick={() => setTab('simulation')}
        >
          Simulation Lab
        </button>
      </nav>

      <main className="app-main">
        {tab === 'quiz' ? <QuizContainer /> : <Dashboard />}
      </main>

      <footer className="app-footer">
        <p>CS 6795 - Cognitive Science | Georgia Tech | Spring 2026</p>
      </footer>
    </div>
  );
}

export default App;
