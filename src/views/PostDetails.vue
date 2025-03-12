<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 p-4 sm:p-6 md:p-8">
    <div class="max-w-4xl mx-auto space-y-8 pb-48">
      <!-- Кнопка назад -->
      <button @click="goBack" class="group flex items-center space-x-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-all duration-300">
        <i class="fas fa-arrow-left text-lg transform group-hover:-translate-x-1 transition-transform duration-300"></i>
        <span class="text-sm font-semibold uppercase tracking-wide">Назад</span>
      </button>

      <!-- Загрузка -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
      </div>

      <!-- Контейнер поста и комментариев -->
      <div v-else-if="post" class="space-y-12">
        <!-- Карточка поста -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform hover:shadow-2xl transition-all duration-300">
          <!-- Шапка поста -->
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-6">
              <div class="flex-shrink-0 group">
                <img :src="authorData.avatar || '/image/empty_avatar.png'"
                     :alt="authorData.name"
                     class="w-16 h-16 rounded-full ml-6 object-cover ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300"
                     @error="handleAvatarError">
                <div class="mt-2 text-center">
                  <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ authorData.name }}</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ authorData.signature }}</p>
                </div>
              </div>
              <div class="flex-1">
                <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 leading-tight">
                  {{ post.title }}
                </h1>
                <div class="mt-3 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <span class="flex items-center">
                    <i class="fas fa-calendar-alt mr-2"></i>
                    {{ formatDate(post.createdAt) }}
                  </span>
                  <span class="flex items-center">
                    <i class="fas fa-clock mr-2"></i>
                    {{ formatTime(post.createdAt) }}
                  </span>
                </div>
                <div v-if="post.tags && post.tags.length" class="mt-4 flex flex-wrap gap-2">
                  <span v-for="tag in post.tags" :key="tag" class="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-xs font-medium">
                    #{{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Содержимое поста -->
          <div class="p-6">
            <div class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-200" v-html="post.content || ''"></div>
            <div v-if="post.pictures && Object.keys(post.pictures).length" class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div v-for="(image, index) in Object.values(post.pictures)" :key="index" class="relative group">
                <img :src="getImageUrl(image)" class="w-full h-40 object-cover rounded-lg shadow-md transform group-hover:scale-105 transition-transform duration-300" :alt="'Изображение ' + (index + 1)" @error="handleImageError">
              </div>
            </div>
            <div v-if="post.videos && post.videos.length" class="mt-6 space-y-4">
              <div v-for="(video, index) in post.videos" :key="index">
                <video :src="video" class="w-full rounded-lg shadow-md" controls preload="metadata"></video>
              </div>
            </div>
            <div v-if="post.audio && post.audio.length" class="mt-6 space-y-4">
              <div v-for="(audioFile, index) in post.audio" :key="index" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <audio :src="audioFile" class="w-full" controls preload="metadata"></audio>
              </div>
            </div>
            <div v-if="post.documents && post.documents.length" class="mt-6 space-y-3">
              <div v-for="(doc, index) in post.documents" :key="index" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300">
                <div class="flex items-center space-x-3">
                  <i class="fas fa-file-alt text-xl text-purple-500"></i>
                  <div>
                    <span class="text-gray-900 dark:text-white font-medium">{{ doc.name || `Документ ${index + 1}` }}</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(doc.size) }}</p>
                  </div>
                </div>
                <button @click="downloadDocument(doc.url, doc.name)" class="flex items-center space-x-2 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-300">
                  <i class="fas fa-download"></i>
                  <span class="text-sm">Скачать</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Действия с постом -->
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-6">
                <button @click="handleLike" class="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-all duration-300" :class="{ 'text-red-500': isLikedByCurrentUser }">
                  <i class="fas fa-heart text-lg" :class="{ 'fas': isLikedByCurrentUser, 'far': !isLikedByCurrentUser }"></i>
                  <span class="text-sm font-medium">{{ likesCount }}</span>
                </button>
                <button @click="focusComment" class="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all duration-300">
                  <i class="fas fa-comment text-lg"></i>
                  <span class="text-sm font-medium">{{ comments.length }}</span>
                </button>
              </div>
              <div class="relative group">
                <button @click="toggleFavorite" class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-all duration-300" :class="{ 'text-yellow-500': isFavorite }">
                  <i class="fas fa-star text-lg" :class="{ 'fas': isFavorite, 'far': !isFavorite }"></i>
                </button>
                <span class="absolute right-0 top-[-2rem] w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  {{ isFavorite ? 'Удалить из избранного' : 'Добавить в избранное' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Секция комментариев -->
        <div class="space-y-6">
          <div class="flex items-center space-x-3">
            <i class="fas fa-comments text-2xl text-purple-500"></i>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Комментарии</h2>
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">({{ totalComments }})</span>
          </div>
          <Comments :post-id="postId" :current-page="currentPage" :items-per-page="itemsPerPage" />
          <Pagination :total-items="totalComments" :items-per-page="itemsPerPage" :current-page="currentPage" @page-changed="handlePageChange" />
        </div>

        <!-- Форма комментария -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:shadow-2xl transition-all duration-300">
          <div class="flex items-center space-x-3 mb-4">
            <i class="fas fa-pen-alt text-2xl text-purple-500"></i>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Оставить комментарий</h2>
          </div>
          <div class="flex items-start space-x-4">
            <img :src="currentUser.avatarUrl || '/image/empty_avatar.png'" :alt="currentUser.username || 'Гость'" @error="handleAvatarError" class="w-12 h-12 rounded-full object-cover border-2 border-purple-500">
            <div class="flex-1 space-y-3">
              <div class="text-base font-semibold text-gray-900 dark:text-white">{{ currentUser.username || 'Гость' }}</div>
              <textarea
                v-model="commentContent"
                placeholder="Напишите ваш комментарий..."
                class="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] max-h-[200px] resize-none overflow-y-auto transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                @input="handleCommentInput"
                @keydown="handleKeyDown"
              ></textarea>
              <div v-if="imagePreview" class="mt-4">
                <img :src="imagePreview" alt="Предпросмотр изображения" class="max-w-full h-auto rounded-lg shadow-md" />
              </div>

              <div class="flex items-center justify-between">
                <div class="inline-flex items-center space-x-1.5 text-sm px-3 py-1 bg-gray-50 dark:bg-gray-700 rounded-full" :class="{ 'text-red-600': remainingChars <= 0, 'text-yellow-600': remainingChars <= 50 && remainingChars > 0, 'text-gray-600': remainingChars > 50 }">
                  <span class="font-mono font-medium">{{ remainingChars }}</span>
                  <span class="font-medium">символов осталось</span>
                </div>
                <div class="flex items-center space-x-3">
                  <label class="relative cursor-pointer">
                    <input type="file" accept="image/*" @change="handleImageUpload" class="hidden">
                    <i class="fas fa-image text-lg text-purple-600 hover:text-purple-700 transition-all duration-300"></i>
                  </label>
                  <label class="relative cursor-pointer">
                    <input type="file" accept="audio/*" @change="handleAudioUpload" class="hidden">
                    <i class="fas fa-music text-lg text-purple-600 hover:text-purple-700 transition-all duration-300"></i>
                  </label>
                  <label class="relative cursor-pointer">
                    <input type="file" accept="video/*" @change="handleVideoUpload" class="hidden">
                    <i class="fas fa-video text-lg text-purple-600 hover:text-purple-700 transition-all duration-300"></i>
                  </label>
                </div>
                <button @click="submitComment" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transform hover:scale-105 transition-all duration-300" :disabled="!commentContent.trim() && !hasAttachments">
                  <i class="fas fa-paper-plane"></i>
                  <span class="text-sm font-medium">Отправить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import Comments from '../components/Comments.vue';
