<template>
  <div class="auth-container">
    <div v-if="loading" class="loading">
      Загрузка...
    </div>
    <div v-else>
      <div v-if="currentUser">
        <h2>Добро пожаловать, {{ currentUser.email }}</h2>
        <div v-if="!currentUser.emailVerified" class="verification-warning">
          <p>Ваш email не подтвержден</p>
          <SendEmailVerification />
        </div>
        <button @click="handleLogout" class="logout-button">Выйти</button>
      </div>
      <div v-else>
        <component :is="currentForm" @switch-to-register="currentForm = 'RegisterForm'" @switch-to-login="currentForm = 'LoginForm'" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { auth } from '@/plugins/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import SendEmailVerification from './SendEmailVerification.vue'

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

    const currentUser = computed(() => store.getters['user/currentUser'])

    onMounted(() => {
      // Слушаем изменения состояния аутентификации
      onAuthStateChanged(auth, (user) => {
        loading.value = false
        if (user) {
          store.dispatch('user/updateUser', {
            email: user.email,
            emailVerified: user.emailVerified,
            uid: user.uid
          })
        } else {
          store.dispatch('user/clearUser')
        }
      })
    })

    const handleLogout = async () => {
      try {
        await signOut(auth)
        store.dispatch('user/clearUser')
      } catch (error) {
        console.error('Ошибка при выходе:', error)
      }
    }

    return {
      loading,
      currentUser,
      currentForm,
      handleLogout
    }
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 20px;
}

.verification-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
}

.logout-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.logout-button:hover {
  background-color: #c82333;
}
</style>
