<template>
  <div v-if="isModalOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" @click.self="closeModal">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 class="text-2xl font-bold text-center mb-6 text-purple-700">Вход в систему</h2>

      <form @submit.prevent="handleLogin">
        <!-- Email/Username -->
        <div class="mb-4">
          <label for="email" class="block text-gray-700 font-semibold">Логин / Email</label>
          <input
            v-model="email"
            type="text"
            id="email"
            class="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
            placeholder="Введите логин или email"
            required
          />
          <p v-if="emailError" class="text-red-500 text-sm">{{ emailError }}</p>
        </div>

        <!-- Password with Eye Icon -->
        <div class="mb-6 relative">
          <label for="password" class="block text-gray-700 font-semibold">Пароль</label>
          <input
            v-model="password"
            :type="passwordVisible ? 'text' : 'password'"
            id="password"
            class="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
            placeholder="Введите пароль"
            required
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="absolute inset-y-0 right-3 flex items-center text-gray-500"
          >
            <svg v-if="passwordVisible" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mt-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 1.389-2.44 4-9 4s-9-2.611-9-4 2.44-4 9-4 9 2.611 9 4zM9.75 9.75L15 15" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mt-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 1.389-2.44 4-9 4s-9-2.611-9-4 2.44-4 9-4 9 2.611 9 4z" />
            </svg>
          </button>
          <p v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-300"
        >
          Войти
        </button>
      </form>

      <p v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</p>

      <div class="mt-6 space-y-3">
        <button
          @click="loginWithTelegram"
          class="w-full flex items-center justify-center py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
        >
          <img src="/image/icons8-telegram-48.png" alt="Telegram" class="w-5 h-5 mr-2" />
          Войти через Telegram
        </button>

        <button
          @click="loginWithGoogle"
          class="w-full flex items-center justify-center py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300"
        >
          <img src="/image/icons8-google-48.png" alt="Google" class="w-5 h-5 mr-2" />
          Войти через Google
        </button>
      </div>

      <p class="mt-4 text-center text-lg text-gray-600 font-semibold">
        Нет аккаунта?
        <span @click="goToRegistration" class="text-purple-600 hover:underline cursor-pointer font-semibold text-lg">
          Зарегистрироваться
        </span>
      </p>
    </div>
  </div>
  <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <svg class="animate-spin h-10 w-10 text-purple-600" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" fill="none" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

const isModalOpen = ref(true);
const email = ref('');
const password = ref('');
const error = ref(null);
const emailError = ref(null);
const passwordError = ref(null);
const passwordVisible = ref(false);
const isLoading = ref(false);

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value;
}

async function handleLogin() {
  try {
    emailError.value = null;
    passwordError.value = null;
    error.value = null;
    isLoading.value = true;

    const result = await store.dispatch('auth/login', {
      email: email.value,
      password: password.value
    });

    if (result.error) {
      isLoading.value = false;
      
      if (result.code === 'user-not-found' || result.message === 'Данные пользователя не найдены') {
        emailError.value = 'Пользователь не найден. Перенаправление на страницу регистрации...';
        setTimeout(() => {
          closeModal();
          router.push('/register');
        }, 2000);
      } else if (result.code === 'auth/wrong-password') {
        passwordError.value = 'Неверный пароль';
      } else {
        error.value = result.message || 'Ошибка входа. Пожалуйста, попробуйте снова.';
      }
      return;
    }

    isLoading.value = false;
    closeModal();

    if (result.redirectTo) {
      router.push(result.redirectTo);
    } else {
      router.push('/');
    }
  } catch (err) {
    isLoading.value = false;
    error.value = 'Произошла неожиданная ошибка. Пожалуйста, попробуйте позже.';
    console.error('Login error:', err);
  }
}

function loginWithTelegram() {
  // Реализация входа через Telegram
  console.log('Login with Telegram');
}

function loginWithGoogle() {
  // Реализация входа через Google
  console.log('Login with Google');
}

function closeModal() {
  isModalOpen.value = false;
  router.push('/');
}

function goToRegistration() {
  router.push('/register');
}
</script>

<style scoped>
/* Дополнительная стилизация, если необходимо */
</style>
