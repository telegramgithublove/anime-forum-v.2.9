<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">Настройки</h1>
      
      <!-- Настройки профиля -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">Профиль</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя
            </label>
            <input
              v-model="username"
              type="text"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Введите имя пользователя"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Подпись
            </label>
            <textarea
              v-model="signature"
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="3"
              placeholder="Введите подпись"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Настройки уведомлений -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">Уведомления</h2>
        <div class="space-y-4">
          <div class="flex items-center">
            <input
              v-model="emailNotifications"
              type="checkbox"
              class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-700">
              Получать уведомления на email
            </label>
          </div>
        </div>
      </section>

      <!-- Кнопки действий -->
      <div class="flex justify-end space-x-4">
        <button
          @click="saveSettings"
          class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const username = ref('');
const signature = ref('');
const emailNotifications = ref(false);
const isSaving = ref(false);

// Загружаем текущие настройки
onMounted(async () => {
  const userId = store.getters['auth/getUserId'];
  if (userId) {
    try {
      await store.dispatch('profile/fetchProfile', userId);
      username.value = store.getters['profile/getUsername'];
      signature.value = store.getters['profile/getSignature'];
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }
});

// Сохраняем настройки
async function saveSettings() {
  isSaving.value = true;
  const userId = store.getters['auth/getUserId'];
  
  try {
    if (userId) {
      await store.dispatch('profile/updateProfile', {
        userId,
        updates: {
          username: username.value,
          signature: signature.value
        }
      });
    }
    // Показываем уведомление об успешном сохранении
    alert('Настройки успешно сохранены');
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Ошибка при сохранении настроек');
  } finally {
    isSaving.value = false;
  }
}
</script>
