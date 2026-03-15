import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  BookOpen,
  BarChart3,
  User,
  Gamepad2,
  FlaskConical,
  Sun,
  Moon,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
import { getOffGridActivities } from './data/offgridAdapter';
import { GamificationState, createDefaultGamificationState } from './features/gamification/types';
import { processSession, clearNotifications } from './features/gamification/gamificationEngine';
import { MiniGameContainer } from './features/minigame';
import { saveSessionToProvider } from './features/api/apiClient';
import { getRecentResponses } from './features/user/services/storageService';
import ErrorBoundary from './components/ErrorBoundary';
import DemoOverlay from './components/DemoOverlay';
import SplitScreenDemo from './components/SplitScreenDemo';
import { QuizItem, QuizResponse } from './features/quiz/types';
import './App.css';

type AppTab = 'quiz' | 'vocabulary' | 'analytics' | 'profile' | 'simulation' | 'minigame';

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof Brain }[] = [
  { id: 'quiz', label: 'Practice', icon: Brain },
  { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'minigame', label: 'Cal Game', icon: Gamepad2 },
  { id: 'simulation', label: 'Sim Lab', icon: FlaskConical },
];

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

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function App() {
  // URL parameter: ?splitscreen=true → show full-screen split-screen demo
  const showSplitScreen = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('splitscreen') === 'true';
  }, []);

  const [tab, setTab] = useState<AppTab>('quiz');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('calibrateme_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [allResponses, setAllResponses] = useState<QuizResponse[]>([]);
  const [gamification, setGamification] = useState<GamificationState>(loadGamification);
  const { profile, recordSessionResponses, updatePreferences, exportData, importData, resetAll } =
    useUserProfile();

  const allVocabulary = useMemo(() => getAllVocabulary(), []);
  const grammarActivities = useMemo(() => getOffGridActivities(), []);

  // Load persisted responses from IndexedDB on mount
  useEffect(() => {
    getRecentResponses(5000).then(records => {
      if (records.length > 0) {
        const restored: QuizResponse[] = records.map(r => ({
          itemId: r.itemId,
          correctness: r.correctness,
          confidence: r.confidence,
          responseTime: r.responseTime,
          timestamp: new Date(r.timestamp),
        }));
        setAllResponses(restored);
      }
    }).catch(console.error);
  }, []);

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

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('calibrateme_sidebar_collapsed', String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

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

      // Persist session via data provider
      const now = new Date().toISOString();
      saveSessionToProvider({
        userId: profile.id,
        responses: responses.map(r => ({
          itemId: r.itemId,
          correctness: r.correctness,
          confidence: r.confidence,
          responseTime: r.responseTime,
          timestamp: r.timestamp.toISOString(),
        })),
        globalKHat: kHat,
        globalBetaHat: betaHat,
        sessionECE: kHat,
        startedAt: now,
        completedAt: now,
      }).catch(console.error);

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

  const isDark = profile.preferences.darkMode;

  const handleDemoNavigate = useCallback((demoTab: string) => {
    setTab(demoTab as AppTab);
  }, []);

  // Full-screen split-screen demo mode
  if (showSplitScreen) {
    return <SplitScreenDemo />;
  }

  return (
    <div className={`app${sidebarCollapsed ? ' app--sidebar-collapsed' : ''}${(tab === 'simulation' || tab === 'analytics') ? ' app--hide-footer' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* ── Sidebar Navigation (desktop) ── */}
      <aside className={`app-sidebar${sidebarCollapsed ? ' app-sidebar--collapsed' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="app-sidebar__brand">
          <div className="app-sidebar__brand-logo">
            <GraduationCap size={24} />
          </div>
          <span className="app-sidebar__brand-text">CalibrateMe</span>
        </div>

        <nav className="app-sidebar__nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`app-sidebar__item ${tab === id ? 'app-sidebar__item--active' : ''}`}
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              title={label}
            >
              <Icon size={20} />
              <span className="app-sidebar__item-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <button
            className="app-sidebar__collapse-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            className="app-sidebar__theme-toggle"
            onClick={toggleDarkMode}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </aside>

      {/* ── Bottom Navigation (mobile) ── */}
      <nav className="app-bottomnav" role="navigation" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`app-bottomnav__item ${tab === id ? 'app-bottomnav__item--active' : ''}`}
            onClick={() => setTab(id)}
            aria-label={label}
            aria-current={tab === id ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <div className="app-content">
        {/* Top bar */}
        <header className="app-topbar">
          <div className="app-topbar__title-group">
            <h1 className="app-topbar__title">
              {NAV_ITEMS.find(n => n.id === tab)?.label}
            </h1>
            <span className="app-topbar__subtitle">
              Metacognitive Calibration in Adaptive Learning
            </span>
          </div>
          <div className="app-topbar__actions">
            <button
              className="app-topbar__theme-toggle"
              onClick={toggleDarkMode}
              title={isDark ? 'Light mode' : 'Dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Page content with transitions */}
        <main id="main-content" className="app-main">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {tab === 'quiz' && (
                  <QuizContainer
                    vocabulary={allVocabulary}
                    grammarActivities={grammarActivities}
                    onSessionComplete={handleSessionComplete}
                  />
                )}
                {tab === 'vocabulary' && <VocabularyList />}
                {tab === 'analytics' && (
                  <CalibrationDashboard
                    responses={allResponses}
                    itemStates={profile.itemStates}
                    betaHat={profile.learnerState.globalBetaHat}
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
                {tab === 'minigame' && <MiniGameContainer onClose={() => setTab('quiz')} />}
                {tab === 'simulation' && <Dashboard />}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>

        <footer className="app-footer">
          <p>CS 6795 - Cognitive Science | Georgia Tech | Spring 2026</p>
        </footer>
      </div>

      {/* Gamification notifications */}
      <NotificationToast
        notifications={gamification.pendingNotifications}
        onDismiss={handleDismissNotifications}
      />

      {/* Demo walkthrough overlay */}
      <DemoOverlay onNavigate={handleDemoNavigate} />
    </div>
  );
}

export default App;
