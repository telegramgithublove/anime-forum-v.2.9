<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center gap-4">
          <!-- Стрелка назад на главную -->
          <router-link 
            to="/" 
            class="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-600 hover:text-purple-600 dark:hover:text-purple-200 transition-all duration-300 shadow-sm transform hover:scale-105"
            title="На главную"
          >
            <i class="fas fa-arrow-left text-lg"></i>
          </router-link>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent animate-gradient-text">
              {{ categoryName || 'Категория' }}
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
              {{ categoryDescription || 'Описание категории будет здесь...' }}
            </p>
          </div>
        </div>
        <router-link :to="{ name: 'create-post', params: { categoryId } }" class="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium rounded-full hover:from-purple-700 hover:to-indigo-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg">
          <i class="fas fa-plus mr-2"></i>
          Новая тема
        </router-link>
      </div>

      <div v-if="posts.length > 0 && !isLoading" class="space-y-6">
        <div v-for="post in sortedPosts" :key="post.id" class="group">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <router-link :to="{ name: 'post-details', params: { id: post.id }}" class="block p-8">
              <div class="flex items-start space-x-6">
                <div class="flex-shrink-0 text-center">
                  <img 
                    :src="post.authorAvatar" 
                    :alt="`${post.authorName}'s avatar`" 
                    class="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-200 dark:border-purple-700 group-hover:border-purple-400 dark:group-hover:border-purple-500 transition-colors duration-300 mx-auto"
                    @error="handleAvatarError($event)"
                  >
                  <span class="block mt-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {{ post.authorName }}
                  </span>
                </div>
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <h2 class="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-purple-400 hover:to-indigo-400 transform hover:-translate-y-0.5 transition-all duration-300 tracking-wide uppercase font-sans">
                      {{ post.title }}
                    </h2>
                    <span class="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
                      <span>{{ formatDate(post.createdAt) }}</span>
                      <span>{{ new Date(post.createdAt).toLocaleTimeString() }}</span>
                    </span>
                  </div>
                  <div v-if="post.tags && post.tags.length" class="mt-6 flex flex-wrap gap-3">
                    <span 
                      v-for="tag in post.tags" 
                      :key="tag"
                      class="px-4 py-2 text-base rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors duration-300 font-medium"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </router-link>
            <div class="flex items-center justify-between px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center space-x-4">
                <button 
                  @click.stop="toggleLike(post.id)"
                  class="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-500 transition-colors duration-200"
                  :disabled="isLoadingLikes"
                >
                  <i class="fas" :class="post.isLiked ? 'fa-heart text-purple-600 dark:text-purple-500' : 'fa-heart'"></i>
                  <span>{{ post.likesCount }}</span>
                </button>
                <span class="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <i class="fas fa-comment"></i>
                  <span>{{ post.comments ? Object.keys(post.comments).length : 0 }}</span>
                </span>
                <span class="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <i class="fas fa-eye"></i>
                  <span>{{ post.views }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
        <div class="relative w-32 h-32">
          <div class="absolute inset-0 border-4 border-t-purple-600 dark:border-t-purple-500 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
          <span class="absolute inset-0 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
            {{ loadingProgress }}%
          </span>
        </div>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 animate-pulse">
          Загрузка тем...
        </p>
      </div>
      <div v-else-if="posts.length === 0" class="text-center text-lg text-gray-600 dark:text-gray-400">
        Постов нет
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { getDatabase, ref as dbRef, get, onValue } from 'firebase/database';
import axios from 'axios'; // Импорт axios для profile.js

const route = useRoute();
const store = useStore();
const categoryId = route.params.categoryId;
const posts = ref([]);
const categoryName = ref('');
const categoryDescription = ref('');
const isLoading = ref(true);
const isLoadingLikes = ref(false);
const loadingProgress = ref(0);
const profileCache = ref({}); // Кэш для профилей
let unsubscribe = null;

onMounted(async () => {
  try {
    isLoading.value = true;
    loadingProgress.value = 0;
    const db = getDatabase();
    
    const categoryRef = dbRef(db, `categories/${categoryId}`);
    loadingProgress.value = 20;
    const categorySnapshot = await get(categoryRef);
    
    if (categorySnapshot.exists()) {
      const categoryData = categorySnapshot.val();
      categoryName.value = categoryData.name;
      categoryDescription.value = categoryData.description;
      loadingProgress.value = 40;
      
      await store.dispatch('posts/fetchPostsByCategory', categoryId);
      loadingProgress.value = 60;

      const postsRef = dbRef(db, `categories/${categoryId}/posts`);
      unsubscribe = onValue(postsRef, async (snapshot) => {
        loadingProgress.value = 80;
        if (snapshot.exists()) {
          const postsData = snapshot.val();
          const currentUserId = store.state.auth.user?.uid || localStorage.getItem('userId');
          console.log('[CategoryPosts] Current user ID:', currentUserId);
          console.log('[CategoryPosts] Auth username:', store.getters['auth/getUsername']);

          const postsArray = await Promise.all(Object.entries(postsData).map(async ([id, post]) => {
            console.log('[CategoryPosts] Post:', { id, authorId: post.authorId });
            let authorName;
            let authorAvatar;
            let authorSignature;
            let authorProfile = null;

            if (!post.authorId) {
              console.warn('[CategoryPosts] No authorId for post:', id);
              authorName = post.authorName || 'Неизвестный';
              authorAvatar = '/image/empty_avatar.png';
              authorSignature = 'Участник форума';
            } else if (post.authorId === currentUserId) {
              authorName = store.getters['auth/getUsername'];
              authorAvatar = store.getters['auth/getUserAvatar'];
              authorSignature = store.getters['auth/getUserSignature'];
              console.log('[CategoryPosts] Current user post - Name:', authorName, 'Avatar:', authorAvatar);
            } else {
              try {
                if (!profileCache.value[post.authorId]) {
                  await store.dispatch('profile/fetchProfile', post.authorId);
                  profileCache.value[post.authorId] = store.getters['profile/getProfile'];
                }
                authorProfile = profileCache.value[post.authorId];
                console.log('[CategoryPosts] Profile from cache for authorId:', post.authorId, authorProfile);
                authorName = authorProfile?.username || post.authorName || 'Гость';
                authorAvatar = store.getters['profile/getAvatarUrl'] || '/image/empty_avatar.png';
                authorSignature = authorProfile?.signature || 'Участник форума';
                console.log('[CategoryPosts] Other user - Name:', authorName, 'Avatar:', authorAvatar, 'Signature:', authorSignature);
              } catch (error) {
                console.error('[CategoryPosts] Failed to fetch profile for authorId:', post.authorId, error);
                authorName = post.authorName || 'Гость';
                authorAvatar = '/image/empty_avatar.png';
                authorSignature = 'Участник форума';
              }
            }

            const isLiked = post.likes && currentUserId && post.likes[currentUserId] || false;

            return {
              id,
              ...post,
              authorName,
              authorAvatar,
              authorSignature,
              tags: Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : ['форум']),
              likes: post.likes || {},
              likesCount: post.likesCount || Object.keys(post.likes || {}).length,
              comments: post.comments || [],
              views: post.views || 0,
              createdAt: post.createdAt || 0,
              isLiked
            };
          }));
          posts.value = postsArray;
          console.log('[CategoryPosts] Posts updated:', posts.value);
          loadingProgress.value = 100;
        } else {
          posts.value = [];
        }
        setTimeout(() => {
          isLoading.value = false;
          loadingProgress.value = 0;
        }, 500);
      });
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    isLoading.value = false;
    loadingProgress.value = 0;
  }
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

const sortedPosts = computed(() => {
  return [...posts.value].sort((a, b) => {
    const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt;
    const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt;
    return bTime - aTime;
  });
});

const formatDate = (timestamp) => {
  if (!timestamp) return 'Неизвестно';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const toggleLike = async (postId) => {
  try {
    isLoadingLikes.value = true;
    const updatedPost = await store.dispatch('posts/toggleLike', postId);
    const postIndex = posts.value.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      const currentUserId = store.state.auth.user?.uid || localStorage.getItem('userId');
      const isLiked = updatedPost.likes && updatedPost.likes[currentUserId] || false;
      posts.value[postIndex] = {
        ...posts.value[postIndex],
        likes: updatedPost.likes,
        likesCount: updatedPost.likesCount,
        isLiked
      };
      console.log('[CategoryPosts] Updated post after like:', posts.value[postIndex]);
    }
  } catch (error) {
    console.error('Ошибка при переключении лайка:', error);
  } finally {
    isLoadingLikes.value = false;
  }
};

// Обработчик ошибки загрузки аватарки
const handleAvatarError = (event) => {
  event.target.src = '/image/empty_avatar.png'; // Подставляем пустышку при ошибке
};
</script>

<style scoped>
.animate-gradient-text {
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>