<template>
  <div>
    <header class="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white shadow-xl p-4">
      <div class="flex justify-between items-center max-w-7xl mx-auto">
        <!-- Навигация слева -->
        <nav class="flex items-center space-x-4">
          <div class="ml-4">
            <!-- Кнопка админ-панели, видимая только для superuser -->
            <router-link
              v-if="isSuperUser"
              to="/admin"
              class="bg-red-500/90 px-5 py-2 rounded-xl shadow-lg hover:bg-red-600 hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Админ-панель
            </router-link>
          </div>
        </nav>

        <!-- Логотип, название и поиск по центру -->
        <div class="flex items-center space-x-6">
          <img src="/image/logo.png" alt="Logo" class="w-14 h-14 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200" />
          <h1 class="text-2xl font-bold tracking-wide whitespace-nowrap text-white/90 font-serif">Anime Lights Forum</h1>

          <div class="relative group">
            <input
              type="text"
              placeholder="Поиск..."
              class="w-64 bg-white/10 text-white rounded-xl px-4 py-2.5 pr-10 focus:ring-2 focus:ring-purple-400 focus:bg-white/20 transition-all duration-200 placeholder-white/50"
            />
            <span class="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-white/70 cursor-pointer group-hover:text-white transition-colors duration-200">
              search
            </span>
          </div>
        </div>

        <!-- Профиль и переключатель темы справа -->
        <div class="flex items-center space-x-6">
          <span
            @click="toggleDarkMode"
            class="material-icons cursor-pointer text-3xl text-white/80 hover:text-yellow-300 transition-all duration-200 transform hover:scale-110"
          >
            {{ isDarkMode ? 'dark_mode' : 'light_mode' }}
          </span>

          <!-- Профиль пользователя -->
          <div class="relative">
            <button
              ref="profileButtonRef"
              @click="toggleProfileMenu"
              class="flex items-center space-x-3 bg-white/10 text-white rounded-xl px-4 py-2.5 shadow-lg hover:bg-white/20 transition-all duration-200 group"
            >
              <img 
                :src="userAvatar" 
                :alt="username"
                class="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-all duration-200"
                @error="handleAvatarError"
              />
              <span class="truncate font-medium">{{ username }}</span>
              <span class="material-icons transform group-hover:rotate-180 transition-transform duration-200">arrow_drop_down</span>
            </button>

            <div 
              v-if="showProfileMenu" 
              ref="profileMenuRef"
              class="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 z-50"
            >
              <template v-if="store.state.auth.user && !isEmailVerified">
                <div class="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                  <div class="flex items-center">
                    <span class="material-icons text-yellow-600 mr-2">info</span>
                    <p class="text-sm text-yellow-700">
                      Для доступа ко всем функциям необходимо подтвердить email. 
                      <br>Пожалуйста, проверьте почту, включая папку "Спам".
                    </p>
                  </div>
                </div>
              </template>
              <template v-if="store.state.auth.user">
                <div v-if="!isEmailVerified" class="px-4 py-3 bg-yellow-50">
                  <div class="flex items-start">
                    <span class="material-icons text-yellow-600 mr-2 mt-0.5">warning</span>
                    <div class="text-sm text-yellow-800">
                      <p class="font-medium mb-1">Требуется подтверждение email</p>
                      <p>Для доступа к функциям форума необходимо:</p>
                      <ol class="list-decimal ml-5 mt-1">
                        <li>Подтвердить ваш email адрес</li>
                        <li>Проверить папку "Спам"</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <a @click="navigateToProfile" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3">account_circle</span> Мой профиль
                </a>
                <a @click="goToMainPage" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3">forum</span> Форум
                </a>
                <a 
                  :class="[
                    'flex items-center px-4 py-2.5 transition-all duration-200',
                    isEmailVerified 
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  ]"
                  @click="isEmailVerified ? navigateToProfile : showVerificationMessage"
                >
                  <span class="material-icons mr-3">settings</span> 
                  Настройки
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </a>
                <a 
                  :class="[
                    'flex items-center px-4 py-2.5 transition-all duration-200',
                    isEmailVerified 
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  ]"
                  @click="isEmailVerified ? null : showVerificationMessage"
                  :href="isEmailVerified ? '/messages' : '#'"
                >
                  <span class="material-icons mr-3">message</span> 
                  Сообщения
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </a>
                <a 
                  :class="[
                    'flex items-center px-4 py-2.5 transition-all duration-200',
                    isEmailVerified 
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  ]"
                  @click="isEmailVerified ? null : showVerificationMessage"
                  :href="isEmailVerified ? '/notifications' : '#'"
                >
                  <span class="material-icons mr-3">notifications</span> 
                  Уведомления
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </a>
                <a 
                  :class="[
                    'flex items-center px-4 py-2.5 transition-all duration-200',
                    isEmailVerified 
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  ]"
                  @click="isEmailVerified ? null : showVerificationMessage"
                  :href="isEmailVerified ? '/my-topics' : '#'"
                >
                  <span class="material-icons mr-3">topic</span> 
                  Мои темы
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </a>
                <a 
                  :class="[
                    'flex items-center px-4 py-2.5 transition-all duration-200',
                    isEmailVerified 
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  ]"
                  @click="isEmailVerified ? null : showVerificationMessage"
                  :href="isEmailVerified ? '/favorites' : '#'"
                >
                  <span class="material-icons mr-3">favorite</span> 
                  Избранное
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </a>
                <a 
                  :class="[
                    'flex items-center px-4 py-2.5 transition-all duration-200',
                    isEmailVerified 
                      ? 'text-gray-700 hover:bg-gray-100 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed'
                  ]"
                  @click="isEmailVerified ? null : showVerificationMessage"
                  :href="isEmailVerified ? '/subscriptions' : '#'"
                >
                  <span class="material-icons mr-3">subscriptions</span> 
                  Подписки
                  <span v-if="!isEmailVerified" class="material-icons ml-auto text-sm opacity-50">lock</span>
                </a>

                <div class="border-t border-gray-200 my-1"></div>

                <button
                  @click="handleLogout"
                  class="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3">logout</span> Выйти
                </button>
              </template>
              <template v-else>
                <button
                  @click="goToLogin"
                  class="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3">login</span> Войти
                </button>
                <button
                  @click="goToRegistration"
                  class="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <span class="material-icons mr-3">person_add</span> Зарегистрироваться
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Спиннер загрузки -->
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div class="bg-white/10 p-4 rounded-full">
        <svg class="animate-spin h-10 w-10 text-purple-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();
