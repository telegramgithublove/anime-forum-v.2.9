import { createI18n } from 'vue-i18n';

// Определение языков
const messages = {
  en: {
    welcome: 'Welcome!',
    message: 'This is an internationalized message'
  },
  ru: {
    welcome: 'Добро пожаловать!',
    message: 'Это интернационализированное сообщение'
  }
};

// Создаем экземпляр i18n
const i18n = createI18n({
  locale: 'ru', // Язык по умолчанию
  fallbackLocale: 'en', // Запасной язык
  messages,
});

export default i18n;
