<template>
  <div class="media-panel">
    <!-- Загрузка файлов -->
    <div class="upload-section mb-4">
      <input
        ref="fileInput"
        type="file"
        @change="handleFileSelect"
        multiple
        accept="image/*"
        class="hidden"
      >
      <div class="flex flex-col space-y-2">
        <button
          @click="triggerFileInput"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          :disabled="uploadedImages.length >= MAX_IMAGES"
        >
          <i class="fas fa-upload mr-2"></i>
          Загрузить изображения
        </button>
        <div class="text-sm text-gray-600">
          Загружено {{ uploadedImages.length }} из {{ MAX_IMAGES }} изображений
        </div>
      </div>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="isUploading" class="loading-indicator mb-4">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span class="ml-2 text-gray-600">Загрузка изображений...</span>
      </div>
    </div>

    <!-- Предпросмотр изображений -->
    <div v-if="uploadedImages.length > 0" class="preview-section grid grid-cols-3 gap-4">
      <div v-for="(image, index) in uploadedImages" :key="index" class="relative">
        <img
          :src="image"
          :alt="'Изображение ' + (index + 1)"
          class="w-full h-48 object-cover rounded-lg shadow-md"
        >
        <button
          @click="removeImage(index)"
          class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Сообщения об ошибках -->
    <div v-if="error" class="error-message mt-2 text-red-500">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import imageCompression from 'browser-image-compression'

const store = useStore()
const fileInput = ref(null)
const isUploading = ref(false)
const error = ref('')

// Получаем загруженные изображения из store
const uploadedImages = computed(() => store.state.picture.images)

// Максимальное количество изображений
const MAX_IMAGES = 10
// Максимальный размер файла (3 МБ)
const MAX_FILE_SIZE = 3 * 1024 * 1024

// Опции сжатия изображений
const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  preserveExif: true
}

// Открытие диалога выбора файлов
const triggerFileInput = () => {
  if (uploadedImages.value.length >= MAX_IMAGES) {
    error.value = 'Нельзя загрузить больше 10 изображений'
    return
  }
  fileInput.value.click()
}

// Обработка выбранных файлов
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files)
  error.value = ''
  
  // Проверка общего количества изображений
  if (uploadedImages.value.length + files.length > MAX_IMAGES) {
    error.value = `Можно загрузить ещё только ${MAX_IMAGES - uploadedImages.value.length} изображений`
    event.target.value = ''
    return
  }

  // Проверка размера файлов
  const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE)
  if (oversizedFiles.length > 0) {
    error.value = `Следующие файлы превышают 3 МБ: ${oversizedFiles.map(f => f.name).join(', ')}`
    event.target.value = ''
    return
  }

  isUploading.value = true
  
  try {
    for (const file of files) {
      // Сжимаем и загружаем изображение
      const compressedFile = await imageCompression(file, compressionOptions)
      await store.dispatch('picture/uploadImage', compressedFile)
    }
  } catch (err) {
    error.value = 'Ошибка при загрузке изображений: ' + err.message
  } finally {
    isUploading.value = false
    event.target.value = '' // Сброс input для возможности повторной загрузки тех же файлов
  }
}

// Удаление изображения
const removeImage = (index) => {
  store.dispatch('picture/removeImage', index)
}
</script>

<style scoped>
.media-panel {
  @apply p-4 bg-white rounded-lg shadow-sm;
}

.preview-section img {
  @apply transition-transform duration-200;
}

.preview-section img:hover {
  @apply transform scale-105;
}
</style>