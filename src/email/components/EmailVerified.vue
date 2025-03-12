<template>
  <div class="email-status">
    <div v-if="currentUser" class="status-container">
      <div v-if="isEmailVerified" class="verified">
        <i class="fas fa-check-circle"></i>
        <p>Email подтвержден</p>
      </div>
      <div v-else class="not-verified">
        <i class="fas fa-exclamation-circle"></i>
        <p>Email не подтвержден</p>
        <button @click="checkVerificationStatus" :disabled="checking">
          {{ checking ? 'Проверка...' : 'Проверить статус' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth } from "firebase/auth";
import { mapGetters } from 'vuex';
import { getDatabase, ref, update } from 'firebase/database';
import axios from 'axios';

export default {
  name: 'EmailVerified',
  data() {
    return {
      checking: false,
      checkInterval: null
    }
  },
  computed: {
    ...mapGetters('user', ['isEmailVerified', 'currentUser'])
  },
  methods: {
    async checkVerificationStatus() {
      if (!this.currentUser || this.checking) return;

      this.checking = true;
      const auth = getAuth();
      const user = auth.currentUser;

      try {
        await user.reload();
        
        if (user.emailVerified) {
          // Обновляем статус в базе данных через Firebase
          const db = getDatabase();
          await update(ref(db, `users/${user.uid}`), {
            emailVerified: true
          });

          // Обновляем через axios
          await axios.patch(
            `https://testforum-23fdf-default-rtdb.firebaseio.com/users/${user.uid}.json`,
            { emailVerified: true }
          );

          // Обновляем состояние в Vuex
          this.$store.commit('user/setUser', {
            ...this.currentUser,
            emailVerified: true
          });

          // Останавливаем интервал проверки, так как email подтвержден
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
          }
        }
      } catch (error) {
        console.error("Ошибка при проверке статуса email:", error);
      } finally {
        this.checking = false;
      }
    }
  },
  async mounted() {
    // Проверяем статус при монтировании компонента
    await this.checkVerificationStatus();

    // Устанавливаем интервал для периодической проверки, если email не подтвержден
    if (!this.isEmailVerified) {
      this.checkInterval = setInterval(this.checkVerificationStatus, 10000); // Проверка каждые 10 секунд
    }
  },
  beforeDestroy() {
    // Очищаем интервал при уничтожении компонента
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  },
  watch: {
    // Следим за изменением статуса верификации
    isEmailVerified(newValue) {
      if (newValue && this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    }
  }
}
</script>

<style scoped>
.email-status {
  padding: 15px;
  text-align: center;
}

.status-container {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  margin: 10px 0;
}

.verified {
  color: #28a745;
}

.not-verified {
  color: #dc3545;
}

.not-verified button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.not-verified button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.not-verified button:not(:disabled):hover {
  background-color: #0056b3;
}

i {
  font-size: 24px;
  margin-bottom: 5px;
}

p {
  margin: 5px 0;
}
</style>
