<template>
  <div class="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <!-- Блок верификации -->
    <div class="max-w-3xl mx-auto mb-8 overflow-hidden">
      <div class="relative bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-8">
        <div class="absolute top-0 left-0 w-full h-full bg-white opacity-10 transform rotate-12 translate-x-12"></div>
        
        <!-- Заголовок -->
        <div class="relative flex items-center mb-6">
          <span class="material-icons text-white text-4xl mr-4">verified_user</span>
          <h2 class="text-2xl font-bold text-white">Подтверждение Email</h2>
        </div>

        <!-- Описание -->
        <div class="relative space-y-4 text-white">
          <p class="text-lg opacity-90">
            Для полного доступа к функционалу сайта необходимо подтвердить ваш email.
          </p>
          
          <!-- Список доступных функций -->
          <div class="mt-6">
            <h3 class="font-semibold mb-3">После подтверждения вам будут доступны:</h3>
            <ul class="space-y-2">
              <li class="flex items-center">
                <span class="material-icons text-green-300 mr-2">check_circle</span>
                <span>Создание тем на форуме</span>
              </li>
              <li class="flex items-center">
                <span class="material-icons text-green-300 mr-2">check_circle</span>
                <span>Комментирование постов</span>
              </li>
              <li class="flex items-center">
                <span class="material-icons text-green-300 mr-2">check_circle</span>
                <span>Личные сообщения</span>
              </li>
              <li class="flex items-center">
                <span class="material-icons text-green-300 mr-2">check_circle</span>
                <span>Полный доступ к профилю</span>
              </li>
            </ul>
          </div>

          <!-- Кнопки действий -->
          <div class="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              @click="resendVerification"
              class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200"
            >
              <span class="material-icons mr-2">send</span>
              Отправить письмо повторно
            </button>
            <button
              @click="goToProfile"
              class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 bg-opacity-30 hover:bg-opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-all duration-200"
            >
              <span class="material-icons mr-2">person</span>
              Перейти в профиль
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Уведомление -->
    <div class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      <transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showNotification" class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5">
          <div class="p-4">
            <div class="flex items-start">
              <!-- Иконка успеха -->
              <div v-if="type === 'success'" class="flex-shrink-0">
                <span class="flex h-10 w-10 rounded-full bg-green-100 justify-center items-center">
                  <span class="material-icons text-green-600">check_circle</span>
                </span>
              </div>
              <!-- Иконка ошибки -->
              <div v-else-if="type === 'error'" class="flex-shrink-0">
                <span class="flex h-10 w-10 rounded-full bg-red-100 justify-center items-center">
                  <span class="material-icons text-red-600">error</span>
                </span>
              </div>
              <!-- Иконка предупреждения -->
              <div v-else-if="type === 'warning'" class="flex-shrink-0">
                <span class="flex h-10 w-10 rounded-full bg-yellow-100 justify-center items-center">
                  <span class="material-icons text-yellow-600">warning</span>
                </span>
              </div>
              <!-- Иконка информации -->
              <div v-else class="flex-shrink-0">
                <span class="flex h-10 w-10 rounded-full bg-blue-100 justify-center items-center">
                  <span class="material-icons text-blue-600">info</span>
                </span>
              </div>

              <div class="ml-3 w-0 flex-1">
                <p class="text-sm font-medium text-gray-900">{{ title }}</p>
                <p class="mt-1 text-sm text-gray-500">{{ message }}</p>
              </div>

              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="closeNotification"
                  class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span class="sr-only">Закрыть</span>
                  <span class="material-icons">close</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Прогресс-бар для автозакрытия -->
          <div
            v-if="duration > 0"
            class="h-1 bg-indigo-100 rounded-b-lg"
          >
            <div
              class="h-1 bg-indigo-600 rounded-b-lg transition-all duration-300"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

const currentUserId = computed(() => store.getters['auth/getUserId']);

const showNotification = ref(false);
const type = ref('success');
const title = ref('Уведомление отправлено');
const message = ref('Проверьте вашу электронную почту');
const duration = ref(5000);
const progress = ref(100);

let timer = null;
let progressTimer = null;

const closeNotification = () => {
  showNotification.value = false;
  clearTimeout(timer);
  clearInterval(progressTimer);
};

const goToProfile = () => {
  const userId = currentUserId.value;
  console.log('Current user ID:', userId);
  console.log('Auth state:', store.state.auth.user);
  
  if (userId) {
    router.push(`/profile/${userId}`);
  } else {
    showTemporaryNotification(
      'error',
      'Ошибка',
      'Не удалось получить ID пользователя. Попробуйте войти заново.'
    );
  }
};

const showTemporaryNotification = (notificationType, notificationTitle, notificationMessage) => {
  type.value = notificationType;
  title.value = notificationTitle;
  message.value = notificationMessage;
  showNotification.value = true;

  if (duration.value > 0) {
    // Таймер для закрытия уведомления
    timer = setTimeout(closeNotification, duration.value);

    // Таймер для прогресс-бара
    const updateInterval = 10; // Обновление каждые 10мс
    const steps = duration.value / updateInterval;
    const step = 100 / steps;
    progress.value = 100;

    progressTimer = setInterval(() => {
      progress.value = Math.max(0, progress.value - step);
    }, updateInterval);
  }
};

const resendVerification = async () => {
  try {
    await store.dispatch('auth/resendVerificationEmail');
    showTemporaryNotification(
      'success',
      'Письмо отправлено',
      'Проверьте вашу электронную почту'
    );
  } catch (error) {
    showTemporaryNotification(
      'error',
      'Ошибка отправки',
      'Не удалось отправить письмо. Попробуйте позже'
    );
  }
};

onUnmounted(() => {
  clearTimeout(timer);
  clearInterval(progressTimer);
});
</script>
