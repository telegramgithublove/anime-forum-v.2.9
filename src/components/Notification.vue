<template>
  <div class="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5">
        <div class="p-4">
          <div class="flex items-start">
            <!-- Иконка успеха -->
            <div v-if="type === 'success'" class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-green-100 justify-center items-center">
                <span class="material-icons text-green-600">check_circle</span>
              </span>
            </div>
            <!-- Иконка ошибки -->
            <div v-else-if="type === 'error'" class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-red-100 justify-center items-center">
                <span class="material-icons text-red-600">error</span>
              </span>
            </div>
            <!-- Иконка предупреждения -->
            <div v-else-if="type === 'warning'" class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-yellow-100 justify-center items-center">
                <span class="material-icons text-yellow-600">warning</span>
              </span>
            </div>
            <!-- Иконка информации -->
            <div v-else class="flex-shrink-0">
              <span class="flex h-10 w-10 rounded-full bg-blue-100 justify-center items-center">
                <span class="material-icons text-blue-600">info</span>
              </span>
            </div>

            <div class="ml-3 w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ title }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ message }}</p>
              
              <!-- Кнопки действий -->
              <div class="mt-3 flex space-x-4">
                <router-link 
                  to="/" 
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span class="material-icons mr-1 text-sm">forum</span>
                  Форум
                </router-link>
                <button
                  v-if="actionButton"
                  @click="onActionClick"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {{ actionButton }}
                </button>
              </div>
            </div>

            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="closeNotification"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="sr-only">Закрыть</span>
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Прогресс-бар для автозакрытия -->
        <div
          v-if="duration > 0"
          class="h-1 bg-indigo-100 rounded-b-lg"
        >
          <div
            class="h-1 bg-indigo-600 rounded-b-lg transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 5000
  },
  actionButton: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'action']);

const router = useRouter();
let timer = null;
let progressTimer = null;
const progress = ref(100);

const closeNotification = () => {
  clearTimeout(timer);
  clearInterval(progressTimer);
  emit('close');
};

const onActionClick = () => {
  emit('action');
  closeNotification();
};

onMounted(() => {
  if (props.duration > 0) {
    // Таймер для закрытия уведомления
    timer = setTimeout(closeNotification, props.duration);

    // Таймер для прогресс-бара
    const updateInterval = 10; // Обновление каждые 10мс
    const steps = props.duration / updateInterval;
    const step = 100 / steps;

    progressTimer = setInterval(() => {
      progress.value = Math.max(0, progress.value - step);
    }, updateInterval);
  }
});

onUnmounted(() => {
  clearTimeout(timer);
  clearInterval(progressTimer);
});
</script>
