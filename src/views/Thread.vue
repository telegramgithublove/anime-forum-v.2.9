<template>
  <div class="min-h-screen p-4 bg-gradient-to-r from-purple-100 to-blue-100">
    <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
      <header class="mb-4">
        <h2 class="text-2xl font-bold text-purple-700 mb-4">Добавить тему</h2>
      </header>
      <div class="space-y-4">
        <textarea
          v-model="postContent"
          class="w-full p-4 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Введите текст вашего поста..."
          rows="6"
          maxlength="333"
          @input="handleInput"
        ></textarea>
        <p class="text-sm text-gray-500 text-right">{{ remainingCharacters }} символов осталось</p>
        <button @click="submitPost" class="mt-4 bg-purple-700 text-white px-6 py-2 rounded-lg shadow hover:bg-purple-800">
          <i class="fas fa-paper-plane mr-2"></i> Опубликовать
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

const store = useStore();
const route = useRoute();
const postContent = ref('');
const remainingCharacters = ref(333);
const categoryId = computed(() => route.params.categoryId); // ID категории из URL

function handleInput() {
  remainingCharacters.value = Math.max(333 - postContent.value.length, 0);
}

async function submitPost() {
  if (postContent.value.trim() !== '') {
    await store.dispatch('posts/addPost', { content: postContent.value, categoryId: categoryId.value });
    postContent.value = '';
    remainingCharacters.value = 333;
  } else {
    alert('Пост не может быть пустым.');
  }
}
</script>

<style scoped>
/* Стили кнопок и полей */
button i {
  font-size: 1.2rem;
}
</style>