import Pagination from '../components/Pagination.vue';

const store = useStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const commentContent = ref('');
const imagePreview = ref(null);

const post = ref(null);
const comments = computed(() => store.getters['comments/getComments'] || []);
const isLoading = ref(true);
const postId = computed(() => route.params.id);

const currentPage = computed(() => store.getters['pagination/getCurrentPage']);
const itemsPerPage = ref(10);
const allComments = computed(() => store.getters['comments/getComments'] || []);
const totalComments = computed(() => allComments.value.length);

const MAX_CHARS = 333;

const remainingChars = computed(() => MAX_CHARS - (commentContent.value?.length || 0));
const imageFile = ref(null);
const audioFile = ref(null);
const videoFile = ref(null);

const hasAttachments = computed(() => imageFile.value || audioFile.value || videoFile.value);

onMounted(async () => {
  try {
    isLoading.value = true;
    const postData = await store.dispatch('posts/fetchPostById', postId.value);
    post.value = postData || null;
    await store.dispatch('comments/fetchComments', postId.value);
    store.dispatch('pagination/setTotalItems', allComments.value.length);
    isLoading.value = false;
  } catch (error) {
    console.error('Error loading post or comments:', error);
    toast.error('Ошибка при загрузке данных');
    isLoading.value = false;
  }
});

const authorData = computed(() => {
  if (post.value?.author) {
    return {
      name: post.value.author.username || currentUser.value.username || 'Гость',
      avatar: post.value.author.avatarUrl || currentUser.value.avatarUrl || '/image/empty_avatar.png',
      signature: post.value.author.signature || currentUser.value.signature || 'Участник форума'
    };
  }
  return {
    name: currentUser.value.username || 'Гость',
    avatar: currentUser.value.avatarUrl || '/image/empty_avatar.png',
    signature: currentUser.value.signature || 'Участник форума'
  };
});

