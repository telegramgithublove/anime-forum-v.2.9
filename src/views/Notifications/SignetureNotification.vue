<template>
  <div
    v-if="show"
    :class="[
      'fixed top-20 right-20 max-w-sm p-6 rounded-lg shadow-lg transition-all duration-300 transform',
      type === 'success' ? 'bg-green-500' : 'bg-red-500',
      'text-white',
      show ? 'opacity-100' : 'opacity-0'
    ]"
    style="margin: 20px;"
  >
    <div class="flex justify-between items-start">
      <p class="text-lg font-semibold">{{ message }}</p>
      <button @click="closeNotification" class="text-white hover:text-gray-200">
        &times;
      </button>
    </div>
    <p class="mt-2 text-sm">
      {{ message }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error'].includes(value)
  }
});

const show = ref(true);

function closeNotification() {
  show.value = false;
}

// Автоматическое скрытие через 3 секунды
onMounted(() => {
  setTimeout(() => {
    show.value = false;
  }, 3000);
});
</script>

<style scoped>
/* Дополнительные стили, если нужно */
</style>
