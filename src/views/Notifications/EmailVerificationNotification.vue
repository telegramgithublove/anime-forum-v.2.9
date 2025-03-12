<template>
  <div class="fixed inset-0 flex items-center justify-center z-50">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="bg-gradient-to-r from-purple-600/95 to-blue-600/95 backdrop-blur-sm text-white px-6 py-4 rounded-xl shadow-lg max-w-md w-full mx-8 relative">
      <div class="flex items-start mb-4">
        <div class="flex-shrink-0">
          <svg class="h-6 w-6 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-lg font-medium mb-2">Подтвердите ваш email</h3>
          <p class="text-white/90 mb-2">
            Для создания новой темы необходимо подтвердить email адрес.<br>
            Мы отправили письмо с подтверждением на адрес:<br>
            <span class="font-medium">{{ userEmail }}</span>
          </p>
          <p class="text-white/90 mb-4">
            Пожалуйста, проверьте вашу почту и следуйте инструкциям для подтверждения аккаунта.
          </p>
          <div class="flex justify-between items-center">
            <button
              @click="resendVerification"
              class="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
              :disabled="isResending"
            >
              {{ isResending ? 'Отправка...' : 'Отправить снова' }}
            </button>
            <button
              @click="$emit('close')"
              class="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, sendEmailVerification } from 'firebase/auth';

const auth = getAuth();
const isResending = ref(false);
const userEmail = ref('');

onMounted(() => {
  const user = auth.currentUser;
  if (user) {
    userEmail.value = user.email;
  }
});

async function resendVerification() {
  if (isResending.value) return;
  
  const user = auth.currentUser;
  if (!user) return;

  isResending.value = true;
  try {
    await sendEmailVerification(user);
    // Показываем временное уведомление об успешной отправке
    setTimeout(() => {
      isResending.value = false;
    }, 3000);
  } catch (error) {
    console.error('Error resending verification:', error);
    isResending.value = false;
  }
}

defineEmits(['close']);
</script>