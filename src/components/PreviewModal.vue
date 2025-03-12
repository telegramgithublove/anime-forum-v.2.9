<template>
  <div v-if="post" class="preview-modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="$emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Заголовок и кнопка закрытия -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Предпросмотр поста</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Содержимое поста -->
      <div class="p-6">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ post.title }}</h3>
        
        <!-- Информация об авторе -->
        <div class="flex items-center mb-4">
          <img :src="post.author?.avatar || '/image/default-avatar.png'" 
               :alt="post.author?.username"
               class="w-10 h-10 rounded-full mr-3">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ post.author?.username || 'Неизвестный пользователь' }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(post.createdAt) }}
            </p>
          </div>
        </div>

        <!-- Контент поста -->
        <div class="prose dark:prose-invert max-w-none mb-6">
          {{ post.content }}
        </div>

        <!-- Медиафайлы -->
        <div v-if="post.attachments?.length" class="grid grid-cols-2 gap-4 mb-6">
          <div v-for="(attachment, index) in post.attachments" 
               :key="index" 
               class="relative group">
            <img v-if="isImage(attachment.type)"
                 :src="attachment.url"
                 :alt="attachment.name"
                 class="rounded-lg w-full h-48 object-cover">
            <video v-else-if="isVideo(attachment.type)"
                   :src="attachment.url"
                   class="rounded-lg w-full h-48 object-cover"
                   controls>
            </video>
          </div>
        </div>

        <!-- Статистика поста -->
        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div class="flex items-center space-x-4">
            <span>
              <i class="fas fa-heart mr-1"></i>
              {{ post.likes?.length || 0 }} лайков
            </span>
            <span>
              <i class="fas fa-comment mr-1"></i>
              {{ post.comments?.length || 0 }} комментариев
            </span>
          </div>
          <span>
            <i class="fas fa-eye mr-1"></i>
            {{ post.views || 0 }} просмотров
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  post: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return 'Дата не указана'
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp.toDate()
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Проверка типа файла
const isImage = (type) => type?.startsWith('image/')
const isVideo = (type) => type?.startsWith('video/')
</script>

<style scoped>
.preview-modal {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
