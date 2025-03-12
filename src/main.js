import { createApp } from 'vue';
import App from './App.vue';
import router from './plugins/router';
import store from './store/store';
import './style.css';
import 'tailwindcss/tailwind.css';
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import VuePlyr from 'vue-plyr';
import 'vue-plyr/dist/vue-plyr.css';
import Vue3AudioPlayer from 'vue3-audio-player';
import 'vue3-audio-player/dist/style.css';
import i18n from './i18n'; // Импортируем i18n

// Импорт auth из firebase.js
import { auth } from './plugins/firebase'; // Корректный импорт auth
import { onAuthStateChanged } from 'firebase/auth'; // Firebase наблюдатель за аутентификацией

// Опции для Toast
const toastOptions = {
    position: "top-right",
    timeout: 3000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false
}

console.log('App: Начало инициализации...');

// Создание Vue-приложения
const app = createApp(App);

// main.js
const myWorker = new Worker(new URL('./workers/worker.js', import.meta.url)); // Укажите путь к воркеру

// Обработчик сообщения от воркера
myWorker.onmessage = (e) => {
  console.log('Message from worker:', e.data); // Получение ответа от воркера
};

myWorker.postMessage('Hello, worker!');

// Использование плагинов
app.use(i18n);
app.use(router);
app.use(store);
app.use(Toast, toastOptions);
app.use(VuePlyr, {
  plyr: {}
});

// Регистрируем vue3-audio-player глобально
app.component('vue3-audio-player', Vue3AudioPlayer);

// Наблюдатель за состоянием аутентификации
onAuthStateChanged(auth, async (user) => {
    console.log('Auth: Изменение состояния аутентификации:', user?.email);
    if (user) {
        await user.reload();
        console.log('Auth: Пользователь авторизован:', user.email);
        await store.dispatch('auth/setUser', {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified
        });
        await store.dispatch('profile/fetchProfile', user.uid);
    } else {
        console.log('Auth: Пользователь не авторизован');
        await store.dispatch('auth/setUser', null);
    }
});

// Монтируем приложение
app.mount('#app');

console.log('App: Инициализация завершена');