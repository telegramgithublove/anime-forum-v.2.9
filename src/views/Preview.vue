<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
      <!-- Кнопка закрытия -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <i class="fas fa-times"></i>
      </button>

      <!-- Заголовок -->
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ title }}</h2>

      <!-- Контент -->
      <div class="prose dark:prose-invert max-w-none mb-6" v-html="sanitizedContent"></div>

      <!-- Теги -->
      <div class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="tag in store.state.tegs.tags"
          :key="tag"
          class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full text-sm"
        >
          #{{ tag }}
        </span>
      </div>

      <!-- Изображения -->
      <div v-if="images && images.length" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div v-for="(image, index) in images" :key="index" class="relative group">
          <img
            :src="image.replace('http://localhost:3000', 'http://95.164.90.115:3000')"
            :alt="'Image ' + index"
            class="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
            @click="openFullImage(image)"
          >
          <button
            @click.stop="$emit('removeImage', index)"
            class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <!-- Видео -->
      <div v-if="videos && videos.length" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div v-for="(video, index) in videos" :key="index" class="relative group">
          <div class="aspect-w-16 aspect-h-9 cursor-pointer" @click="openFullVideo(video)">
            <video
              ref="videoPlayer"
              :src="video.replace('http://localhost:3000', 'http://95.164.90.115:3000')"
              class="w-full rounded-lg shadow-md object-cover"
              controls
              preload="auto"
              @loadedmetadata="onVideoLoad($event, index)"
              @error="onVideoError($event, index)"
            >
              Ваш браузер не поддерживает видео.
            </video>
          </div>
          <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {{ videoDurations[index] || '0:00' }}
          </div>
          <button
            @click.stop="$emit('removeVideo', index)"
            class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>

      <!-- Аудио -->
      <div v-if="audio && audio.length" class="mt-4 mb-6">
        <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Аудио:</h3>
        <div class="grid grid-cols-1 gap-4">
          <div v-for="(audioFile, index) in audio" 
               :key="index" 
               class="relative group p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <audio 
              controls 
              preload="metadata"
              class="w-full"
              crossorigin="anonymous"
            >
              <source 
                :src="audioFile.url" 
                :type="audioFile.type"
                crossorigin="anonymous"
              >
              Ваш браузер не поддерживает аудио элемент.
            </audio>
            
            <!-- Название файла -->
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {{ getAudioFileName(audioFile.url) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Документы -->
      <div v-if="documents && documents.length" class="mt-4 mb-6">
        <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Документы:</h3>
        <div class="grid grid-cols-1 gap-4">
          <div v-for="(doc, index) in documents" 
               :key="index" 
               class="relative group p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <!-- Иконка документа -->
                <i class="fas fa-file-alt text-2xl text-blue-500"></i>
                
                <div class="flex-1">
                  <!-- Название файла -->
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ doc.name }}
                  </div>
                  <!-- Размер файла -->
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ doc.size }}
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <!-- Кнопка скачивания -->
                <a :href="doc.url" 
                   target="_blank" 
                   class="p-2 text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                   download>
                  <i class="fas fa-download"></i>
                </a>
                <!-- Кнопка удаления -->
                <button
                  @click="$emit('removeDocument', index)"
                  class="p-2 text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно для полноразмерного изображения -->
    <div v-if="fullScreenImage" 
         class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60]"
         @click="fullScreenImage = null">
      <button 
        @click="fullScreenImage = null"
        class="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <i class="fas fa-times text-2xl"></i>
      </button>
      <button 
        v-if="images.length > 1"
        @click.stop="showPrevImage"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
      >
        <i class="fas fa-chevron-left text-2xl"></i>
      </button>
      <img 
        :src="fullScreenImage.replace('http://localhost:3000', 'http://95.164.90.115:3000')"
        class="max-h-[90vh] max-w-[90vw] object-contain"
        alt="Full screen image"
      >
      <button 
        v-if="images.length > 1"
        @click.stop="showNextImage"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
      >
        <i class="fas fa-chevron-right text-2xl"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import DOMPurify from 'dompurify';
import { useStore } from 'vuex';

const store = useStore();

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
  tags: {
    type: Array,
    default: () => []
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

const fullScreenImage = ref(null);
const fullScreenVideo = ref(null);
const videoDurations = ref([]);

function openFullImage(image) {
  fullScreenImage.value = image;
}

function showNextImage() {
  const currentIndex = props.images.indexOf(fullScreenImage.value);
  const nextIndex = (currentIndex + 1) % props.images.length;
  fullScreenImage.value = props.images[nextIndex];
}

function showPrevImage() {
  const currentIndex = props.images.indexOf(fullScreenImage.value);
  const prevIndex = (currentIndex - 1 + props.images.length) % props.images.length;
  fullScreenImage.value = props.images[prevIndex];
}

function openFullVideo(video) {
  fullScreenVideo.value = video;
}

function onVideoLoad(event, index) {
  const duration = event.target.duration;
  videoDurations.value[index] = formatDuration(duration);
}

function onVideoError(event, index) {
  console.error('Ошибка загрузки видео:', event);
}

function formatDuration(duration) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getAudioFileName(url) {
  if (!url) return '';
  try {
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    return parts[parts.length - 1];
  } catch (error) {
    console.error('Ошибка при получении имени аудио файла:', error);
    return 'Неизвестный файл';
  }
}

const sanitizedContent = computed(() => {
  const formattedText = formatText(props.content);
  return DOMPurify.sanitize(formattedText, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
});

function formatText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/> (.*?)(\n|$)/g, '<blockquote>$1</blockquote>')
    .replace(/\n/g, '<br>');
}

defineEmits(['close', 'removeImage', 'removeVideo', 'removeAudio', 'removeDocument']);
</script>

<style scoped>
.aspect-w-16 {
  position: relative;
  padding-bottom: 56.25%;
}

.aspect-h-9 {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* Стили для видео плеера */
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Стили для аудио плеера */
audio {
  width: 100%;
  margin-top: 0.5rem;
}

/* Анимации для модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>