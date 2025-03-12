<template>
  <div class="register-form">
    <h2>Регистрация</h2>
    <form @submit.prevent="handleRegister">
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
      <div class="form-group">
        <label for="confirmPassword">Подтверждение пароля:</label>
        <input 
          type="password" 
          id="confirmPassword" 
          v-model="confirmPassword" 
          required
          placeholder="Подтвердите пароль"
        >
      </div>
      <div class="error" v-if="error">{{ error }}</div>
      <div class="buttons">
        <button type="submit" :disabled="loading || !isPasswordMatch">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
        <button type="button" @click="$emit('switch-to-login')">
          Уже есть аккаунт? Войти
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'RegisterForm',
  data() {
    return {
      email: '',
      password: '',
      confirmPassword: '',
      error: null,
      loading: false
    }
  },
  computed: {
    ...mapGetters('user', ['isAuthenticated']),
    isPasswordMatch() {
      return this.password === this.confirmPassword && this.password.length >= 6
    }
  },
  methods: {
    ...mapActions('user', ['registerUser']),
    async handleRegister() {
      if (!this.isPasswordMatch) {
        this.error = this.password.length < 6 
          ? 'Пароль должен содержать не менее 6 символов'
          : 'Пароли не совпадают'
        return
      }

      this.error = null
      this.loading = true
      try {
        await this.registerUser({
          email: this.email,
          password: this.password
        });
        
        // Очищаем форму после успешной регистрации
        this.email = '';
        this.password = '';
        this.confirmPassword = '';
        
      } catch (error) {
        console.error('Registration error:', error);
        this.error = this.getErrorMessage(error.code || error.message);
      } finally {
        this.loading = false;
      }
    },
    getErrorMessage(code) {
      switch (code) {
        case 'auth/email-already-in-use':
          return 'Пользователь с таким email уже существует'
        case 'auth/weak-password':
          return 'Пароль должен содержать не менее 6 символов'
        case 'auth/invalid-email':
          return 'Некорректный email'
        case 'auth/operation-not-allowed':
          return 'Email/Password аутентификация не включена в Firebase Console'
        case 'auth/network-request-failed':
          return 'Проблема с сетевым подключением'
        default:
          return `Произошла ошибка при регистрации: ${code}`
      }
    }
  }
}
</script>

<style scoped>
.register-form {
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
