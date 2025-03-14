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
                <img :src="authorData.avatar"
                     :alt="authorData.name"
                     class="w-16 h-16 rounded-full ml-6 object-cover ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300"
                     @error="handleAvatarError($event, 'author')"
                     @load="handleAvatarLoad($event, 'author')">
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
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">({{ comments.length }})</span>
          </div>
          <Comments :post-id="postId" />
        </div>

        <!-- Форма комментария -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transform hover:shadow-2xl transition-all duration-300">
          <div class="flex items-center space-x-3 mb-4">
            <i class="fas fa-pen-alt text-2xl text-purple-500"></i>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Оставить комментарий</h2>
          </div>
          <div class="flex items-start space-x-4">
            <img :src="userAvatar" :alt="currentUser.username || 'Гость'" @error="handleAvatarError($event, 'currentUser')" @load="handleAvatarLoad($event, 'currentUser')" class="w-12 h-12 rounded-full object-cover border-2 border-purple-500">
            <div class="flex-1 space-y-3">
              <div class="text-base font-semibold text-gray-900 dark:text-white">{{ currentUser.username || 'Гость' }}</div>
              <textarea
                v-model="commentContent"
                placeholder="Напишите ваш комментарий..."
                class="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] max-h-[200px] resize-none overflow-y-auto transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              ></textarea>
              <!-- Предпросмотр файлов -->
              <div v-if="imagePreview || videoPreview" class="mt-4 space-y-4">
                <div v-if="imagePreview" class="relative">
                  <img :src="imagePreview" alt="Предпросмотр изображения" class="max-w-full h-auto rounded-lg shadow-md" />
                  <button @click="clearImage" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-if="videoPreview" class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p class="text-gray-700 dark:text-gray-200">{{ videoFileName }}</p>
                  <video :src="videoPreview" controls class="w-full mt-2 rounded-lg"></video>
                  <button @click="clearVideo" class="mt-2 text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i> Удалить
                  </button>
                </div>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import Comments from '../components/Comments.vue';

const store = useStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const commentContent = ref('');
const imagePreview = ref(null);
const imageFile = ref(null);
const videoFile = ref(null);
const videoPreview = ref(null);
const post = ref(null);
const comments = computed(() => store.getters['comments/getComments'] || []);
const isLoading = ref(true);
const postId = computed(() => route.params.id);

const MAX_CHARS = 333;
const remainingChars = computed(() => MAX_CHARS - (commentContent.value?.length || 0));
const hasAttachments = computed(() => !!imageFile.value || !!videoFile.value);

const videoFileName = computed(() => videoFile.value ? videoFile.value.name : 'Видео не выбрано');

const userAvatar = computed(() => {
  const avatar = store.getters['profile/userAvatar'];
  console.log('PostDetails.vue - [Avatar] Получение аватара пользователя из getter:', avatar);
  if (!avatar || avatar === '') {
    console.log('PostDetails.vue - [Avatar] Аватар отсутствует или пустой, используется запасной: /image/empty_avatar.png');
    return '/image/empty_avatar.png';
  }
  console.log('PostDetails.vue - [Avatar] Аватар валиден:', avatar);
  return avatar;
});

onMounted(async () => {
  console.log('PostDetails.vue - [Lifecycle] Монтирование компонента, postId:', postId.value);
  try {
    isLoading.value = true;
    console.log('PostDetails.vue - [Fetch] Начало загрузки поста:', postId.value);
    const postData = await store.dispatch('posts/fetchPostById', postId.value);
    console.log('PostDetails.vue - [Fetch] Пост получен:', postData);
    post.value = postData || null;
    console.log('PostDetails.vue - [Fetch] Начало загрузки комментариев для поста:', postId.value);
    await store.dispatch('comments/fetchComments', postId.value);
    console.log('PostDetails.vue - [Fetch] Пост и комментарии успешно загружены');
    isLoading.value = false;
  } catch (error) {
    console.error('PostDetails.vue - [Error] Ошибка загрузки поста или комментариев:', error);
    toast.error('Ошибка при загрузке данных');
    isLoading.value = false;
  }
});

