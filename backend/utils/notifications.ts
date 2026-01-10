// utils/notifications.ts
import { logger } from '../logger';

export const showSuccessNotification = (message: string) => {
  // Hier könntest du ein Toast-System wie react-toastify integrieren
  logger.info({ message }, 'Success notification');
  // Oder einfache Browser Notification
  if (Notification.permission === 'granted') {
    new Notification('Erfolg', { body: message });
  }
};

export const showErrorNotification = (message: string) => {
  logger.error({ message }, 'Error notification');
  // Toast für Fehler anzeigen
};

export const showCriticalAlert = (critical: { title: string; message: string }) => {
  // Für kritische Sicherheitsprobleme
  alert(`🚨 ${critical.title}\n\n${critical.message}`);
};