<template>
    <div>
      <header class="bg-gradient-to-br from-red-800 via-red-700 to-orange-600 text-white shadow-xl p-4">
        <div class="flex justify-between items-center max-w-7xl mx-auto">
          <!-- Навигация слева -->
          <router-link 
          to="/admin" 
          class="flex items-center justify-center w-10 h-10 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
          title="Вернуться в админ панель"
        >
          <span class="material-icons text-white/90">arrow_back</span>
        </router-link>

             <!-- Логотип и название по центру -->
          <div class="flex items-center space-x-6">
            <img src="/image/logo.png" alt="Logo" class="w-14 h-14 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200" />
            <h1 class="text-2xl font-bold tracking-wide whitespace-nowrap text-white/90 font-serif">Admin Panel</h1>
          </div>
  
          <!-- Профиль и переключатель темы справа -->
          <div class="flex items-center space-x-6">
            <span
              @click="toggleDarkMode"
              class="material-icons cursor-pointer text-3xl text-white/80 hover:text-yellow-300 transition-all duration-200 transform hover:scale-110"
            >
              {{ isDarkMode ? 'dark_mode' : 'light_mode' }}
            </span>
  
            <!-- Профиль администратора -->
            <div class="relative">
              <button
                ref="profileButtonRef"
                @click="toggleProfileMenu"
                class="flex items-center space-x-3 bg-white/10 text-white rounded-xl px-4 py-2.5 shadow-lg hover:bg-white/20 transition-all duration-200 group"
              >
                <img 
                  :src="userAvatar" 
                  :alt="username"
                  @error="handleAvatarError"
                  class="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-all duration-200" 
                />
                <span class="truncate font-medium">{{ username }}</span>
                <span class="material-icons transform group-hover:rotate-180 transition-transform duration-200">arrow_drop_down</span>
              </button>
  
              <div 
                v-if="showProfileMenu" 
                ref="profileMenuRef"
                class="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl py-2 z-50"
              >
                <a @click="navigateToProfile" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3">admin_panel_settings</span> Профиль администратора
                </a>
                <a @click="goToMainPage" class="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3">forum</span> Форум
                </a>
                <div class="border-t border-gray-200 my-2"></div>
                <a @click="handleLogout" class="flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer">
                  <span class="material-icons mr-3">logout</span> Выйти из панели администратора
                </a>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

// Refs
const profileButtonRef = ref(null);
const profileMenuRef = ref(null);
const showProfileMenu = ref(false);
const isLoading = ref(false);

// Обработчик ошибки загрузки аватара
const handleAvatarError = (e) => {
  e.target.src = '/image/empty_avatar.png';
};

// Computed
const username = computed(() => {
  const name = store.getters['auth/getUsername'];
  return name || 'SuperUser';
});

const userAvatar = computed(() => {
  const avatar = store.getters['auth/getUserAvatar'];
  if (!avatar || avatar === '') {
    return '/image/empty_avatar.png';
  }
  return avatar;
});

const isDarkMode = computed(() => store.state.darkMode);

// Methods
const logout = async () => {
  try {
    isLoading.value = true;
    await store.dispatch('profile/logout');
    router.push('/login');
  } catch (error) {
    console.error('Ошибка при выходе:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = async () => {
  try {
    isLoading.value = true;
    await store.dispatch('auth/logout');
    // Очищаем localStorage
    localStorage.clear();
    // Перенаправляем на главную страницу
    router.push('/');
  } catch (error) {
    console.error('Ошибка при выходе:', error);
  } finally {
    isLoading.value = false;
  }
};

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};

const closeProfileMenu = () => {
  showProfileMenu.value = false;
};

const navigateToProfile = () => {
  router.push('/profile');
  closeProfileMenu();
};

const goToMainPage = () => {
  router.push('/');
  closeProfileMenu();
};

const handleClickOutside = (event) => {
  if (
    profileMenuRef.value &&
    !profileMenuRef.value.contains(event.target) &&
    !profileButtonRef.value.contains(event.target)
  ) {
    closeProfileMenu();
  }
};

const toggleDarkMode = () => {
  store.commit('toggleDarkMode');
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
