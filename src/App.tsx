import { useState, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import QuizContainer from './features/quiz/components/QuizContainer';
import VocabularyList from './features/vocabulary/components/VocabularyList';
import ProfileCard from './features/user/components/ProfileCard';
import { useUserProfile } from './features/user/hooks/useUserProfile';
import { essentialEnglish } from './data/vocabularyPacks/essential-english';
import { academicEnglish } from './data/vocabularyPacks/academic-english';
import { businessEnglish } from './data/vocabularyPacks/business-english';
import { QuizItem } from './features/quiz/types';
import './App.css';

type AppTab = 'quiz' | 'vocabulary' | 'profile' | 'simulation';

/** Merge all built-in packs into a single flat vocabulary list for the quiz. */
function getAllVocabulary(): QuizItem[] {
  return [
    ...essentialEnglish.items,
    ...academicEnglish.items,
    ...businessEnglish.items,
  ];
}

function App() {
  const [tab, setTab] = useState<AppTab>('quiz');
  const { profile, recordSessionResponses, exportData, importData, resetAll } =
    useUserProfile();

  const allVocabulary = useMemo(() => getAllVocabulary(), []);

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
          className={`app-nav__tab ${tab === 'vocabulary' ? 'app-nav__tab--active' : ''}`}
          onClick={() => setTab('vocabulary')}
        >
          Vocabulary
        </button>
        <button
          className={`app-nav__tab ${tab === 'profile' ? 'app-nav__tab--active' : ''}`}
          onClick={() => setTab('profile')}
        >
          Profile
        </button>
        <button
          className={`app-nav__tab ${tab === 'simulation' ? 'app-nav__tab--active' : ''}`}
          onClick={() => setTab('simulation')}
        >
          Simulation Lab
        </button>
      </nav>

      <main className="app-main">
        {tab === 'quiz' && (
          <QuizContainer
            vocabulary={allVocabulary}
            onSessionComplete={recordSessionResponses}
          />
        )}
        {tab === 'vocabulary' && <VocabularyList />}
        {tab === 'profile' && (
          <ProfileCard
            profile={profile}
            onExport={exportData}
            onImport={importData}
            onReset={resetAll}
          />
        )}
        {tab === 'simulation' && <Dashboard />}
      </main>

      <footer className="app-footer">
        <p>CS 6795 - Cognitive Science | Georgia Tech | Spring 2026</p>
      </footer>
    </div>
  );
}

export default App;
