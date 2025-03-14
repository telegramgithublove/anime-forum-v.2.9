<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">{{ t('loadingComments') }}</p>
    </div>
    <div v-else-if="sortedComments.length" class="space-y-6">
      <div v-for="comment in sortedComments" :key="comment.id" class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300">
        <div class="flex items-start space-x-4">
          <img :src="comment.author?.avatarUrl || '/image/empty_avatar.png'" 
               :alt="comment.author?.username || t('guest')" 
               class="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30" 
               @error="handleAvatarError">

          <div class="flex-1">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ comment.author?.username || t('guest') }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ comment.author?.signature || t('forumMember') }}</p>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(comment.createdAt) }}</span>
            </div>

            <p class="mt-2 text-gray-700 dark:text-gray-200">{{ comment.content || t('noContent') }}</p>

            <!-- Отображение изображения -->
            <div v-if="isValidUrl(comment.image)" class="mt-2">
              <img :src="comment.image" alt="Изображение комментария" class="max-w-full h-auto rounded-lg shadow-md" @error="handleImageError" @load="handleImageLoad" />
              <p class="text-xs text-gray-500 dark:text-gray-400">Изображение загружено</p>
            </div>
            <div v-else-if="comment.image" class="mt-2 text-xs text-red-500 dark:text-red-400">
              {{ t('invalidImageUrl') }}
            </div>

            <!-- Отображение видео -->
            <div v-if="isValidUrl(comment.video)" class="mt-2">
              <video :src="comment.video" controls class="max-w-full h-auto rounded-lg shadow-md" @error="handleVideoError" @loadeddata="handleVideoLoad"></video>
              <p class="text-xs text-gray-500 dark:text-gray-400">Видео загружено</p>
            </div>
            <div v-else-if="comment.video" class="mt-2 text-xs text-red-500 dark:text-red-400">
              {{ t('invalidVideoUrl') }}
            </div>

            <!-- Кнопка лайка и количество лайков -->
            <div class="mt-2 flex items-center space-x-2">
              <button @click="toggleLike(comment.id)" class="focus:outline-none">
                <i :class="[
                  'fas fa-heart text-lg',
                  isLikedByUser(comment.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                ]"></i>
              </button>
              <span class="text-sm text-gray-600 dark:text-gray-300">{{ comment.likesCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <i class="far fa-comments text-5xl text-gray-300 dark:text-gray-600 mb-4 animate-bounce"></i>
      <p class="text-gray-500 dark:text-gray-400">{{ t('noComments') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  postId: {
    type: [String, Number],
    required: true,
  },
});

const { t } = useI18n();
const store = useStore();

const isLoading = computed(() => store.getters['comments/isLoading']);
const comments = computed(() => store.getters['comments/getComments'] || []);

const sortedComments = computed(() => {
  console.log('Comments.vue - Сортировка комментариев:', comments.value);
  return [...comments.value].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
});

const currentUserId = computed(() => {
  const userId = localStorage.getItem('userId') || 'default';
  console.log('Comments.vue - Текущий пользователь:', userId);
  return userId;
});

const isLikedByUser = (commentId) => {
  const comment = comments.value.find(c => c.id === commentId);
  const liked = comment?.likes?.[currentUserId.value] || false;
  console.log('Comments.vue - Проверка лайка для комментария', commentId, ':', liked);
  return liked;
};

const toggleLike = async (commentId) => {
  console.log('Comments.vue - Переключение лайка для комментария:', commentId);
  try {
    const liked = isLikedByUser(commentId);
    await store.dispatch('comments/toggleCommentLike', { 
      postId: props.postId, 
      commentId, 
      userId: currentUserId.value, 
      liked: !liked 
    });
    console.log('Comments.vue - Лайк успешно обновлён');
  } catch (error) {
    console.error('Comments.vue - Ошибка при переключении лайка:', error);
  }
};

onMounted(() => {
  if (props.postId) {
    console.log('Comments.vue - Загрузка комментариев для поста:', props.postId);
    store.dispatch('comments/fetchComments', props.postId);
  } else {
    console.error('Comments.vue - postId не определён!');
  }
});

// Проверка валидности URL
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') {
    console.warn('Comments.vue - URL невалиден:', url);
    return false;
  }
  try {
    new URL(url);
    console.log('Comments.vue - URL валиден:', url);
    return true;
  } catch (e) {
    console.warn('Comments.vue - URL невалиден:', url);
    return false;
  }
};

// Обработчики ошибок и событий
const handleAvatarError = (event) => {
  console.error('Comments.vue - Ошибка загрузки аватара');
  event.target.src = '/image/empty_avatar.png';
};

const handleImageError = (event) => {
  console.error('Comments.vue - Ошибка загрузки изображения:', event.target.src);
  event.target.src = '/image/error-placeholder.png';
};

const handleImageLoad = (event) => {
  console.log('Comments.vue - Изображение успешно загружено:', event.target.src);
};

const handleVideoError = (event) => {
  console.error('Comments.vue - Ошибка загрузки видео:', event.target.src);
  event.target.poster = '/image/error-placeholder.png';
};

const handleVideoLoad = (event) => {
  console.log('Comments.vue - Видео успешно загружено:', event.target.src);
};

const formatDate = (timestamp) => {
  const formatted = timestamp ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp)) : '';
  console.log('Comments.vue - Форматирование даты:', timestamp, '->', formatted);
  return formatted;
};
</script>

<style scoped>
.animate-bounce {
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}
</style>