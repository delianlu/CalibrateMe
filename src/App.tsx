import { useState, useMemo, useCallback, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import QuizContainer from './features/quiz/components/QuizContainer';
import VocabularyList from './features/vocabulary/components/VocabularyList';
import ProfileCard from './features/user/components/ProfileCard';
import CalibrationDashboard from './features/analytics/components/CalibrationDashboard';
import GamificationPanel from './features/gamification/components/GamificationPanel';
import NotificationToast from './features/gamification/components/NotificationToast';
import { useUserProfile } from './features/user/hooks/useUserProfile';
import { essentialEnglish } from './data/vocabularyPacks/essential-english';
import { academicEnglish } from './data/vocabularyPacks/academic-english';
import { businessEnglish } from './data/vocabularyPacks/business-english';
import { GamificationState, createDefaultGamificationState } from './features/gamification/types';
import { processSession, clearNotifications } from './features/gamification/gamificationEngine';
import { QuizItem, QuizResponse } from './features/quiz/types';
import './App.css';

type AppTab = 'quiz' | 'vocabulary' | 'analytics' | 'profile' | 'simulation';

function getAllVocabulary(): QuizItem[] {
  return [
    ...essentialEnglish.items,
    ...academicEnglish.items,
    ...businessEnglish.items,
  ];
}

const GAMIFICATION_KEY = 'calibrateme_gamification';

function loadGamification(): GamificationState {
  try {
    const raw = localStorage.getItem(GAMIFICATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* use default */ }
  return createDefaultGamificationState();
}

function App() {
  const [tab, setTab] = useState<AppTab>('quiz');
  const [allResponses, setAllResponses] = useState<QuizResponse[]>([]);
  const [gamification, setGamification] = useState<GamificationState>(loadGamification);
  const { profile, recordSessionResponses, updatePreferences, exportData, importData, resetAll } =
    useUserProfile();

  const allVocabulary = useMemo(() => getAllVocabulary(), []);

  // Persist gamification state
  useEffect(() => {
    localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(gamification));
  }, [gamification]);

  // Dark mode: apply theme attribute to root element
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      profile.preferences.darkMode ? 'dark' : 'light'
    );
  }, [profile.preferences.darkMode]);

  const toggleDarkMode = useCallback(() => {
    updatePreferences({ darkMode: !profile.preferences.darkMode });
  }, [profile.preferences.darkMode, updatePreferences]);

  const handleDismissNotifications = useCallback(() => {
    setGamification(prev => clearNotifications(prev));
  }, []);

  const handleSessionComplete = useCallback(
    (responses: QuizResponse[], kHat: number, betaHat: number) => {
      setAllResponses(prev => [...prev, ...responses]);
      recordSessionResponses(responses, kHat, betaHat);

      // Update gamification
      setGamification(prev => {
        const totalCorrect = responses.filter(r => r.correctness).length;
        const accuracy = responses.length > 0 ? totalCorrect / responses.length : 0;
        const masteredCount = Object.values(profile.itemStates).filter(
          s => s.masteryLevel === 'mastered'
        ).length;

        return processSession(prev, {
          responses,
          sessionECE: kHat,
          totalSessions: profile.stats.totalSessions + 1,
          totalReviews: profile.stats.totalReviews + responses.length,
          accuracy,
          currentStreak: profile.stats.currentStreak,
          masteredItems: masteredCount,
        });
      });
    },
    [recordSessionResponses, profile.itemStates, profile.stats]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__content">
          <h1>CalibrateMe</h1>
          <p>Metacognitive Calibration in Adaptive Learning</p>
        </div>
        <button
          className="app-header__theme-toggle"
          onClick={toggleDarkMode}
          title={profile.preferences.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {profile.preferences.darkMode ? 'Light' : 'Dark'}
        </button>
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
          className={`app-nav__tab ${tab === 'analytics' ? 'app-nav__tab--active' : ''}`}
          onClick={() => setTab('analytics')}
        >
          Analytics
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
            onSessionComplete={handleSessionComplete}
          />
        )}
        {tab === 'vocabulary' && <VocabularyList />}
        {tab === 'analytics' && (
          <CalibrationDashboard
            responses={allResponses}
            itemStates={profile.itemStates}
          />
        )}
        {tab === 'profile' && (
          <>
            <GamificationPanel state={gamification} />
            <ProfileCard
              profile={profile}
              onExport={exportData}
              onImport={importData}
              onReset={resetAll}
            />
          </>
        )}
        {tab === 'simulation' && <Dashboard />}
      </main>

      {/* Gamification notifications */}
      <NotificationToast
        notifications={gamification.pendingNotifications}
        onDismiss={handleDismissNotifications}
      />

      <footer className="app-footer">
        <p>CS 6795 - Cognitive Science | Georgia Tech | Spring 2026</p>
      </footer>
    </div>
  );
}

export default App;
