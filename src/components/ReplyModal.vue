<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Overlay -->
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="$emit('close')" aria-hidden="true"></div>

        <!-- Modal -->
        <div class="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="w-full mt-3 text-center sm:mt-0 sm:text-left">
                <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                  Ответить
                </h3>
                <div class="mt-4">
                  <div class="flex items-start space-x-4">
                    <img
                      :src="currentUser?.photoURL || '/default-avatar.png'"
                      alt="User Avatar"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                    <div class="flex-grow">
                      <textarea
                        v-model="replyContent"
                        class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows="3"
                        placeholder="Напишите ваш ответ..."
                        @keydown.enter.prevent="submitReply"
                      ></textarea>
                      <div class="flex justify-between items-center mt-2">
                        <span class="text-sm text-gray-500">{{ replyContent.length }}/500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="submitReply"
              :disabled="!isValid || isLoading"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading">Отправка...</span>
              <span v-else>Ответить</span>
            </button>
            <button
              @click="$emit('close')"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  commentId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'reply-submitted']);

const store = useStore();
const replyContent = ref('');
const isLoading = computed(() => store.getters['reply/isLoading']);
const currentUser = computed(() => store.state.auth.user);

const isValid = computed(() => {
  return replyContent.value.trim().length > 0 && replyContent.value.length <= 500;
});

async function submitReply() {
  if (!isValid.value) return;

  try {
    const reply = await store.dispatch('reply/createReply', {
      commentId: props.commentId,
      content: replyContent.value.trim()
    });
    
    replyContent.value = '';
    emit('reply-submitted', reply);
    emit('close');
  } catch (error) {
    console.error('Ошибка при отправке ответа:', error);
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
