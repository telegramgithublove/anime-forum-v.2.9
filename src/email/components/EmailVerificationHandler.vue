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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, applyActionCode } from 'firebase/auth';
import { getDatabase, ref as dbRef, update } from 'firebase/database';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'EmailVerificationHandler',
  setup() {
    const loading = ref(true);
    const error = ref(null);
    const success = ref(false);
    const router = useRouter();
    const store = useStore();

    const updateVerificationStatus = async (uid) => {
      const db = getDatabase();
      const updates = {
        emailVerified: true,
        verifiedAt: new Date().toISOString()
      };

      try {
        // Обновляем в Firebase Realtime Database
        await update(dbRef(db, `users/${uid}`), updates);

        // Обновляем через axios
        await axios.patch(
          `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${uid}.json`,
          updates
        );

        // Обновляем в Vuex store
        store.dispatch('user/updateUser', {
          ...store.getters['user/currentUser'],
          emailVerified: true
        });

      } catch (err) {
        console.error('Error updating verification status:', err);
        throw err;
      }
    };

    const handleVerification = async () => {
      const auth = getAuth();
      const actionCode = new URLSearchParams(window.location.search).get('oobCode');

      if (!actionCode) {
        error.value = 'Отсутствует код верификации';
        loading.value = false;
        return;
      }

      try {
        // Применяем код верификации
        await applyActionCode(auth, actionCode);

        // Получаем текущего пользователя
        const user = auth.currentUser;
        if (user) {
          // Принудительно обновляем статус верификации
          await updateVerificationStatus(user.uid);
          
          // Перезагружаем пользователя для обновления emailVerified
          await user.reload();
        }

        success.value = true;
      } catch (err) {
        console.error('Verification error:', err);
        error.value = 'Ошибка при верификации email. Возможно, ссылка устарела или недействительна.';
      } finally {
        loading.value = false;
      }
    };

    const retryVerification = () => {
      loading.value = true;
      error.value = null;
      success.value = false;
      handleVerification();
    };

    const goToHome = () => {
      router.push('/');
    };

    onMounted(() => {
      handleVerification();
    });

    return {
      loading,
      error,
      success,
      retryVerification,
      goToHome
    };
  }
};
</script>

<style scoped>
.verification-handler {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 20px;
}

.status {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
}

.loading {
  color: #2196F3;
}

.error {
  color: #f44336;
  background-color: #ffebee;
}

.success {
  color: #4CAF50;
  background-color: #E8F5E9;
}

i {
  font-size: 48px;
  margin-bottom: 16px;
}

p {
  margin: 16px 0;
  font-size: 16px;
}

button {
  margin-top: 16px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #2196F3;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #1976D2;
}

.error button {
  background-color: #f44336;
}

.error button:hover {
  background-color: #d32f2f;
}

.success button {
  background-color: #4CAF50;
}

.success button:hover {
  background-color: #388E3C;
}
</style>
