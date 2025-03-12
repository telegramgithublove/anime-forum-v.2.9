<template>
  <div class="min-h-screen bg-gradient-to-r from-purple-600 to-blue-500 p-6">
    <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <header class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <img src="/image/logo.png" alt="Logo" class="w-12 h-12 rounded-full">
          <h1 class="text-3xl font-bold text-purple-700 font-serif">Основные настройки профиля</h1>
        </div>
      </header>

      <!-- Основная информация -->
      <section class="mb-8">
        <h2 class="text-2xl font-semibold mb-4 text-blue-600">Основная информация</h2>
        <div class="space-y-4">
          <!-- Изменение имени пользователя -->
          <div class="relative">
            <label class="block text-gray-700 font-medium mb-2">Имя пользователя</label>
            <input
              v-model="username"
              @input="updateUsername"
              type="text"
              maxlength="17"
              class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Введите имя пользователя"
            />
            <p class="absolute bottom-1 right-2 text-gray-500 text-sm">{{ 17 - username.length }} символов осталось</p>
            <p v-if="usernameError" class="absolute bottom-1 mb-4 right-2 text-red-500 text-sm">{{ usernameError }}</p>
          </div>

          <!-- Загрузка и изменение аватара -->
          <div>
            <label class="block text-gray-700 font-medium mb-2">Аватар</label>
            <div class="flex items-center space-x-6">
              <div class="relative">
                <img 
                  :src="avatarUrl" 
                  :alt="username"
                  @error="handleAvatarError"
                  class="w-24 h-24 rounded-full object-cover border-4 border-purple-200 shadow-lg hover:border-purple-300 transition-all duration-300"
                >
                <div class="absolute bottom-0 right-0 bg-purple-500 rounded-full p-1.5 border-2 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              </div>
              <label class="relative cursor-pointer">
                <input
                  type="file"
                  @change="handleAvatarChange"
                  class="hidden"
                  accept="image/*"
                >
                <div class="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg group">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium group-hover:text-white/90">Выберите файл</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Progress Indicator -->

          <div class="max-w-4xl mx-auto p-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Профиль пользователя</h1>
            
            <!-- Progress Indicator -->
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Ваш прогресс</h2>
              <ProgressBar />
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Создано тем: {{ createdPosts }} / {{ totalPosts }}
              </p>
            </div>
        
            <!-- Здесь можно добавить другие элементы профиля -->
          </div>

      

          <!-- Кнопки На главную и Сохранить -->
          <div class="mt-6 flex justify-end space-x-4">
            <router-link
              to="/"
              class="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200"
            >
              На главную
            </router-link>

        
          </div>
        </div>
      </section>

   
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import ProgressBar from '../../components/ProgressBar.vue';
const router = useRouter();
const store = useStore();
const toast = useToast();

// Реактивные данные из Vuex
const username = computed({
  get: () => store.getters['profile/username'],
  set: (value) => store.commit('profile/UPDATE_USERNAME', value)
});

const avatarUrl = computed(() => {
  const avatar = store.getters['profile/userAvatar'];
  if (!avatar || avatar === '') {
    return '/image/empty_avatar.png';
  }
  return avatar;
});

const signature = computed({
  get: () => store.getters['profile/signature'],
  set: (value) => {
    // Ограничиваем длину подписи 11 символами
    if (value.length <= 11) {
      store.commit('profile/UPDATE_SIGNATURE', value);
    }
  }
});

// Локальное состояние
const usernameError = ref('');
const maxSignatureLength = 11;
const showNotification = ref(false);
const remainingCharacters = computed(() => maxSignatureLength - (signature.value?.length || 0));

const createdPosts = computed(() => store.getters['progress/getCreatedPosts']);
const totalPosts = computed(() => store.state.progress.totalPosts);

// Обработчик ошибки загрузки аватара
const handleAvatarError = (e) => {
  e.target.src = '/image/empty_avatar.png';
};

// Методы
const updateUsername = async () => {
  try {
    const userId = store.getters['auth/getUserId'];
    if (!userId) {
      throw new Error('Пользователь не авторизован');
    }

    await store.dispatch('profile/updateUsername', {
      userId,
      username: username.value
    });

    toast.success('Имя пользователя успешно обновлено');
    usernameError.value = '';
  } catch (error) {
    usernameError.value = error.message;
    toast.error(error.message);
  }
};

const handleInput = (event) => {
  const input = event.target;
  if (input.value.length > maxSignatureLength) {
    input.value = input.value.slice(0, maxSignatureLength);
    // Вызываем событие input для обновления v-model
    input.dispatchEvent(new Event('input'));
    toast.warning(`Максимальная длина подписи - ${maxSignatureLength} символов`);
  }
};

const handleAvatarChange = async (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;

    const userId = store.getters['auth/getUserId'];
    if (!userId) {
      throw new Error('Пользователь не авторизован');
    }

    await store.dispatch('profile/updateAvatar', {
      userId,
      avatarFile: file
    });

    toast.success('Аватар успешно обновлен');
  } catch (error) {
    toast.error(error.message);
  }
};

const saveSignature = async () => {
  try {
    const userId = store.getters['auth/getUserId'];
    if (!userId) {
      throw new Error('Пользователь не авторизован');
    }

    await store.dispatch('profile/updateSignature', {
      userId,
      signature: signature.value
    });

    showNotification.value = true;
    setTimeout(() => {
      showNotification.value = false;
    }, 3000); // Скрываем уведомление через 3 секунды
    toast.success('Подпись успешно сохранена');
  } catch (error) {
    toast.error(error.message);
  }
};

// При монтировании компонента
onMounted(async () => {
  try {
    const userId = store.getters['auth/getUserId'];
    if (userId) {
      await store.dispatch('profile/fetchProfile', userId);
      // Проверяем аватар после загрузки профиля
      const avatar = store.getters['profile/userAvatar'];
      if (!avatar || avatar === '') {
        handleAvatarError({ target: document.querySelector('img[alt="Аватар"]') });
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
  // Инициализируем прогресс при загрузке компонента
  store.dispatch('progress/initializeProgress');
});
</script>

<style scoped>
header {
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.file\:mr-4 { margin-right: 1rem; }
.file\:py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.file\:px-4 { padding-left: 1rem; padding-right: 1rem; }
.file\:border-0 { border-width: 0; }
.file\:text-sm { font-size: 0.875rem; }
.file\:bg-purple-100 { background-color: #E9D5FF; }
.file\:text-purple-700 { color: #6B21A8; }

textarea:disabled {
  cursor: not-allowed;
  background-color: #f3f4f6;
}
</style>