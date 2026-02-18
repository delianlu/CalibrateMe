import { useState, useCallback, useRef } from 'react';
import { QuizItem, QuizResponse, QuizSessionState } from '../types';
import { QuizService } from '../services/quizService';
import { useResponseTimer } from './useResponseTimer';

const ITEMS_PER_SESSION = 20;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Core quiz session hook — manages the entire quiz lifecycle.
 *
 * Flow per item:
 *   show-word → rate-confidence → reveal-answer → feedback → (next item or completed)
 */
export function useQuizSession() {
  const [session, setSession] = useState<QuizSessionState | null>(null);
  const serviceRef = useRef<QuizService>(new QuizService());
  const timer = useResponseTimer();

  // ── Start a new session ──────────────────────────────────────────
  const startSession = useCallback((items: QuizItem[]) => {
    const service = new QuizService();
    service.loadItems(items);
    serviceRef.current = service;

    const selectedIds = service.selectItems(ITEMS_PER_SESSION);
    const itemMap = new Map(items.map(i => [i.id, i]));
    const sessionItems = selectedIds
      .map(id => itemMap.get(id))
      .filter((i): i is QuizItem => i !== undefined);

    // If fewer items available than requested, use what we have
    const finalItems = sessionItems.length > 0 ? sessionItems : items.slice(0, ITEMS_PER_SESSION);

    setSession({
      id: generateId(),
      startTime: new Date(),
      items: finalItems,
      responses: [],
      currentIndex: 0,
      phase: 'show-word',
      currentConfidence: 50,
      paused: false,
    });

    timer.start();
  }, [timer]);

  // ── Submit confidence rating → reveal answer ─────────────────────
  const submitConfidence = useCallback((confidence: number) => {
    setSession(prev => {
      if (!prev || prev.phase !== 'rate-confidence') return prev;
      return { ...prev, currentConfidence: confidence, phase: 'reveal-answer' };
    });
  }, []);

  // ── Advance from show-word to rate-confidence ────────────────────
  const flipCard = useCallback(() => {
    setSession(prev => {
      if (!prev || prev.phase !== 'show-word') return prev;
      return { ...prev, phase: 'rate-confidence' };
    });
  }, []);

  // ── Submit correctness (self-grade) → feedback ───────────────────
  const submitAnswer = useCallback((correct: boolean) => {
    const rt = timer.stop();

    setSession(prev => {
      if (!prev || prev.phase !== 'reveal-answer') return prev;

      const currentItem = prev.items[prev.currentIndex];
      const response: QuizResponse = {
        itemId: currentItem.id,
        correctness: correct,
        confidence: prev.currentConfidence,
        responseTime: rt,
        timestamp: new Date(),
      };

      // Feed into CalibrateMe engine
      serviceRef.current.recordResponse(response);

      return {
        ...prev,
        responses: [...prev.responses, response],
        phase: 'feedback',
      };
    });
  }, [timer]);

  // ── Move to next item or complete ────────────────────────────────
  const nextItem = useCallback(() => {
    timer.start();

    setSession(prev => {
      if (!prev || prev.phase !== 'feedback') return prev;

      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.items.length) {
        return { ...prev, phase: 'completed' };
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        phase: 'show-word',
        currentConfidence: 50,
      };
    });
  }, [timer]);

  // ── Pause / Resume ──────────────────────────────────────────────
  const togglePause = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      return { ...prev, paused: !prev.paused };
    });
  }, []);

  // ── End session early ───────────────────────────────────────────
  const endSession = useCallback(() => {
    timer.reset();
    setSession(null);
  }, [timer]);

  // ── Derived state ───────────────────────────────────────────────
  const currentItem: QuizItem | null =
    session && session.currentIndex < session.items.length
      ? session.items[session.currentIndex]
      : null;

  const progress = session
    ? { current: session.responses.length, total: session.items.length }
    : { current: 0, total: 0 };

  const sessionStats = session ? {
    totalItems: session.items.length,
    completed: session.responses.length,
    correct: session.responses.filter(r => r.correctness).length,
    avgConfidence: session.responses.length > 0
      ? session.responses.reduce((s, r) => s + r.confidence, 0) / session.responses.length
      : 0,
    avgRT: session.responses.length > 0
      ? session.responses.reduce((s, r) => s + r.responseTime, 0) / session.responses.length
      : 0,
    calibrationMetrics: serviceRef.current.getCalibrationMetrics(),
  } : null;

  return {
    // State
    session,
    currentItem,
    progress,
    sessionStats,
    isActive: session !== null && session.phase !== 'completed',
    isCompleted: session?.phase === 'completed',

    // Actions
    startSession,
    flipCard,
    submitConfidence,
    submitAnswer,
    nextItem,
    togglePause,
    endSession,
  };
}
