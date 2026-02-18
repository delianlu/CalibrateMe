import { GamificationNotification } from '../types';

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
  if (notifications.length === 0) return null;

  return (
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
      <button className="notification-toast__dismiss btn btn-primary" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
