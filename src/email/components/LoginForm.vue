<template>
  <div class="login-form">
    <h2>Вход в систему</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input 
          type="email" 
          id="email" 
          v-model="email" 
          required
          placeholder="Введите email"
        >
      </div>
      <div class="form-group">
        <label for="password">Пароль:</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          required
          placeholder="Введите пароль"
        >
      </div>
      <div class="error" v-if="error">{{ error }}</div>
      <div class="buttons">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Загрузка...' : 'Войти' }}
        </button>
        <button type="button" @click="$emit('switch-to-register')">
          Нет аккаунта? Зарегистрироваться
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { auth } from '@/plugins/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { getDatabase, ref, update, serverTimestamp } from 'firebase/database'

export default {
  name: 'LoginForm',
  data() {
    return {
      email: '',
      password: '',
      error: null,
      loading: false
    }
  },
  computed: {
    ...mapGetters('user', ['isAuthenticated', 'isEmailVerified'])
  },
  methods: {
    ...mapActions('user', ['loginUser']),
    async handleLogin() {
      this.error = null
      this.loading = true
      try {
        if (!this.email || !this.password) {
          throw new Error('auth/missing-fields')
        }
        
        await this.loginUser({
          email: this.email,
          password: this.password
        });

        // Очищаем форму после успешного входа
        this.email = '';
        this.password = '';
        
      } catch (error) {
        console.error('Login error:', error)
        this.error = this.getErrorMessage(error.code || error.message)
      } finally {
        this.loading = false
      }
    },
    getErrorMessage(code) {
      switch (code) {
        case 'auth/user-not-found':
          return 'Пользователь с таким email не найден'
        case 'auth/wrong-password':
          return 'Неверный пароль'
        case 'auth/invalid-email':
          return 'Некорректный формат email'
        case 'auth/missing-fields':
          return 'Пожалуйста, заполните все поля'
        case 'auth/too-many-requests':
          return 'Слишком много попыток входа. Попробуйте позже'
        case 'auth/user-disabled':
          return 'Этот аккаунт был отключен'
        case 'auth/network-request-failed':
          return 'Проблема с сетевым подключением'
        default:
          return `Ошибка входа: ${code}`
      }
    }
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #2c3e50;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.error {
  color: #dc3545;
  margin: 10px 0;
  text-align: center;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

button[type="submit"] {
  background-color: #42b983;
  color: white;
}

button[type="submit"]:hover {
  background-color: #3aa876;
}

button[type="button"] {
  background-color: transparent;
  color: #2c3e50;
  text-decoration: underline;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
