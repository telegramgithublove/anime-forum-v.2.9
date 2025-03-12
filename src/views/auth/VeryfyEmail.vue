<template>
  <div class="verify-email">
    <div v-if="loading" class="status-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Проверка email...</p>
    </div>

    <div v-else-if="error" class="status-container error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="$router.push('/')" class="btn">
        Вернуться на главную
      </button>
    </div>

    <div v-else-if="verificationStatus === 'verified'" class="status-container success">
      <i class="fas fa-check-circle"></i>
      <p>Email успешно подтвержден!</p>
      <button @click="$router.push('/')" class="btn">
        Перейти на главную
      </button>
    </div>

    <div v-else class="status-container">
      <i class="fas fa-clock"></i>
      <p>Подтверждение email...</p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { computed, onMounted } from 'vue'

export default defineComponent({
  name: 'VerifyEmail',
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()

    const loading = computed(() => store.getters['email/isLoading'])
    const error = computed(() => store.getters['email/error'])
    const verificationStatus = computed(() => store.getters['email/verificationStatus'])

    onMounted(async () => {
      const oobCode = route.query.oobCode
      if (!oobCode) {
        window.location.href = 'http://localhost:5174/login'
        return
      }

      try {
        const result = await store.dispatch('email/verifyEmail', oobCode)
        // После успешной верификации принудительно проверяем статус
        await store.dispatch('email/checkVerificationStatus')
        
        // Если верификация прошла успешно, перенаправляем на страницу логина
        if (store.getters['email/verificationStatus'] === 'verified') {
          setTimeout(() => {
            window.location.href = 'http://localhost:5174/login'
          }, 2000) // Даем пользователю 2 секунды увидеть сообщение об успехе
        }
      } catch (error) {
        console.error('Ошибка верификации:', error)
        // В случае ошибки тоже перенаправляем на логин, но с сообщением об ошибке
        setTimeout(() => {
          window.location.href = 'http://localhost:5174/login'
        }, 2000)
      }
    })

    return {
      loading,
      error,
      verificationStatus
    }
  }
})
</script>

<style scoped>
.verify-email {
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
}

.status-container {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-container i {
  font-size: 48px;
  margin-bottom: 16px;
}

.status-container p {
  margin: 10px 0;
  font-size: 16px;
}

.error {
  color: #dc3545;
  background-color: #f8d7da;
}

.success {
  color: #28a745;
  background-color: #d4edda;
}

.btn {
  margin-top: 16px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #0056b3;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fa-spinner {
  animation: spin 1s linear infinite;
}
</style>
