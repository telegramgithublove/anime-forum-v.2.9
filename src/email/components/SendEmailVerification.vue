<template>
  <div class="send-verification">
    <div v-if="!isEmailVerified && currentUser">
      <p class="status-text">
        <i class="fas fa-exclamation-circle"></i>
        Ваш email не подтвержден
      </p>
      <button 
        @click="sendVerification" 
        :disabled="loading || cooldownActive"
        :class="{ 'loading': loading }"
      >
        <span v-if="loading">
          <i class="fas fa-spinner fa-spin"></i>
          Отправка...
        </span>
        <span v-else-if="cooldownActive">
          Повторная отправка через {{ cooldownTime }}с
        </span>
        <span v-else>
          Отправить письмо подтверждения
        </span>
      </button>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      <div v-if="success" class="success-message">
        <i class="fas fa-check-circle"></i>
        {{ success }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { getAuth, sendEmailVerification } from 'firebase/auth';

export default {
  name: 'SendEmailVerification',
  
  setup() {
    const store = useStore();
    const loading = ref(false);
    const error = ref(null);
    const success = ref(null);
    const cooldown = ref(0);
    const cooldownInterval = ref(null);

    const currentUser = computed(() => store.getters['user/currentUser']);
    const isEmailVerified = computed(() => store.getters['user/isEmailVerified']);
    
    const cooldownActive = computed(() => cooldown.value > 0);
    const cooldownTime = computed(() => cooldown.value);

    const startCooldown = () => {
      cooldown.value = 60; // 60 секунд кулдаун
      if (cooldownInterval.value) {
        clearInterval(cooldownInterval.value);
      }
      cooldownInterval.value = setInterval(() => {
        if (cooldown.value > 0) {
          cooldown.value--;
        } else {
          clearInterval(cooldownInterval.value);
        }
      }, 1000);
    };

    const sendVerification = async () => {
      if (loading.value || cooldownActive.value) return;

      loading.value = true;
      error.value = null;
      success.value = null;

      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error('Пользователь не авторизован');
        }

        await sendEmailVerification(user, {
          url: window.location.origin + '/verify-email'
        });

        success.value = 'Письмо с подтверждением отправлено на ваш email';
        startCooldown();
      } catch (err) {
        console.error('Error sending verification email:', err);
        if (err.code === 'auth/too-many-requests') {
          error.value = 'Слишком много попыток. Пожалуйста, подождите некоторое время.';
        } else {
          error.value = 'Ошибка при отправке письма. Пожалуйста, попробуйте позже.';
        }
      } finally {
        loading.value = false;
      }
    };

    // Очищаем интервал при уничтожении компонента
    const beforeDestroy = () => {
      if (cooldownInterval.value) {
        clearInterval(cooldownInterval.value);
      }
    };

    return {
      loading,
      error,
      success,
      cooldownActive,
      cooldownTime,
      currentUser,
      isEmailVerified,
      sendVerification
    };
  }
};
</script>

<style scoped>
.send-verification {
  padding: 15px;
  text-align: center;
}

.status-text {
  color: #dc3545;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: #0056b3;
}

button.loading {
  background-color: #6c757d;
  cursor: wait;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  padding: 10px;
  background-color: #f8d7da;
  border-radius: 4px;
}

.success-message {
  color: #28a745;
  margin-top: 10px;
  padding: 10px;
  background-color: #d4edda;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

i {
  font-size: 16px;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>