const currentUser = computed(() => {
  const profile = store.state.profile?.profile || {};
  return {
    username: profile.username || '',
    avatarUrl: profile.avatarUrl || '/image/empty_avatar.png',
    signature: profile.signature || 'Участник форума'
  };
});

const likesCount = computed(() => {
  if (!post.value?.likes) return 0;
  return Object.keys(post.value.likes).length;
});

const isLikedByCurrentUser = computed(() => {
  const user = store.state.auth.user;
  if (!post.value?.likes || !user) return false;
  return Boolean(post.value.likes[user.uid]);
});

const isFavorite = computed(() => {
  const user = store.state.auth.user;
  if (!post.value?.favorites || !user) return false;
  return Boolean(post.value.favorites[user.uid]);
});

const goBack = () => router.replace('/');

const handleLike = async () => {
  const user = store.state.auth.user;
  if (!user) {
    toast.warning('Пожалуйста, войдите в систему, чтобы поставить лайк');
    return;
  }
  try {
    const updatedPost = await store.dispatch('posts/toggleLike', post.value.id);
    post.value = updatedPost;
  } catch (error) {
    toast.error('Не удалось поставить лайк');
    console.error('Error toggling like:', error);
  }
};

const toggleFavorite = async () => {
  const user = store.state.auth.user;
  if (!user) {
    toast.warning('Пожалуйста, войдите в систему, чтобы добавить в избранное');
    return;
  }
  try {
    const updatedPost = await store.dispatch('posts/toggleFavorite', post.value.id);
    post.value = updatedPost;
    toast.success(isFavorite.value ? 'Добавлено в избранное' : 'Удалено из избранного');
  } catch (error) {
    toast.error('Не удалось обновить избранное');
    console.error('Error toggling favorite:', error);
  }
};

const focusComment = () => {
  const textarea = document.querySelector('textarea');
  if (textarea) textarea.focus();
};

const handleCommentInput = (event) => {
  if (event.target.value.length > MAX_CHARS) {
    commentContent.value = event.target.value.slice(0, MAX_CHARS);
  }
};

const handleKeyDown = (event) => {
  if (remainingChars.value <= 0 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
  }
};

const handleImageUpload = (event) => {
  imageFile.value = event.target.files[0];
  if (imageFile.value) {
    imagePreview.value = URL.createObjectURL(imageFile.value);
  }
};

const handleAudioUpload = (event) => {
  audioFile.value = event.target.files[0];
  toast.info(`Выбрана музыка: ${audioFile.value.name}`);
};

const handleVideoUpload = (event) => {
  videoFile.value = event.target.files[0];
  toast.info(`Выбрано видео: ${videoFile.value.name}`);
};

const submitComment = async () => {
  if (!commentContent.value.trim() && !hasAttachments.value) {
    toast.warning('Пожалуйста, введите текст комментария или прикрепите файл');
    return;
  }
  const user = store.state.auth.user;
  if (!user) {
    toast.error('Пожалуйста, войдите в систему');
    return;
  }
  try {
    let imageUrl = null;
    if (imageFile.value) {
      imageUrl = await store.dispatch('picture/uploadImage', { 
        file: imageFile.value, 
        type: 'comment' 
      });
    }

    const commentData = {
      postId: postId.value,
      content: commentContent.value.trim() || '',
      image: imageUrl || null,
    };

    await store.dispatch('comments/addComment', commentData);
    commentContent.value = '';
    imageFile.value = null;
    imagePreview.value = null;
    toast.success('Комментарий успешно добавлен!');
  } catch (error) {
    console.error('Error submitting comment:', error);
    toast.error('Не удалось отправить комментарий');
  }
};

const handlePageChange = (page) => store.dispatch('pagination/setCurrentPage', page);
const handleAvatarError = (event) => event.target.src = '/image/empty_avatar.png';
const handleImageError = (event) => event.target.src = '/image/error-placeholder.png';

const downloadDocument = async (url, fileName) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    toast.success('Документ успешно скачан');
  } catch (error) {
    console.error('Ошибка при скачивании:', error);
    toast.error('Ошибка при скачивании документа');
  }
};

const formatDate = (timestamp) => timestamp ? new Date(timestamp).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
const formatTime = (timestamp) => timestamp ? new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
const formatFileSize = (size) => {
  if (!size) return '';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  const index = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const getImageUrl = (image) => image || '';

onBeforeUnmount(() => {
  commentContent.value = '';
  imageFile.value = null;
  audioFile.value = null;
  videoFile.value = null;
});
</script>

<style scoped>
.prose :deep(p) { margin: 0.5em 0; }
.prose :deep(a) { color: #6366f1; text-decoration: none; transition: color 0.2s; }
.prose :deep(a:hover) { color: #4f46e5; }
</style>