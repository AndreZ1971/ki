import { useTranslation } from 'react-i18next';

export function useChatbotGreeting() {
  const { t } = useTranslation('common');
  // You can extend this logic for more dynamic greetings if needed
  const greetings = [
    t('chatbot.greeting', 'Hi, ich bin Ari. 🤖 Ich bin dein neuer digitaler Mitarbeiter. Ich schlafe nie, mache keine Kaffeepausen und kenne deine Lagerbestände auswendig.')
  ];
  return greetings;
}
