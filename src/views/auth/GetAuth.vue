<template>
  <div class="auth-container">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Загрузка...</p>
    </div>
    <div v-else>
      <div v-if="currentUser" class="user-info">
        <h2>Добро пожаловать, {{ currentUser.email }}</h2>
        <div v-if="!currentUser.emailVerified" class="verification-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Ваш email не подтвержден</p>
          <SendEmailVerification />
        </div>
        <div v-else class="verification-success">
          <i class="fas fa-check-circle"></i>
          <p>Email подтвержден</p>
        </div>
        <button @click="handleLogout" class="logout-button">
          <i class="fas fa-sign-out-alt"></i>
          Выйти
        </button>
      </div>
      <div v-else>
        <component 
          :is="currentForm" 
          @switch-to-register="switchForm('RegisterForm')" 
          @switch-to-login="switchForm('LoginForm')" 
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { getDatabase, ref as dbRef, update } from 'firebase/database'
import axios from 'axios'
import LoginForm from '../auth/Login.vue'
import RegisterForm from '../auth/Registration.vue'
import SendEmailVerification from '../auth/SendEmailVerification.vue'

export default {
  name: 'GetAuth',
  components: {
    LoginForm,
    RegisterForm,
    SendEmailVerification
  },
  setup() {
    const store = useStore()
    const loading = ref(true)
    const currentForm = ref('LoginForm')
    const auth = getAuth()
    const database = getDatabase()

    const currentUser = computed(() => store.getters['email/currentUser'])
    const isEmailVerified = computed(() => store.getters['email/isEmailVerified'])

    const updateUserStatus = async (user) => {
      if (!user?.uid) return

      const updates = {
        lastLogin: new Date().toISOString(),
        emailVerified: user.emailVerified,
        status: 'online'
      }

      try {
        // Обновляем в Firebase Realtime Database
        await update(dbRef(database, `users/${user.uid}`), updates)

        // Обновляем через axios для надежности
        await axios.patch(
          `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${user.uid}.json`,
          updates
        )

        // Обновляем в store
        store.dispatch('email/updateUser', {
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified,
          ...updates
        })
      } catch (error) {
        console.error('Error updating user status:', error)
      }
    }

    onMounted(() => {
      // Слушаем изменения состояния аутентификации
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Перезагружаем пользователя для получения актуального статуса
          await user.reload()
          await updateUserStatus(user)
        } else {
          store.dispatch('email/clearUser')
        }
        loading.value = false
      })

      // Отписываемся при размонтировании
      return () => unsubscribe()
    })

    const handleLogout = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          // Обновляем статус перед выходом
          await update(dbRef(database, `users/${user.uid}`), {
            status: 'offline',
            lastLogout: new Date().toISOString()
          })
        }
        await signOut(auth)
        store.dispatch('email/clearUser')
      } catch (error) {
        console.error('Ошибка при выходе:', error)
      }
    }

    const switchForm = (formName) => {
      currentForm.value = formName
    }

    return {
      loading,
      currentUser,
      isEmailVerified,
      currentForm,
      handleLogout,
      switchForm
    }
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 20px;
  color: #2196F3;
}

.user-info {
  text-align: center;
}

.user-info h2 {
  color: #333;
  margin-bottom: 20px;
}

.verification-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.verification-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.verification-warning i,
.verification-success i {
  font-size: 24px;
  margin-bottom: 5px;
}

.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.loading .fa-spinner {
  font-size: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>