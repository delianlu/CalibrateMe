import { useEffect, useRef } from 'react';
import { GamificationNotification } from '../types';
import { celebrations } from '../../../utils/celebrations';

interface NotificationToastProps {
  notifications: GamificationNotification[];
  onDismiss: () => void;
}

function getNotificationIcon(type: GamificationNotification['type']): string {
  switch (type) {
    case 'level-up': return 'UP';
    case 'achievement': return 'ACH';
    case 'streak': return 'STR';
  }
}

export default function NotificationToast({ notifications, onDismiss }: NotificationToastProps) {
  const hasFiredRef = useRef(false);

  // Fire canvas-confetti celebrations when notifications appear
  useEffect(() => {
    if (notifications.length === 0 || hasFiredRef.current) return;
    hasFiredRef.current = true;

    const hasLevelUp = notifications.some(n => n.type === 'level-up');
    const hasAchievement = notifications.some(n => n.type === 'achievement');
    const hasStreak = notifications.some(n => n.type === 'streak');

    if (hasLevelUp) {
      celebrations.levelUp();
    } else if (hasAchievement) {
      celebrations.achievementUnlocked();
    } else if (hasStreak) {
      celebrations.streakMilestone();
    }
  }, [notifications]);

  // Reset ref when notifications are cleared
  useEffect(() => {
    if (notifications.length === 0) {
      hasFiredRef.current = false;
    }
  }, [notifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="notification-toast-container" role="alert" aria-live="polite">
      {notifications.map(n => (
        <div key={n.id} className={`notification-toast notification-toast--${n.type}`}>
          <span className="notification-toast__icon">{getNotificationIcon(n.type)}</span>
          <div className="notification-toast__content">
            <strong>{n.title}</strong>
            <p>{n.message}</p>
          </div>
        </div>
      ))}
      <button
        className="notification-toast__dismiss btn btn-primary"
        aria-label="Dismiss notifications"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