const authorData = computed(() => {
  console.log('PostDetails.vue - [Computed] Вычисление данных автора');
  if (post.value?.author) {
    const authorAvatar = post.value.author.avatarUrl || userAvatar.value;
    console.log('PostDetails.vue - [Computed] Данные автора поста:', {
      name: post.value.author.username || currentUser.value.username || 'Гость',
      avatar: authorAvatar,
      signature: post.value.author.signature || currentUser.value.signature || 'Участник форума'
    });
    return {
      name: post.value.author.username || currentUser.value.username || 'Гость',
      avatar: authorAvatar,
      signature: post.value.author.signature || currentUser.value.signature || 'Участник форума'
    };
  }
  console.log('PostDetails.vue - [Computed] Автор поста отсутствует, используются данные текущего пользователя:', {
    name: currentUser.value.username || 'Гость',
    avatar: userAvatar.value,
    signature: currentUser.value.signature || 'Участник форума'
  });
  return {
    name: currentUser.value.username || 'Гость',
    avatar: userAvatar.value,
    signature: currentUser.value.signature || 'Участник форума'
  };
});

const currentUser = computed(() => {
  const profile = store.state.profile?.profile || {};
  console.log('PostDetails.vue - [Computed] Текущий пользователь:', profile);
  return {
    username: profile.username || '',
    avatarUrl: profile.avatarUrl || userAvatar.value,
    signature: profile.signature || 'Участник форума'
  };
});

const likesCount = computed(() => {
  const count = post.value?.likes ? Object.keys(post.value.likes).length : 0;
  console.log('PostDetails.vue - [Computed] Количество лайков:', count);
  return count;
});

const isLikedByCurrentUser = computed(() => {
  const user = store.state.auth.user;
  const liked = user && post.value?.likes?.[user.uid];
  console.log('PostDetails.vue - [Computed] Пост лайкнут текущим пользователем:', liked);
  return liked;
});

const isFavorite = computed(() => {
  const user = store.state.auth.user;
  const favorite = user && post.value?.favorites?.[user.uid];
  console.log('PostDetails.vue - [Computed] Пост в избранном у текущего пользователя:', favorite);
  return favorite;
});

const goBack = () => {
  console.log('PostDetails.vue - [Action] Возврат на главную');
  router.replace('/');
};

const handleLike = async () => {
  console.log('PostDetails.vue - [Action] Обработка лайка поста');
  const user = store.state.auth.user;
  if (!user) {
    console.warn('PostDetails.vue - [Action] Пользователь не авторизован для лайка');
    toast.warning('Пожалуйста, войдите в систему, чтобы поставить лайк');
    return;
  }
  try {
    console.log('PostDetails.vue - [Action] Отправка действия toggleLike для поста:', post.value.id);
    const updatedPost = await store.dispatch('posts/toggleLike', post.value.id);
    post.value = updatedPost;
    console.log('PostDetails.vue - [Action] Лайк успешно обновлён:', updatedPost);
  } catch (error) {
    console.error('PostDetails.vue - [Error] Ошибка при обновлении лайка:', error);
    toast.error('Не удалось поставить лайк');
  }
};

const toggleFavorite = async () => {
  console.log('PostDetails.vue - [Action] Переключение избранного');
  const user = store.state.auth.user;
  if (!user) {
    console.warn('PostDetails.vue - [Action] Пользователь не авторизован для избранного');
    toast.warning('Пожалуйста, войдите в систему, чтобы добавить в избранное');
    return;
  }
  try {
    console.log('PostDetails.vue - [Action] Отправка действия toggleFavorite для поста:', post.value.id);
    const updatedPost = await store.dispatch('posts/toggleFavorite', post.value.id);
    post.value = updatedPost;
    console.log('PostDetails.vue - [Action] Избранное успешно обновлено:', updatedPost);
    toast.success(isFavorite.value ? 'Добавлено в избранное' : 'Удалено из избранного');
  } catch (error) {
    console.error('PostDetails.vue - [Error] Ошибка при обновлении избранного:', error);
    toast.error('Не удалось обновить избранное');
  }
};

const focusComment = () => {
  console.log('PostDetails.vue - [Action] Фокус на поле комментария');
  document.querySelector('textarea')?.focus();
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    imageFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
    console.log('PostDetails.vue - [Action] Выбрано изображение:', file.name);
  } else {
    console.error('PostDetails.vue - [Error] Изображение не выбрано');
  }
  event.target.value = '';
};

const handleVideoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    videoFile.value = file;
    videoPreview.value = URL.createObjectURL(file);
    console.log('PostDetails.vue - [Action] Выбрано видео:', file.name);
  } else {
    console.error('PostDetails.vue - [Error] Видео не выбрано');
  }
  event.target.value = '';
};

