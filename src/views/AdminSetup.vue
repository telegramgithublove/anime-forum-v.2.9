<template>
  <div class="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
    <div class="relative py-3 sm:max-w-xl sm:mx-auto">
      <div class="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
      <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
        <div class="max-w-md mx-auto">
          <div class="divide-y divide-gray-200">
            <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
              <h2 class="text-2xl font-bold mb-8 text-center text-purple-600">Настройка администратора</h2>
              
              <div v-if="!currentUser" class="mb-8 text-center">
                <p class="text-red-500 mb-4">Пожалуйста, войдите в систему</p>
                <button 
                  @click="router.push('/login')"
                  class="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-all duration-200"
                >
                  Войти
                </button>
              </div>

              <div v-else>
                <p class="mb-4">Текущий пользователь: <strong>{{ currentUser.email }}</strong></p>
                <p class="mb-4">Текущая роль: <strong>{{ currentRole || 'Не установлена' }}</strong></p>
                
                <button 
                  @click="setAsAdmin"
                  :disabled="isLoading"
                  class="w-full bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-all duration-200 disabled:opacity-50"
                >
                  {{ isLoading ? 'Установка роли...' : 'Установить роль администратора' }}
                </button>

                <div v-if="message" :class="['mt-4 p-3 rounded-lg text-center', messageClass]">
                  {{ message }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getAuth } from 'firebase/auth';

const store = useStore();
const router = useRouter();
const auth = getAuth();

const isLoading = ref(false);
const message = ref('');
const messageClass = ref('');
const currentRole = ref(null);

const currentUser = computed(() => auth.currentUser);

onMounted(async () => {
  if (currentUser.value) {
    try {
      currentRole.value = await store.dispatch('user/fetchUserRole', currentUser.value.uid);
    } catch (error) {
      console.error('Ошибка при загрузке роли:', error);
    }
  }
});

const setAsAdmin = async () => {
  if (!currentUser.value) return;

  isLoading.value = true;
  message.value = '';
  
  try {
    await store.dispatch('user/setAdminRole', currentUser.value.uid);
    message.value = 'Роль администратора успешно установлена!';
    messageClass.value = 'bg-green-100 text-green-700';
    currentRole.value = 'Administrator';
    
    // Перезагружаем роль пользователя
    await store.dispatch('user/fetchUserRole', currentUser.value.uid);
  } catch (error) {
    message.value = 'Ошибка при установке роли администратора';
    messageClass.value = 'bg-red-100 text-red-700';
    console.error('Ошибка:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>
