<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen p-4">
      <!-- Затемнение фона -->
      <div class="fixed inset-0 bg-black opacity-50"></div>

      <!-- Контент предпросмотра -->
      <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6">
        <!-- Заголовок и кнопка закрытия -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ title }}</h2>
          <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Контент -->
        <div class="prose dark:prose-invert max-w-none mb-6" v-html="content"></div>

        <!-- Изображения -->
        <div v-if="images && images.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Изображения</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="(image, index) in images" :key="index" class="relative group">
              <img :src="image" class="w-full h-48 object-cover rounded-lg" :alt="'Image ' + (index + 1)">
            </div>
          </div>
        </div>

        <!-- Видео -->
        <div v-if="videos && videos.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Видео</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(video, index) in videos" :key="index" class="relative">
              <vue-plyr>
                <video 
                  :src="video"
                  crossorigin="anonymous"
                  playsinline
                  controls>
                </video>
              </vue-plyr>
            </div>
          </div>
        </div>

        <!-- Аудио -->
        <div v-if="audio && audio.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Аудио</h3>
          <div class="space-y-4">
            <div v-for="(audioFile, index) in audio" :key="index" 
                 class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="flex items-center space-x-4">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {{ audioFile.name }}
                  </p>
                  <audio 
                    controls 
                    class="w-full"
                    preload="metadata"
                    crossorigin="anonymous"
                  >
                    <source :src="audioFile.url" :type="audioFile.type">
                    Ваш браузер не поддерживает аудио элемент.
                  </audio>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Документы -->
        <div v-if="documents && documents.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Документы</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="(doc, index) in documents" :key="index" 
                 class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <i class="fas fa-file-alt text-gray-500 mr-2"></i>
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ doc.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  images: {
    type: Array,
    default: () => []
  },
  videos: {
    type: Array,
    default: () => []
  },
  audio: {
    type: Array,
    default: () => []
  },
  documents: {
    type: Array,
    default: () => []
  }
});

// Добавляем логирование для отслеживания пропсов
watch(() => props.show, (newValue) => {
  console.log('Preview показан:', newValue);
  console.log('Аудио файлы в Preview:', props.audio);
}, { immediate: true });

watch(() => props.audio, (newAudio) => {
  console.log('Аудио файлы обновлены в Preview:', newAudio);
}, { deep: true });

defineEmits(['close']);
</script>

<style scoped>
.prose {
  max-width: none;
}

/* Стили для аудио плеера */
audio {
  width: 100%;
  height: 40px;
  border-radius: 0.5rem;
}

audio::-webkit-media-controls-panel {
  background-color: #f3f4f6;
}

.dark audio::-webkit-media-controls-panel {
  background-color: #374151;
}
</style>
