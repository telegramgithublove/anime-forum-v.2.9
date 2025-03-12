
<template>
  <div class="reply-container transform transition-all duration-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md p-4 mb-4">
    <div class="flex items-start">
      <!-- Аватар с монтированием из profile.js -->
      <div class="relative group mr-4">
        <img 
          :src="userAvatar || state.profile.avatarUrl || '/default-avatar.png'" 
          :alt="username || state.profile.username"
          class="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 dark:ring-blue-900 transition-transform duration-300"
          @error="handleAvatarError"
        />
      </div>

      <div class="flex-grow">
        <!-- Заголовок с именем пользователя и датой -->
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="font-medium text-gray-900 dark:text-gray-100">
              {{ username || state.profile.username || 'Аноним' }}
            </h3>
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ датаСоздания }}</span>
          </div>
          
          <!-- Кнопки справа -->
          <div class="flex items-center space-x-3">
            <button
              @click="handleLike"
              class="flex items-center space-x-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              :class="{ 'text-blue-600 dark:text-blue-400': isLiked }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{ 'fill-current': isLiked }" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span class="text-sm font-medium">{{ likeCount }}</span>
            </button>

            <button
              @click="handleReply"
              class="flex items-center space-x-1 text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span class="text-sm font-medium">Ответить</span>
            </button>
          </div>
        </div>

        <!-- Контент ответа -->
        <div class="prose dark:prose-invert max-w-none">
          <slot name="content">
            <p class="text-gray-700 dark:text-gray-300">{{ content }}</p>
          </slot>
        </div>
      </div>
    </div>

    <!-- Форма ответа -->
    <div v-if="showReplyForm" class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <textarea
        v-model="newReplyContent"
        class="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        rows="3"
        placeholder="Напишите ваш ответ..."
      ></textarea>
      <div class="flex justify-end space-x-2 mt-2">
        <button
          @click="cancelReply"
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
        >
          Отмена
        </button>
        <button
          @click="submitReply"
          :disabled="!newReplyContent.trim()"
          class="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-all duration-200"
        >
          Отправить
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default {
  name: 'Reply',
  emits: ['reply-submitted'],
  props: {
    replyId: {
      type: String,
      default: null
    },
    topicId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      default: ''
    },
    userAvatar: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    createdAt: {
      type: [Date, String, Number],
      required: true
    },
    initialLikes: {
      type: Number,
      default: 0
    }
  },

  setup(props, { emit }) {
    const store = useStore()
    const state = store.state.profile
    const showReplyForm = ref(false)
    const newReplyContent = ref('')
    const likeCount = ref(props.initialLikes)
    const isLiked = ref(false)

    const handleAvatarError = (e) => {
      e.target.src = '/default-avatar.png'
    }

    const датаСоздания = computed(() => {
      try {
        if (!props.createdAt) return 'Только что'

        let date
        if (typeof props.createdAt === 'number') {
          date = new Date(props.createdAt)
        } else if (typeof props.createdAt === 'string') {
          const timestamp = parseInt(props.createdAt)
          if (!isNaN(timestamp)) {
            date = new Date(timestamp)
          } else {
            date = new Date(props.createdAt)
          }
        } else if (props.createdAt instanceof Date) {
          date = props.createdAt
        } else {
          return 'Недавно'
        }

        if (isNaN(date.getTime())) {
          console.error('Невалидная дата:', props.createdAt)
          return 'Недавно'
        }

        return formatDistanceToNow(date, {
          addSuffix: true,
          locale: ru
        })
      } catch (error) {
        console.error('Ошибка форматирования даты:', error)
        return 'Недавно'
      }
    })

    const handleLike = () => {
      if (!isLiked.value) {
        likeCount.value++
        isLiked.value = true
      } else {
        likeCount.value--
        isLiked.value = false
      }
    }

    const handleReply = () => {
      showReplyForm.value = !showReplyForm.value
    }

    const cancelReply = () => {
      showReplyForm.value = false
      newReplyContent.value = ''
    }

    const submitReply = async () => {
      if (!newReplyContent.value.trim()) return

      try {
        const newReply = {
          topicId: props.topicId,
          content: newReplyContent.value,
          username: state.profile.username,
          userAvatar: state.profile.avatarUrl,
          parentId: props.replyId,
          createdAt: new Date().toISOString()
        }

        // Временно заменим на прямой вызов API, пока не настроим Vuex модуль
        try {
          // Здесь должен быть вызов API для сохранения ответа
          console.log('Отправка ответа:', newReply)
          
          newReplyContent.value = ''
          showReplyForm.value = false
          emit('reply-submitted')
        } catch (error) {
          console.error('Ошибка при сохранении ответа:', error)
        }
      } catch (error) {
        console.error('Ошибка при отправке ответа:', error)
      }
    }

    return {
      state,
      showReplyForm,
      newReplyContent,
      likeCount,
      isLiked,
      датаСоздания,
      handleLike,
      handleReply,
      cancelReply,
      submitReply,
      handleAvatarError
    }
  }
}
</script>

<style scoped>
.reply-container {
  transition: all 0.2s ease;
}

.reply-container:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>