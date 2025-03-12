<template>
  <div class="p-6">
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="p-6 bg-gradient-to-r from-purple-600 to-purple-800">
        <h1 class="text-2xl font-bold text-white flex items-center space-x-3">
          <span class="material-icons">manage_accounts</span>
          <span>Управление пользователями</span>
        </h1>
      </div>
      
      <div class="p-6">
        <!-- Уведомления -->
        <div v-if="notification" 
             :class="['mb-6 p-4 rounded-xl border shadow-sm transition-all duration-300', 
                     notificationClass]">
          <div class="flex items-center space-x-3">
            <span class="material-icons">
              {{ notification.includes('ошибка') ? 'error' : 'check_circle' }}
            </span>
            <p class="font-medium">{{ notification }}</p>
          </div>
        </div>

        <!-- Индикатор загрузки -->
        <div v-if="isLoading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>

        <!-- Таблица пользователей -->
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 bg-white rounded-xl shadow-sm">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="user in users" 
                  :key="user.id"
                  class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4">
                  <div class="flex items-center space-x-3">
                    <img :src="user.avatar || '/image/empty_avatar.png'" 
                         :alt="user.username"
                         class="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                         @error="$event.target.src = '/image/empty_avatar.png'" />
                    <span class="font-medium text-gray-900">{{ user.username }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-gray-600">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <select 
                    v-model="user.role" 
                    @change="updateUserRole(user)"
                    :disabled="user.email === 'superuser@example.com'"
                    class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option v-for="role in roles" :key="role" :value="role">
                      {{ role.charAt(0).toUpperCase() + role.slice(1) }}
                    </option>
                  </select>
                </td>
                <td class="px-6 py-4">
                  <span 
                    :class="[
                      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                      user.roleUpdateStatus === 'success' ? 'bg-green-100 text-green-800' :
                      user.roleUpdateStatus === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    <span class="material-icons text-sm mr-1">
                      {{ user.roleUpdateStatus === 'success' ? 'check_circle' :
                         user.roleUpdateStatus === 'error' ? 'error' : 'info' }}
                    </span>
                    {{ getRoleUpdateStatus(user) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button 
                    @click="deleteUser(user)"
                    :disabled="user.email === 'superuser@example.com'"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <span class="material-icons text-sm mr-1">delete</span>
                    Удалить
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Сообщение при отсутствии пользователей -->
          <div v-if="users.length === 0" class="text-center py-12">
            <span class="material-icons text-4xl text-gray-400 mb-3">person_off</span>
            <p class="text-gray-500 text-lg">Нет пользователей для отображения</p>
          </div>
        </div>

        <!-- Кнопка обновления -->
        <div class="mt-6 flex justify-end">
          <button 
            @click="fetchUsers"
            :disabled="isLoading"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <span class="material-icons text-sm mr-2">refresh</span>
            {{ isLoading ? 'Загрузка...' : 'Обновить список' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { database } from '@/plugins/firebase';
import { ref as dbRef, get, set, remove, onValue } from 'firebase/database';

const store = useStore();
const users = ref([]);
const roles = ['admin', 'moderator', 'user'];
const notification = ref('');
const notificationTimeout = ref(null);
const isLoading = ref(false);

const showNotification = (message, type = 'success') => {
  notification.value = message;
  if (notificationTimeout.value) {
    clearTimeout(notificationTimeout.value);
  }
  notificationTimeout.value = setTimeout(() => {
    notification.value = '';
  }, 3000);
};

const notificationClass = computed(() => {
  return notification.value.includes('ошибка') 
    ? 'bg-red-100 text-red-800' 
    : 'bg-green-100 text-green-800';
});

const getRoleUpdateStatus = (user) => {
  switch(user.roleUpdateStatus) {
    case 'success':
      return 'Роль обновлена';
    case 'error':
      return 'Ошибка обновления';
    default:
      return 'Не изменено';
  }
};

const updateUserRole = async (user) => {
  if (user.email === 'superuser@example.com') {
    showNotification('Нельзя изменить роль суперпользователя', 'error');
    return;
  }

  try {
    isLoading.value = true;
    const userRef = dbRef(database, `users/${user.id}`);
    
    await set(userRef, {
      ...user,
      role: user.role,
      updatedAt: Date.now()
    });

    user.roleUpdateStatus = 'success';
    showNotification(`Роль пользователя ${user.username} успешно обновлена на ${user.role}`);
  } catch (error) {
    user.roleUpdateStatus = 'error';
    showNotification(`Произошла ошибка при обновлении роли: ${error.message}`, 'error');
    console.error('Ошибка при обновлении роли:', error);
  } finally {
    isLoading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    isLoading.value = true;
    const usersRef = dbRef(database, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      users.value = Object.entries(usersData).map(([id, userData]) => ({
        id,
        ...userData,
        roleUpdateStatus: ''
      }));
    } else {
      users.value = [];
    }
  } catch (error) {
    showNotification('Ошибка при загрузке пользователей: ' + error.message, 'error');
    console.error('Ошибка при загрузке пользователей:', error);
  } finally {
    isLoading.value = false;
  }
};

const deleteUser = async (user) => {
  if (user.email === 'superuser@example.com') {
    showNotification('Нельзя удалить суперпользователя', 'error');
    return;
  }

  if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.username}?`)) {
    return;
  }

  try {
    isLoading.value = true;
    const userRef = dbRef(database, `users/${user.id}`);
    await remove(userRef);
    
    users.value = users.value.filter(u => u.id !== user.id);
    showNotification('Пользователь успешно удален');
  } catch (error) {
    showNotification('Ошибка при удалении пользователя: ' + error.message, 'error');
    console.error('Ошибка при удалении пользователя:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Устанавливаем слушатель изменений в реальном времени
  const usersRef = dbRef(database, 'users');
  
  onValue(usersRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        users.value = Object.entries(usersData).map(([id, userData]) => ({
          id,
          ...userData,
          roleUpdateStatus: ''
        }));
      } else {
        users.value = [];
      }
    } catch (error) {
      console.error('Ошибка при получении данных пользователей:', error);
      showNotification('Ошибка при получении данных пользователей', 'error');
    }
  }, (error) => {
    console.error('Ошибка при подписке на обновления пользователей:', error);
    showNotification('Ошибка при подписке на обновления', 'error');
  });

  // Начальная загрузка
  fetchUsers();
});
</script>

<style scoped>
.notification {
  transition: all 0.3s ease;
}
</style>
