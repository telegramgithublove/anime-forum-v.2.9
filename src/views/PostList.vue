<template>
  <div class="post-list-container min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Заголовок секции -->
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white">
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Обсуждения
          </span>
        </h1>
        <button @click="createNewPost" 
                class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full 
                       shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-200">
          <i class="fas fa-plus mr-2"></i>
          Создать пост
        </button>
      </div>

      <!-- Список постов -->
      <div class="space-y-6">
        <article v-for="post in posts" :key="post.id" 
                 class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 
                        transition-all duration-300 overflow-hidden">
          <div class="p-6">
            <!-- Заголовок и мета-информация -->
            <div class="flex items-center space-x-4 mb-4">
              <img :src="post.authorAvatar || '/image/empty_avatar.png'" 
                   :alt="post.author"
                   class="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30" />
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white hover:text-purple-600 
                           dark:hover:text-purple-400 transition-colors duration-200">
                  <router-link :to="{ name: 'post', params: { id: post.id }}">
                    {{ post.title }}
                  </router-link>
                </h2>
                <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="font-medium">{{ post.author }}</span>
                  <span>&bull;</span>
                  <time>{{ formatDate(post.createdAt) }}</time>
                </div>
              </div>
            </div>

            <!-- Превью контента -->
            <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
              {{ post.content }}
            </p>

            <!-- Теги -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span v-for="tag in post.tags" 
                    :key="tag"
                    class="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 
                           text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/50 
                           transition-colors duration-200 cursor-pointer">
                #{{ tag }}
              </span>
            </div>

            <!-- Действия с постом -->
            <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <div class="flex items-center space-x-6">
                <!-- Лайки -->
                <button @click="toggleLike(post)" 
                        class="group flex items-center space-x-2"
                        :class="{ 'text-red-500': post.isLiked, 'text-gray-500 dark:text-gray-400': !post.isLiked }">
                  <i class="fas fa-heart text-lg group-hover:scale-110 transition-transform"></i>
                  <span class="font-medium">{{ post.likes }}</span>
                </button>

                <!-- Комментарии -->
                <router-link :to="{ name: 'post', params: { id: post.id }}" 
                           class="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 
                                  hover:text-purple-600 dark:hover:text-purple-400">
                  <i class="fas fa-comment text-lg group-hover:scale-110 transition-transform"></i>
                  <span class="font-medium">{{ post.comments }}</span>
                </router-link>

                <!-- Поделиться -->
                <button @click="sharePost(post)" 
                        class="group flex items-center space-x-2 text-gray-500 dark:text-gray-400 
                               hover:text-purple-600 dark:hover:text-purple-400">
                  <i class="fas fa-share text-lg group-hover:scale-110 transition-transform"></i>
                </button>
              </div>

              <!-- Дополнительные действия -->
              <div class="flex items-center space-x-2">
                <button v-if="canModifyPost(post)" 
                        @click="editPost(post)"
                        class="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 
                               dark:hover:text-purple-400 transition-colors">
                  <i class="fas fa-edit"></i>
                </button>
                <button v-if="canModifyPost(post)" 
                        @click="deletePost(post)"
                        class="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 
                               dark:hover:text-red-400 transition-colors">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- Пагинация -->
      <div class="mt-8 flex justify-center">
        <nav class="flex items-center space-x-2">
          <button @click="prevPage" 
                  :disabled="currentPage === 1"
                  class="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 
                         hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 
                         transition-colors duration-200">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Страница {{ currentPage }} из {{ totalPages }}
          </span>
          <button @click="nextPage" 
                  :disabled="currentPage === totalPages"
                  class="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 
                         hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 
                         transition-colors duration-200">
            <i class="fas fa-chevron-right"></i>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const router = useRouter()
const store = useStore()

const currentPage = ref(1)
const postsPerPage = 10

// Получаем посты из store
const allPosts = computed(() => {
  const postsObj = store.state.posts.posts || {}
  return Object.values(postsObj).sort((a, b) => b.createdAt - a.createdAt)
})

// Пагинация
const posts = computed(() => {
  const start = (currentPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  return allPosts.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(allPosts.value.length / postsPerPage))

// Форматирование даты
const formatDate = (date) => {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: ru })
}

// Обработчики действий
const toggleLike = async (post) => {
  try {
    await store.dispatch('posts/toggleLike', post.id)
  } catch (error) {
    console.error('Ошибка при обновлении лайка:', error)
  }
}

const sharePost = (post) => {
  const url = window.location.origin + router.resolve({
    name: 'post',
    params: { id: post.id }
  }).href
  
  if (navigator.share) {
    navigator.share({
      title: post.title,
      text: post.content.substring(0, 100) + '...',
      url: url
    })
  } else {
    navigator.clipboard.writeText(url)
    // TODO: Показать уведомление о копировании
  }
}

const createNewPost = () => {
  router.push({ name: 'create-post' })
}

const canModifyPost = (post) => {
  const currentUser = store.state.auth.user
  return currentUser && (currentUser.uid === post.userId || currentUser.isAdmin)
}

const editPost = (post) => {
  router.push({ name: 'edit-post', params: { id: post.id } })
}

const deletePost = async (post) => {
  if (!confirm('Вы уверены, что хотите удалить этот пост?')) return
  
  try {
    await store.dispatch('posts/deletePost', post.id)
  } catch (error) {
    console.error('Ошибка при удалении поста:', error)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const fetchPosts = async () => {
  try {
    await store.dispatch('posts/fetchPosts')
  } catch (error) {
    console.error('Ошибка при загрузке постов:', error)
  }
}

onMounted(() => {
  fetchPosts()
})
</script>