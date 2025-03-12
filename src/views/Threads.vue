<template>
  <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300">
    <div class="p-6 bg-gray-50 rounded-lg shadow-md">
      <!-- Отображаем название категории -->
      <h1 class="main-title text-2xl font-semibold mb-4" v-if="category">{{ category.name }}</h1>
      <h2 class="text-lg mb-4" v-if="category">Темы в категории: {{ category.name }}</h2>

      <!-- Кнопка для добавления новой темы -->
      <router-link :to="categoryId ? `/category/${categoryId}/add-topic` : '#'">
        <button 
          v-if="categoryId" 
          class="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 mb-4">
          Добавить тему
        </button>
        <p v-else class="text-red-500">Категория не найдена. Кнопка для добавления темы недоступна.</p>
      </router-link>

      <!-- Список постов (если есть) -->
      <div v-if="posts && posts.length" v-for="post in posts" :key="post.id" class="post-card mb-4">
        <h3 class="font-semibold text-lg">{{ post.content }}</h3>
        <p class="text-sm text-gray-500">{{ post.createdAt }}</p>
      </div>
      <p v-else>Нет постов в этой категории.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

const store = useStore();
const route = useRoute();
const categoryId = computed(() => route.params.categoryId); // ID категории из URL

// Получаем категорию из состояния хранилища (из модуля admin)
const category = computed(() => {
  const categories = store.state.admin.categories;  // Используем категорию из модуля admin
  if (categories && categories.length > 0) {
    return categories.find(cat => cat.id === categoryId.value); // Находим категорию по ID
  }
  return null;
});

// Получаем посты в категории
const posts = computed(() => store.getters['posts/getPostsByCategory'](categoryId.value));

onMounted(() => {
  store.dispatch('posts/fetchPosts'); // Загружаем все посты
});
</script>

<style scoped>
.main-title {
  font-size: 2rem;
  font-weight: bold;
}
.post-card {
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
}
</style>
