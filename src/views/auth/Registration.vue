<template>
  <div v-if="isModalOpen" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" @click.self="closeModal">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
      <button @click="closeModal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 class="text-2xl font-bold text-center mb-6 text-purple-700">Регистрация</h2>

      <form @submit.prevent="handleRegister">
        <!-- Username -->
        <div class="mb-4">
          <label for="username" class="block text-gray-700 font-semibold">Имя пользователя</label>
          <input
            v-model="username"
            type="text"
            id="username"
            class="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
            placeholder="Введите имя пользователя"
            required
          />
        </div>

        <!-- Email -->
        <div class="mb-4">
          <label for="email" class="block text-gray-700 font-semibold">Электронная почта</label>
          <input
            v-model="email"
            type="email"
            id="email"
            class="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
            placeholder="Введите электронную почту"
            required
          />
          <p v-if="emailError" class="text-red-500 text-sm">{{ emailError }}</p>
        </div>

        <!-- Password with Eye Icon -->
        <div class="mb-4 relative">
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

        <!-- Password Confirmation with Eye Icon -->
        <div class="mb-6 relative">
          <label for="passwordConfirmation" class="block text-gray-700 font-semibold">Подтвердите пароль</label>
          <input
            v-model="passwordConfirmation"
            :type="passwordConfirmVisible ? 'text' : 'password'"
            id="passwordConfirmation"
            class="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
            placeholder="Подтвердите пароль"
            required
          />
          <button
            type="button"
            @click="togglePasswordConfirmVisibility"
            class="absolute inset-y-0 right-3 flex items-center text-gray-500"
          >
            <svg v-if="passwordConfirmVisible" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mt-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 1.389-2.44 4-9 4s-9-2.611-9-4 2.44-4 9-4 9 2.611 9 4zM9.75 9.75L15 15" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mt-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0zm6 0c0 1.389-2.44 4-9 4s-9-2.611-9-4 2.44-4 9-4 9 2.611 9 4z" />
            </svg>
          </button>
          <p v-if="passwordConfirmationError" class="text-red-500 text-sm">{{ passwordConfirmationError }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-300"
        >
          Зарегистрироваться
        </button>
      </form>

      <p v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</p>

      <div class="mt-6 space-y-3">
        <button
          @click="loginWithTelegram"
          class="w-full flex items-center justify-center py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
        >
          <img src="/image/icons8-telegram-48.png" alt="Telegram" class="w-5 h-5 mr-2" />
          Зайти через Telegram
        </button>

        <button
          @click="loginWithGoogle"
          class="w-full flex items-center justify-center py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300"
        >
          <img src="/image/icons8-google-48.png" alt="Google" class="w-5 h-5 mr-2" />
          Зайти через Google
        </button>
      </div>

      <p class="mt-4 text-center text-lg text-gray-600 font-semibold">
        Уже зарегистрированы?
        <span @click="goToLogin" class="text-purple-600 hover:underline cursor-pointer font-semibold text-lg">
          Перейдите на страницу входа
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
const username = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const error = ref(null);
const emailError = ref(null);
const passwordError = ref(null);
const passwordConfirmationError = ref(null);
const passwordVisible = ref(false);
const passwordConfirmVisible = ref(false);
const isLoading = ref(false);

function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value;
}

function togglePasswordConfirmVisibility() {
  passwordConfirmVisible.value = !passwordConfirmVisible.value;
}

function validateEmail(email) {
  // Простой регулярный паттерн для валидации email
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  // Пароль должен содержать как минимум 8 символов, одну заглавную букву и одну цифру
  const re = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return re.test(password);
}

async function handleRegister() {
  // Сбрасываем ошибки
  emailError.value = null;
  passwordError.value = null;
  passwordConfirmationError.value = null;

  // Валидация email
  if (!validateEmail(email.value)) {
    emailError.value = 'Некорректный адрес электронной почты';
    return;
  }

  // Валидация пароля
  if (!validatePassword(password.value)) {
    passwordError.value = 'Пароль должен содержать минимум 8 символов, одну заглавную букву и одну цифру';
    return;
  }

  // Валидация подтверждения пароля
  if (password.value !== passwordConfirmation.value) {
    passwordConfirmationError.value = 'Пароли не совпадают';
    return;
  }

  // Пытаемся зарегистрировать пользователя
  try {
    isLoading.value = true;
    error.value = null;
    
    const result = await store.dispatch('auth/registration', {
      username: username.value,
      email: email.value,
      password: password.value,
      passwordConfirmation: passwordConfirmation.value,
    });

    // Проверяем результат регистрации
    if (result.success) {
      const token = localStorage.getItem('userToken');
      console.log('Токен:', token);

      closeModal(); // Закрываем модальное окно

      // Перенаправляем на главную страницу после небольшой задержки
      setTimeout(async () => {
        try {
          await router.push('/'); // Перенаправляем на главную страницу
        } catch (error) {
          console.error("Ошибка при перенаправлении:", error);
        } finally {
          isLoading.value = false; // В любом случае отключаем спиннер
        }
      }, 2000);
    }
  } catch (err) {
    error.value = err.message; // Устанавливаем сообщение об ошибке
    isLoading.value = false; // Отключаем спиннер в случае ошибки
  }
}

function loginWithTelegram() {
  alert('Вход через Telegram пока не реализован.');
}

function loginWithGoogle() {
  alert('Вход через Google пока не реализован.');
}

function closeModal() {
  isModalOpen.value = false;
  router.push({ name: 'CategoryList' });
}

function goToLogin() {
  isModalOpen.value = false;
  router.push({ name: 'Login' });
}
</script>

<style scoped>
/* Дополнительная стилизация, если необходимо */
</style>