const isLoading = ref(false);
const showProfileMenu = ref(false);
const profileButtonRef = ref(null);
const profileMenuRef = ref(null);

// Computed properties
const isSuperUser = computed(() => {
  const userRole = store.getters['auth/userRole'];
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  return isAuthenticated && userRole === 'superuser';
});

const isDarkMode = computed(() => store.state.theme?.darkMode);
const isEmailVerified = computed(() => store.getters['auth/isEmailVerified']);

// Обработчик ошибки загрузки аватара
const handleAvatarError = (e) => {
  e.target.src = '/image/empty_avatar.png';
};

// Вычисляемые свойства для пользователя
const userAvatar = computed(() => {
  const avatar = store.getters['profile/userAvatar'];
  // Проверяем, есть ли аватар и не является ли он пустой строкой
  if (!avatar || avatar === '') {
    return '/image/empty_avatar.png';
  }
  return avatar;
});

const username = computed(() => {
  const name = store.getters['profile/username'];
  return name || 'Гость';
});

// Следим за изменениями в профиле
watch(() => store.state.auth.user?.username, async () => {
  await nextTick();
  // Если у пользователя нет аватара, устанавливаем пустышку
  if (!store.getters['profile/userAvatar']) {
    handleAvatarError();
  }
}, { immediate: true });

// Функция для показа сообщения о необходимости верификации
const showVerificationMessage = () => {
  alert('Для доступа к этой функции необходимо подтвердить email адрес. Пожалуйста, проверьте вашу почту, включая папку спам.');
};

// Следим за изменениями в store и обновляем DOM
watch(() => store.state.auth.user?.username, async () => {
  await nextTick();
}, { immediate: true });

// Обработчик клика вне меню
const handleClickOutside = (event) => {
  if (profileMenuRef.value && profileButtonRef.value) {
    if (!profileMenuRef.value.contains(event.target) && 
        !profileButtonRef.value.contains(event.target)) {
      showProfileMenu.value = false;
    }
  }
};

onMounted(async () => {
  const userId = store.getters['auth/getUserId'];
  if (userId) {
    try {
      await store.dispatch('profile/fetchProfile', userId);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Следим за изменениями аватарки
watch(() => store.getters['profile/userAvatar'], (newAvatar) => {
  if (newAvatar) {
    localStorage.setItem('userAvatarUrl', newAvatar);
  }
});

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

function goToRegistration() {
  showProfileMenu.value = false;
  router.push({ name: 'Registration' });
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
}

async function handleLogout() {
  try {
    isLoading.value = true;
    await store.dispatch('auth/logout');
    
    // Сбрасываем состояние пользователя
    store.commit('profile/SET_PROFILE', {
      username: 'Гость',
      avatarUrl: '/image/empty_avatar.png',
      signature: '',
      settings: {
        profileVisibility: true,
        notifyMessages: true,
        notifyReplies: true,
      },
      messages: [],
      notices: [],
      mytopics: [],
      favorites: [],
      subscriptions: [],
      exit: { lastLogout: Date.now() }
    });
    
    // Очищаем локальное хранилище
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('emailVerified');
    localStorage.removeItem('userAvatarUrl');
    localStorage.removeItem('userSettings');
    
    // Закрываем меню профиля
    showProfileMenu.value = false;
    
    // Перенаправляем на главную страницу
    await router.push('/');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    isLoading.value = false;
  }
}

const navigateToProfile = () => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    router.push({ 
      name: 'Profile', 
      params: { id: userId }
    });
  } else {
    console.error('User ID not found in localStorage');
  }
};

function goToMainPage() {
  router.push({ path: '/' });
}

function goToLogin() {
  router.push('/login');
  showProfileMenu.value = false;
}
</script>