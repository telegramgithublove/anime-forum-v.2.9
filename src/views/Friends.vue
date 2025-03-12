<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Мои друзья</h1>
    
    <!-- Поиск друзей -->
    <div class="mb-6">
      <div class="relative">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Поиск друзей..." 
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
        >
        <span class="material-icons absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          search
        </span>
      </div>
    </div>

    <!-- Список друзей -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="friends.length === 0" class="col-span-full text-center text-gray-500">
        У вас пока нет друзей. Начните общаться на форуме, чтобы найти единомышленников!
      </div>
      
      <div v-for="friend in filteredFriends" :key="friend.id" 
        class="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
        <img :src="friend.avatar" :alt="friend.username" class="w-12 h-12 rounded-full object-cover">
        <div class="flex-1">
          <h3 class="font-semibold">{{ friend.username }}</h3>
          <p class="text-sm text-gray-500">{{ friend.status }}</p>
        </div>
        <button class="text-red-500 hover:text-red-600">
          <span class="material-icons">person_remove</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const friends = ref([
  // Здесь будут данные о друзьях из базы данных
]);

const filteredFriends = computed(() => {
  if (!searchQuery.value) return friends.value;
  const query = searchQuery.value.toLowerCase();
  return friends.value.filter(friend => 
    friend.username.toLowerCase().includes(query)
  );
});
</script>
