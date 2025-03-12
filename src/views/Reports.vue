<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-4">Управление жалобами</h1>

    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Жалоба</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="report in reports" :key="report.id">
          <td class="px-6 py-4 whitespace-nowrap">{{ report.username }}</td>
          <td class="px-6 py-4 whitespace-nowrap">{{ report.complaint }}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <button @click="banUser(report.id, 'permanent')" class="text-red-600 hover:text-red-800 mr-2">Черный бан</button>
            <button @click="banUser(report.id, 'temporary')" class="text-yellow-600 hover:text-yellow-800 mr-2">Временный бан</button>
            <button @click="muteUser(report.id)" class="text-blue-600 hover:text-blue-800">Мут</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Список жалоб пользователей
const reports = ref([
  { id: 1, username: 'user1', complaint: 'Неприемлемое поведение' },
  { id: 2, username: 'user2', complaint: 'Спам' },
  { id: 3, username: 'user3', complaint: 'Оскорбления' },
]);

// Функция для бана пользователя
const banUser = (userId, type) => {
  // Здесь должна быть логика для бана пользователя
  if (type === 'permanent') {
    alert(`Пользователь с ID ${userId} был забанен навсегда.`);
  } else if (type === 'temporary') {
    alert(`Пользователь с ID ${userId} был временно забанен.`);
  }
};

// Функция для мьютирования пользователя
const muteUser = (userId) => {
  // Здесь должна быть логика для мьютирования пользователя
  alert(`Пользователь с ID ${userId} был замучен.`);
};
</script>

<style scoped>
/* Можно добавить дополнительные стили, если необходимо */
</style>