const clearImage = () => {
  console.log('PostDetails.vue - [Action] Очистка изображения');
  imageFile.value = null;
  imagePreview.value = null;
};

const clearVideo = () => {
  console.log('PostDetails.vue - [Action] Очистка видео');
  videoFile.value = null;
  videoPreview.value = null;
};

const submitComment = async () => {
  console.log('PostDetails.vue - [Action] Отправка комментария');
  if (!commentContent.value.trim() && !hasAttachments.value) {
    console.warn('PostDetails.vue - [Warning] Нет текста или вложений для комментария');
    toast.warning('Пожалуйста, введите текст комментария или прикрепите файл');
    return;
  }
  const user = store.state.auth.user;
  if (!user) {
    console.error('PostDetails.vue - [Error] Пользователь не авторизован для отправки комментария');
    toast.error('Пожалуйста, войдите в систему');
    return;
  }
  try {
    console.log('PostDetails.vue - [Action] Подготовка данных комментария');
    let imageUrl = null;
    let videoUrl = null;

    if (imageFile.value) {
      console.log('PostDetails.vue - [Action] Загрузка изображения:', imageFile.value.name);
      imageUrl = await store.dispatch('picture/uploadImage', { 
        file: imageFile.value, 
        type: 'comment' 
      });
      console.log('PostDetails.vue - [Action] Изображение загружено, URL:', imageUrl);
    }

    if (videoFile.value) {
      console.log('PostDetails.vue - [Action] Загрузка видео:', videoFile.value.name);
      const videoResult = await store.dispatch('video/uploadVideo', videoFile.value);
      videoUrl = videoResult.videoUrl;
      console.log('PostDetails.vue - [Action] Видео загружено, URL:', videoUrl);
    }

    const commentData = {
      postId: postId.value,
      content: commentContent.value.trim() || '',
      image: imageUrl || null,
      video: videoUrl || null,
    };
    console.log('PostDetails.vue - [Action] Данные комментария подготовлены:', commentData);

    await store.dispatch('comments/addComment', commentData);
    console.log('PostDetails.vue - [Action] Комментарий успешно отправлен');

    commentContent.value = '';
    imageFile.value = null;
    imagePreview.value = null;
    videoFile.value = null;
    videoPreview.value = null;
    toast.success('Комментарий успешно добавлен!');
  } catch (error) {
    console.error('PostDetails.vue - [Error] Ошибка отправки комментария:', error);
    toast.error('Не удалось отправить комментарий: ' + (error.message || 'Неизвестная ошибка'));
  }
};

const handleAvatarError = (event, context) => {
  const failedUrl = event.target.src;
  console.error(`PostDetails.vue - [Error] Ошибка загрузки аватара (${context}):`, {
    url: failedUrl,
    timestamp: new Date().toISOString(),
    reason: 'Изображение не найдено или недоступно'
  });
  event.target.src = '/image/empty_avatar.png';
  console.log(`PostDetails.vue - [Action] Аватар заменён на запасной: /image/empty_avatar.png для ${context}`);
};

const handleAvatarLoad = (event, context) => {
  console.log(`PostDetails.vue - [Success] Аватар успешно загружен (${context}):`, event.target.src);
};

const handleImageError = (event) => {
  console.error('PostDetails.vue - [Error] Ошибка загрузки изображения:', {
    url: event.target.src,
    timestamp: new Date().toISOString()
  });
  event.target.src = '/image/error-placeholder.png';
};

const formatDate = (timestamp) => {
  const formatted = timestamp ? new Date(timestamp).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  console.log('PostDetails.vue - [Util] Форматирование даты:', timestamp, '->', formatted);
  return formatted;
};

const formatTime = (timestamp) => {
  const formatted = timestamp ? new Date(timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
  console.log('PostDetails.vue - [Util] Форматирование времени:', timestamp, '->', formatted);
  return formatted;
};

const getImageUrl = (image) => {
  console.log('PostDetails.vue - [Util] Получение URL изображения:', image);
  return image || '';
};
</script>

<style scoped>
.prose :deep(p) { margin: 0.5em 0; }
.prose :deep(a) { color: #6366f1; text-decoration: none; transition: color 0.2s; }
.prose :deep(a:hover) { color: #4f46e5; }
</style>