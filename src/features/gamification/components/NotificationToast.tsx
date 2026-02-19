import { useState } from 'react';
import { GamificationNotification } from '../types';
import ConfettiEffect from './ConfettiEffect';

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
  const [confettiActive, setConfettiActive] = useState(true);

  if (notifications.length === 0) return null;

  // Determine confetti variant: level-up takes priority, then achievement
  const hasLevelUp = notifications.some(n => n.type === 'level-up');
  const hasAchievement = notifications.some(n => n.type === 'achievement');
  const showConfetti = hasLevelUp || hasAchievement;
  const confettiVariant = hasLevelUp ? 'level-up' as const : 'achievement' as const;

  return (
    <>
      {showConfetti && (
        <ConfettiEffect
          active={confettiActive}
          variant={confettiVariant}
          onComplete={() => setConfettiActive(false)}
        />
      )}
      <div className="notification-toast-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification-toast notification-toast--${n.type}`}>
            <span className="notification-toast__icon">{getNotificationIcon(n.type)}</span>
            <div className="notification-toast__content">
              <strong>{n.title}</strong>
              <p>{n.message}</p>
            </div>
          </div>
        ))}
        <button className="notification-toast__dismiss btn btn-primary" onClick={() => {
          setConfettiActive(true); // Reset for next time
          onDismiss();
        }}>
          Dismiss
        </button>
      </div>
    </>
  );
}
