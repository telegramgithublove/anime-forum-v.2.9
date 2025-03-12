<template>
  <div class="reply-form bg-white rounded-lg shadow p-4">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700">
          Ваш ответ
        </label>
        <textarea
          id="content"
          v-model="content"
          rows="4"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
          placeholder="Напишите ваш ответ..."
          required
        ></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          <span v-if="isLoading">Отправка...</span>
          <span v-else>Отправить</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
  topicId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'reply-added']);

const store = useStore();
const content = ref('');
const isLoading = computed(() => store.getters['reply/isLoading']);

const handleSubmit = async () => {
  if (!content.value.trim()) return;

  try {
    const currentUser = store.state.auth.user;
    if (!currentUser) {
      alert('Пожалуйста, войдите в систему, чтобы оставить ответ');
      return;
    }

    const reply = await store.dispatch('reply/addReply', {
      topicId: props.topicId,
      content: content.value.trim(),
      userId: currentUser.uid,
      username: currentUser.displayName || 'Аноним',
      userAvatar: currentUser.photoURL || '/image/empty_avatar.png'
    });

    content.value = '';
    emit('reply-added', reply);
    emit('close');
  } catch (error) {
    console.error('Ошибка при отправке ответа:', error);
    alert('Произошла ошибка при отправке ответа. Пожалуйста, попробуйте снова.');
  }
};
</script>