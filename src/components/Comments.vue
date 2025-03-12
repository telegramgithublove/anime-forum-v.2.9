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

            <p class="mt-2 text-gray-700 dark:text-gray-200">{{ comment.content }}</p>

            <!-- Отображение изображения, если оно есть -->
            <div v-if="comment.image" class="mt-2">
              <img :src="comment.image" alt="Комментарий изображение" class="max-w-full h-auto rounded-lg shadow-md" />
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

// Пропс для получения postId
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

// Сортировка комментариев по количеству лайков (от большего к меньшему)
const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
});

// Получение текущего пользователя из localStorage
const currentUserId = computed(() => localStorage.getItem('userId') || 'default');

// Проверка, лайкнул ли текущий пользователь комментарий
const isLikedByUser = (commentId) => {
  const comment = comments.value.find(c => c.id === commentId);
  return comment?.likes?.[currentUserId.value] || false;
};

// Переключение лайка
const toggleLike = async (commentId) => {
  try {
    const liked = isLikedByUser(commentId);
    await store.dispatch('comments/toggleCommentLike', { 
      postId: props.postId, 
      commentId, 
      userId: currentUserId.value, 
      liked: !liked 
    });
  } catch (error) {
    console.error('Ошибка при переключении лайка:', error);
  }
};

onMounted(() => {
  if (props.postId) {
    store.dispatch('comments/fetchComments', props.postId);
  } else {
    console.error('postId не определен! Убедитесь, что пропс postId передан в компонент.');
  }
});

const handleAvatarError = (event) => event.target.src = '/image/empty_avatar.png';
const formatDate = (timestamp) => timestamp ? new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp)) : '';
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