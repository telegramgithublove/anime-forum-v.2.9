<template>
  <div v-if="show" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Предпросмотр</h3>
    
    <!-- Заголовок -->
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ title }}</h2>
    
    <!-- Контент -->
    <div class="prose dark:prose-invert max-w-none mb-6 text-gray-800 dark:text-gray-200" v-html="formattedContent"></div>
    
    <!-- Теги -->
    <div v-if="tags.length" class="flex flex-wrap gap-2 mb-6">
      <span
        v-for="tag in tags"
        :key="tag"
        class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-sm"
      >
        #{{ tag }}
      </span>
    </div>
    
    <!-- Изображения -->
    <div v-if="images.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div v-for="(image, index) in images" :key="index" class="relative">
        <img
          :src="image"
          :alt="'Image ' + (index + 1)"
          class="w-full h-48 object-cover rounded-lg"
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import DOMPurify from 'dompurify';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tags: {
    type: Array,
    default: () => []
  },
  images: {
    type: Array,
    default: () => []
  }
});

const formattedContent = computed(() => {
  if (!props.content) return '';
  
  // Форматируем текст
  let formatted = props.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');

  // Очищаем HTML
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
});
</script>

<style scoped>
.prose {
  max-width: none;
}

.prose :deep(p) {
  margin: 1em 0;
}

.prose :deep(strong) {
  font-weight: 600;
  color: inherit;
}

.prose :deep(em) {
  font-style: italic;
  color: inherit;
}

.prose :deep(u) {
  text-decoration: underline;
  color: inherit;
}
</style>
