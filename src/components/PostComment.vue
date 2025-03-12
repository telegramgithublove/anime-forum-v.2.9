<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4 transform hover:scale-[1.01] transition-all duration-300">
    <!-- Заголовок и метаданные -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-4">
        <img 
          :src="comment.user?.avatar || '/image/empty_avatar.png'" 
          :alt="comment.user?.username"
          class="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30"
        />
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ comment.user?.username || 'Анонимный пользователь' }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDate(comment.createdAt) }}
          </p>
        </div>
      </div>
      
      <!-- Кнопки действий -->
      <div class="flex items-center space-x-2">
        <button 
          v-if="canModify" 
          @click="handleEdit"
          class="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
        >
          <i class="fas fa-edit"></i>
        </button>
        <button 
          v-if="canModify" 
          @click="handleDelete"
          class="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>

    <!-- Заголовок поста (если есть) -->
    <h2 v-if="comment.title" class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
      {{ comment.title }}
    </h2>

    <!-- Контент -->
    <div class="prose dark:prose-invert max-w-none mb-6">
      {{ comment.text }}
    </div>

    <!-- Прикрепленные файлы -->
    <div v-if="comment.attachments?.length" class="mb-6">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Прикрепленные файлы
      </h4>
      <div class="flex flex-wrap gap-3">
        <a
          v-for="file in comment.attachments"
          :key="file.id"
          :href="file.url"
          target="_blank"
          class="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg
                 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 
                 dark:hover:bg-gray-600 transition-colors"
        >
          <i class="fas fa-paperclip mr-2"></i>
          <span>{{ file.name }}</span>
        </a>
      </div>
    </div>

    <!-- Теги -->
    <div v-if="comment.tags?.length" class="flex flex-wrap gap-2 mb-6">
      <span
        v-for="tag in comment.tags"
        :key="tag"
        class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full
               text-purple-600 dark:text-purple-400 text-sm font-medium"
      >
        #{{ tag }}
      </span>
    </div>

    <!-- Действия с комментарием -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center space-x-6">
        <!-- Лайки -->
        <button 
          @click="handleLike"
          class="flex items-center space-x-2 group"
          :class="{ 'text-red-500': isLiked, 'text-gray-500 dark:text-gray-400': !isLiked }"
        >
          <i class="fas fa-heart text-lg group-hover:scale-110 transition-transform"></i>
          <span class="font-medium">{{ comment.likes || 0 }}</span>
        </button>

        <!-- Ответы -->
        <button 
          @click="handleReply"
          class="flex items-center space-x-2 text-gray-500 dark:text-gray-400 
                 hover:text-purple-600 dark:hover:text-purple-400 group"
        >
          <i class="fas fa-reply text-lg group-hover:scale-110 transition-transform"></i>
          <span class="font-medium">{{ comment.replies || 0 }}</span>
        </button>

        <!-- Поделиться -->
        <button 
          @click="handleShare"
          class="flex items-center space-x-2 text-gray-500 dark:text-gray-400 
                 hover:text-purple-600 dark:hover:text-purple-400 group"
        >
          <i class="fas fa-share text-lg group-hover:scale-110 transition-transform"></i>
        </button>
      </div>
    </div>

    <!-- Форма ответа -->
    <div v-if="showReplyForm" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <textarea
        v-model="replyText"
        placeholder="Написать ответ..."
        class="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 
               dark:border-gray-600 focus:ring-2 focus:ring-purple-500/50 
               focus:border-purple-500 text-gray-900 dark:text-white resize-none
               transition-all duration-200"
        rows="3"
      ></textarea>
      <div class="flex justify-end space-x-3 mt-3">
        <button
          @click="cancelReply"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 
                 dark:bg-gray-700 rounded-lg hover:bg-gray-200 
                 dark:hover:bg-gray-600 transition-colors"
        >
          Отмена
        </button>
        <button
          @click="submitReply"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg 
                 hover:bg-purple-700 transition-colors"
          :disabled="!replyText.trim()"
        >
          Ответить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  postId: {
    type: Number,
    required: true
  }
})

const store = useStore()
const showReplyForm = ref(false)
const replyText = ref('')
const isLiked = ref(false)

// Проверяем, может ли пользователь модифицировать комментарий
const canModify = computed(() => {
  const currentUser = store.state.auth.user
  return currentUser && (
    currentUser.id === props.comment.userId || 
    currentUser.role === 'admin'
  )
})

// Форматирование даты
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = typeof timestamp === 'object' ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'dd MMMM yyyy в HH:mm', { locale: ru })
}

// Обработчики действий
const handleLike = () => {
  isLiked.value = !isLiked.value
  // Здесь добавить логику обновления лайков в базе данных
}

const handleReply = () => {
  showReplyForm.value = !showReplyForm.value
}

const handleShare = () => {
  // Копируем ссылку в буфер обмена
  navigator.clipboard.writeText(window.location.href)
}

const handleEdit = () => {
  // Добавить логику редактирования
}

const handleDelete = async () => {
  if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
    // Добавить логику удаления
  }
}

const submitReply = async () => {
  if (!replyText.value.trim()) return

  try {
    await store.dispatch('posts/createReply', {
      postId: props.postId,
      commentId: props.comment.id,
      text: replyText.value
    })
    replyText.value = ''
    showReplyForm.value = false
  } catch (error) {
    console.error('Ошибка при отправке ответа:', error)
  }
}

const cancelReply = () => {
  showReplyForm.value = false
  replyText.value = ''
}
</script>
