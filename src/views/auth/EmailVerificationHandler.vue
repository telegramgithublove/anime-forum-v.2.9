<template>
  <div class="verification-handler">
    <div v-if="loading" class="status loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Проверка email...</p>
    </div>
    <div v-else-if="error" class="status error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="retryVerification">Попробовать снова</button>
    </div>
    <div v-else-if="success" class="status success">
      <i class="fas fa-check-circle"></i>
      <p>Email успешно подтвержден!</p>
      <button @click="goToHome">Перейти на главную</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, applyActionCode } from 'firebase/auth'
import { getDatabase, ref as dbRef, update } from 'firebase/database'
import axios from 'axios'
import { useStore } from 'vuex'

export default {
  name: 'EmailVerificationHandler',
  setup() {
    const loading = ref(true)
    const error = ref(null)
    const success = ref(false)
    const router = useRouter()
    const store = useStore()
    const auth = getAuth()
    let checkInterval = null

    const updateVerificationStatus = async (uid) => {
      const db = getDatabase()
      const updates = {
        emailVerified: true,
        verifiedAt: new Date().toISOString(),
        status: 'active',
        lastLogin: new Date().toISOString()
      }

      try {
        // Обновляем в Firebase Realtime Database
        await update(dbRef(db, `users/${uid}`), updates)

        // Обновляем через axios для надежности
        await axios.patch(
          `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${uid}.json`,
          updates
        )

        // Обновляем в Vuex store
        await store.dispatch('user/updateUser', {
          ...store.getters['user/currentUser'],
          ...updates
        })

        return true
      } catch (err) {
        console.error('Error updating verification status:', err)
        throw err
      }
    }

    const checkVerificationStatus = async () => {
      if (!auth.currentUser) return false

      try {
        // Перезагружаем пользователя для получения актуального статуса
        await auth.currentUser.reload()
        
        if (auth.currentUser.emailVerified) {
          await updateVerificationStatus(auth.currentUser.uid)
          success.value = true
          
          // Останавливаем интервал проверки
          if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
          }
          
          return true
        }
        
        return false
      } catch (err) {
        console.error('Error checking verification status:', err)
        return false
      }
    }

    const handleVerification = async () => {
      const actionCode = new URLSearchParams(window.location.search).get('oobCode')

      if (!actionCode) {
        error.value = 'Отсутствует код верификации'
        loading.value = false
        return
      }

      try {
        // Применяем код верификации
        await applyActionCode(auth, actionCode)
        
        // Перезагружаем пользователя для получения актуального статуса
        await auth.currentUser.reload()
        
        if (auth.currentUser.emailVerified) {
          // Обновляем статус в базе данных
          await updateVerificationStatus(auth.currentUser.uid)
          
          // Устанавливаем успех
          success.value = true
          
          // Обновляем статус в store
          await store.dispatch('user/updateUser', {
            ...store.getters['user/currentUser'],
            emailVerified: true
          })
          
          // После успешной верификации перенаправляем на страницу логина
          setTimeout(() => {
            window.location.href = 'http://localhost:5174/login'
          }, 2000)
        } else {
          throw new Error('Email не был подтвержден')
        }
      } catch (err) {
        console.error('Ошибка при верификации:', err)
        error.value = 'Ошибка при подтверждении email. Пожалуйста, попробуйте снова.'
      } finally {
        loading.value = false
      }
    }

    const retryVerification = () => {
      loading.value = true
      error.value = null
      success.value = false
      handleVerification()
    }

    const goToHome = () => {
      router.push('/')
    }

    onMounted(() => {
      handleVerification()
      
      // Запускаем периодическую проверку статуса
      checkInterval = setInterval(checkVerificationStatus, 5000) // Проверяем каждые 5 секунд
    })

    onBeforeUnmount(() => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    })

    return {
      loading,
      error,
      success,
      retryVerification,
      goToHome
    }
  }
}
</script>

<style scoped>
.verification-handler {
  max-width: 500px;
  margin: 40px auto;
  padding: 20px;
  text-align: center;
}

.status {
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading {
  background-color: #f8f9fa;
  color: #6c757d;
}

.error {
  background-color: #f8d7da;
  color: #dc3545;
}

.success {
  background-color: #d4edda;
  color: #28a745;
}

i {
  font-size: 24px;
  margin-bottom: 10px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.error button {
  background-color: #dc3545;
  color: white;
}

.error button:hover {
  background-color: #c82333;
}

.success button {
  background-color: #28a745;
  color: white;
}

.success button:hover {
  background-color: #218838;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fa-spinner {
  animation: spin 1s linear infinite;
}
</style>