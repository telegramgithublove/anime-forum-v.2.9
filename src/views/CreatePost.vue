<template>
  <div class="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
    <div class="create-post-container bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <!-- Заголовок формы -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <router-link 
            :to="{ name: 'CategoryPosts' }" 
            class="text-gray-600 hover:text-purple-600 transition-colors duration-200"
          >
            <i class="fas fa-arrow-left text-xl"></i>
          </router-link>
          <h2 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Создать новую тему
            <span class="ml-2 text-xl">✨</span>
          </h2>
        </div>
        <div class="text-gray-500 dark:text-gray-400 text-sm">
          {{ remainingTitleCharacters }} символов осталось
        </div>
      </div>

      <!-- Поле заголовка -->
      <div class="mb-4">
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Заголовок <span class="text-red-500">*</span>
        </label>
        <input
          id="title"
          v-model="postTitle"
          type="text"
          class="w-full px-4 py-2 border-2 rounded-lg transition duration-200"
          :class="{
            'border-red-300 focus:border-red-500': !postTitle.trim() && showValidation,
            'border-gray-200 focus:border-purple-500': postTitle.trim() || !showValidation
          }"
          placeholder="Введите заголовок темы..."
          @input="handleTitleInput"
        >
        <p v-if="!postTitle.trim() && showValidation" class="mt-1 text-sm text-red-500">
          Заголовок обязателен для заполнения
        </p>
      </div>

      <!-- Поле для контента -->
      <div class="relative mb-4">
        <!-- Предпросмотр загруженных файлов -->
        <div v-if="store.state.picture.uploadedImages.length > 0 || 
                  store.state.video.uploadedVideos.length > 0 || 
                  store.state.format.uploadedFiles.length > 0" 
             class="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">Предпросмотр загруженных файлов:</h3>

          <!-- Изображения -->
          <div v-if="store.state.picture.uploadedImages.length > 0" 
               class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <div v-for="(image, index) in store.state.picture.uploadedImages" 
                 :key="index" 
                 class="relative group">
              <img :src="store.getters['picture/getImageUrl'](image)" 
                   class="w-full h-48 object-cover rounded-lg shadow-md transform transition-transform duration-300 hover:scale-110"
                   :alt="'Загруженное изображение ' + (index + 1)"
                   @load="handleImageLoad"
                   @error="handleImageError">
              <button 
                @click="handleImageRemove(index)"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Видео -->
          <div v-if="store.state.video.uploadedVideos.length > 0 || isVideoUploading" 
               class="mt-4">
            <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Видео:</h4>
            <div v-if="isVideoUploading" class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <i class="fas fa-cloud-upload-alt text-purple-600 animate-pulse"></i>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Загрузка на сервер: {{ videoUploadProgress }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                     :style="{ width: `${videoUploadProgress}%` }">
                </div>
              </div>
            </div>
            <div v-if="store.state.video.uploadedVideos.length > 0"
                 class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(video, index) in store.state.video.uploadedVideos" 
                   :key="index" 
                   class="relative group">
                <vue-plyr ref="plyr" class="video-player">
                  <video 
                    :src="video"
                    :crossorigin="true"
                    playsinline
                    controls>
                  </video>
                </vue-plyr>
                <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <span class="text-white text-sm">
                    {{ getVideoFileName(video) }}
                  </span>
                </div>
                <button 
                  @click="removeVideo(index)"
                  class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Документы -->
          <div v-if="store.state.format.uploadedFiles.length > 0" class="mt-4">
            <h4 class="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Документы:</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="(file, index) in store.state.format.uploadedFiles" 
                   :key="index"
                   class="relative group bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-file-alt text-gray-500 mr-2"></i>
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ file.name }}</span>
                </div>
                <button 
                  @click="removeFormat(index)"
                  class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Аудио -->
        <div v-if="store.state.music.uploadedAudio.length > 0 || isAudioUploading" class="mb-4">
          <h4 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Аудио:</h4>
          <div v-if="isAudioUploading" class="mb-4">
            <div class="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              <span class="text-gray-700 dark:text-gray-300">Загрузка аудио...</span>
            </div>
          </div>
          <div v-if="store.state.music.uploadedAudio.length > 0" class="grid grid-cols-1 gap-4">
            <div v-for="(audio, index) in store.state.music.uploadedAudio" 
                 :key="index" 
                 class="relative flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex-1">
                <div class="relative">
                  <div v-if="audioLoadingStates[index]" 
                       class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-600 bg-opacity-75 rounded">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                  <audio 
                    controls 
                    preload="auto"
                    class="w-full mt-2"
                    crossorigin="anonymous"
                    @loadstart="onAudioLoadStart(index)"
                    @canplay="onAudioCanPlay(index)"
                    @error="onAudioError(index, $event)"
                  >
                    <source 
                      :src="audio.url" 
                      :type="audio.type"
                      crossorigin="anonymous"
                    >
                    Ваш браузер не поддерживает аудио элемент.
                  </audio>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ getAudioFileName(audio.url) }}
                </div>
              </div>
              <button @click="removeAudio(index)" 
                      class="ml-2 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Панель форматирования -->
        <div class="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <button
            @click="applyFormat('bold')"
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip"
            data-tooltip="Жирный"
          >
            <i class="fas fa-bold text-gray-600 dark:text-gray-300"></i>
          </button>
          <button
            @click="applyFormat('italic')"
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip"
            data-tooltip="Курсив"
          >
            <i class="fas fa-italic text-gray-600 dark:text-gray-300"></i>
          </button>
          <button
            @click="applyFormat('underline')"
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip"
            data-tooltip="Подчеркнутый"
          >
            <i class="fas fa-underline text-gray-600 dark:text-gray-300"></i>
          </button>
          <button
            @click="applyFormat('strikethrough')"
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip"
            data-tooltip="Зачеркнутый"
          >
            <i class="fas fa-strikethrough text-gray-600 dark:text-gray-300"></i>
          </button>
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>
          <button 
            @click="triggerImageUpload" 
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip" 
            data-tooltip="Прикрепить изображение"
          >
            <i class="fas fa-image text-gray-600 dark:text-gray-300"></i>
          </button>
          <button 
            @click="triggerVideoUpload" 
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip" 
            data-tooltip="Прикрепить видео"
          >
            <i class="fas fa-video text-gray-600 dark:text-gray-300"></i>
          </button>
          <button 
            @click="triggerAudioUpload" 
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip" 
            data-tooltip="Прикрепить музыку"
          >
            <i class="fas fa-music text-gray-600 dark:text-gray-300"></i>
          </button>
          <button 
            @click="triggerFormatUpload" 
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Прикрепить документ"
          >
            <i class="fas fa-file-upload"></i>
          </button>
          <button 
            @click="openEmojiPicker" 
            class="p-2 hover:bg-purple-100 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 tooltip" 
            data-tooltip="Добавить эмодзи"
          >
            <i class="far fa-smile text-gray-600 dark:text-gray-300"></i>
          </button>
        </div>

        <Emoji 
          :is-visible="showEmojiPicker"
          :position="emojiPickerPosition"
          @close="showEmojiPicker = false"
          @select="handleEmojiSelect"
        />

        <div
          ref="editor"
          id="content"
          contenteditable="true"
          class="w-full min-h-[300px] p-4 border-2 rounded-lg transition duration-200"
          :class="{
            'border-red-300 focus:border-red-500 dark:border-red-700': showValidation && !postContent.trim(),
            'border-gray-200 focus:border-purple-500 dark:border-gray-700 dark:focus:border-purple-500': !showValidation || postContent.trim()
          }"
          @input="handleInput"
          @paste="handlePaste"
        ></div>
        <p v-if="showValidation && !postContent.trim()" class="mt-1 text-sm text-red-500">
          Содержание обязательно для заполнения
        </p>
        <div class="text-sm mt-2" :class="{'text-red-500': remainingCharacters === 0, 'text-gray-500': remainingCharacters > 0}">
          {{ remainingCharacters === 0 ? 'Достигнут лимит символов' : `${remainingCharacters} символов осталось` }}
        </div>
      </div>

      <!-- Dropzone для изображений -->
      <div class="flex items-center mb-4 justify-center w-full">
        <label 
          :for="images.length >= 10 ? '' : 'dropzone-file'" 
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer"
          :class="images.length >= 10 ? 'border-gray-400 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'border-gray-300 bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'"
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span v-if="images.length >= 10" class="font-semibold text-red-500">
                Достигнут лимит в 10 изображений
              </span>
              <span v-else class="font-semibold">
                Нажмите для загрузки или перетащите
              </span>
            </p>
            <p v-if="images.length < 10" class="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG или GIF (осталось: {{ 10 - images.length }})
            </p>
          </div>
          <input 
            v-if="images.length < 10"
            id="dropzone-file" 
            type="file" 
            class="hidden" 
            accept="image/*"
            @change="handleFileUpload"
            multiple
          />
        </label>
      </div>

      <!-- Нижняя панель с элементами управления -->
      <div class="flex flex-col gap-4 mb-4">
        <!-- Теги -->
        <div class="flex-grow flex items-center gap-4">
          <div class="flex-grow">
            <input
              v-model="tagInput"
              @keydown.enter.prevent="addTag"
              class="w-96 px-3 py-1 border border-gray-300 rounded focus:border-gray-400 focus:outline-none dark:bg-gray-700 dark:text-white transition"
              :placeholder="store.getters['tegs/canAddMoreTags'] ? 'Теги через Enter' : 'Достигнут лимит тегов'"
              :disabled="!store.getters['tegs/canAddMoreTags']"
            />
            <div class="flex flex-wrap gap-2 mt-2">
              <span 
                v-for="(tag, index) in store.state.tegs.tags" 
                :key="index"
                class="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 rounded-full flex items-center gap-2"
              >
                {{ tag }}
                <button 
                  @click="store.dispatch('tegs/removeTag', tag)"
                  class="hover:text-purple-800 dark:hover:text-purple-100"
                >
                  <i class="fas fa-times"></i>
                </button>
              </span>
            </div>
          </div>
          <button
            @click="togglePreview"
            class="px-4 py-2 bg-pink-100 dark:bg-pink-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-600 transition duration-200"
          >
            <i class="fas" :class="previewMode ? 'fa-edit' : 'fa-eye'"></i>
            {{ previewMode ? 'Редактировать' : 'Предпросмотр' }}
          </button>
          <button
            @click="validateAndSubmit"
            class="px-6 py-2 text-white font-medium rounded-lg transition-all duration-200"
            :class="{
              'bg-purple-600 hover:bg-purple-700': isFormValid,
              'bg-gray-400 cursor-not-allowed': !isFormValid
            }"
            :disabled="!isFormValid"
          >
            <i class="fas fa-paper-plane mr-2"></i>
            Создать тему
          </button>
        </div>
      </div>

      <!-- Предпросмотр созданного поста -->
      <Preview
        v-if="previewMode"
        :show="previewMode"
        :title="postTitle"
        :content="postContent"
        :tags="store.state.tegs.tags"
        :images="store.state.picture.uploadedImages"
        :videos="store.state.video.uploadedVideos"
        :audio="store.state.music.uploadedAudio"
        :documents="store.state.format.uploadedFiles"
        @close="togglePreview"
        @removeImage="handleImageRemove"
        @removeVideo="removeVideo"
        @removeAudio="removeAudio"
        @removeDocument="removeFormat"
      />

      <!-- Скрытые input'ы для загрузки файлов -->
      <input
        type="file"
        ref="imageInput"
        accept="image/*"
        class="hidden"
        @change="handleFileUpload"
      />
      <input
        ref="videoInput"
        type="file"
        accept="video/mp4,video/mov,video/quicktime"
        @change="handleVideoUpload"
        class="hidden"
        multiple
      >
      <input
        type="file"
        ref="audioInput"
        accept="audio/mpeg, audio/mp3, .mp3, .m4a"
        class="hidden"
        @change="handleAudioUpload"
        multiple
      />
      <input
        type="file"
        ref="formatInput"
        accept=".doc,.docx,.pdf,.txt,.rtf,.odt"
        class="hidden"
        @change="handleFormatUpload"
      />
      <input
        type="file"
        ref="fileInput"
        accept=".png,.jpg,.jpeg,.gif,.mp4,.mov"
        class="hidden"
        @change="handleFileUpload"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import Preview from './Preview.vue';
import Emoji from '../components/Emoji.vue';
import { useRouter, useRoute } from 'vue-router';
import { database } from '../plugins/firebase';

const route = useRoute();
const router = useRouter();
const store = useStore();
const toast = useToast();
const categoryId = computed(() => route.params.categoryId);

// Определение refs для input'ов
const imageInput = ref(null);
const videoInput = ref(null);
const audioInput = ref(null);
const formatInput = ref(null);

const postTitle = ref('');
const postContent = ref('');
const tagInput = ref('');
const images = ref([]);
const attachments = ref([]);
const isUploading = ref(false);
const remainingCharacters = computed(() => Math.max(0, 333 - (postContent.value?.length || 0)));
const remainingTitleCharacters = computed(() => Math.max(0, 33 - (postTitle.value?.length || 0)));
const editor = ref(null);

const isVideoUploading = ref(false);
const isAudioUploading = ref(false);
const videoUploadProgress = ref(0);

const audioFiles = computed(() => store.state.music.uploadedAudio);
const audioLoadingStates = ref([]);

const showEmojiPicker = ref(false);
const emojiPickerPosition = ref({ x: 0, y: 0 });

const showValidation = ref(false);
const previewMode = ref(false);

const isFormValid = computed(() => {
  const titleValid = postTitle.value.trim().length > 0;
  const contentValid = postContent.value.length > 0;
  return titleValid && contentValid;
});

// Функции для работы с тегами
const addTag = async () => {
  const tag = tagInput.value.trim();
  if (tag) {
    const result = await store.dispatch('tegs/addTag', tag);
    if (result.success) {
      tagInput.value = '';
    } else {
      toast.warning(result.message);
    }
  }
};

// Обработчики для медиа
const triggerImageUpload = () => {
  if (imageInput.value) imageInput.value.click();
};

const triggerVideoUpload = () => {
  if (videoInput.value) videoInput.value.click();
};

const triggerAudioUpload = () => {
  if (audioInput.value) audioInput.value.click();
};

const triggerFormatUpload = () => {
  if (formatInput.value) formatInput.value.click();
};

const handleFileUpload = async (event) => {
  const files = event.target.files;
  if (!files || !files.length) {
    toast.warning('Файлы не выбраны');
    return;
  }

  try {
    const currentImages = store.state.picture.uploadedImages || [];
    const totalImagesAfterUpload = currentImages.length + files.length;
    if (totalImagesAfterUpload > 10) {
      toast.error('Нельзя загрузить больше 10 изображений');
      return;
    }

    for (const file of files) {
      if (!file || !file.type.startsWith('image/')) {
        toast.error(`Файл ${file?.name || 'неизвестный'} не является изображением`);
        continue;
      }
      // Передаём объект { file, type }
      await store.dispatch('picture/uploadImage', { file, type: 'post' });
    }
    // Сбрасываем значение <input>
    if (event.target) event.target.value = '';
  } catch (error) {
    console.error('Ошибка при загрузке изображения:', error);
    toast.error('Не удалось загрузить изображение: ' + (error.message || 'Неизвестная ошибка'));
  }
};

const handleVideoUpload = async (event) => {
  const files = Array.from(event.target.files);
  const maxSize = 20 * 1024 * 1024;

  for (const videoFile of files) {
    try {
      if (videoFile.size > maxSize) {
        toast.error('Видео превышает 20MB');
        continue;
      }
      await store.dispatch('video/uploadVideo', videoFile);
    } catch (error) {
      console.error('Ошибка при загрузке видео:', error);
      toast.error('Ошибка при загрузке видео');
    }
  }
  event.target.value = '';
};

const handleAudioUpload = async (event) => {
  const files = Array.from(event.target.files);
  isAudioUploading.value = true;

  for (const file of files) {
    try {
      const result = await store.dispatch('music/uploadAudio', file);
      if (result.success) {
        audioLoadingStates.value.push(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Ошибка при загрузке файла ${file.name}`);
    }
  }
  isAudioUploading.value = false;
  if (audioInput.value) audioInput.value.value = '';
};

const handleFormatUpload = async (event) => {
  const files = Array.from(event.target.files);
  for (const file of files) {
    try {
      const result = await store.dispatch('format/uploadFile', file);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch (error) {
      toast.error(`Ошибка при загрузке файла ${file.name}`);
    }
  }
  if (formatInput.value) formatInput.value.value = '';
};

const handleImageRemove = (index) => {
  store.dispatch('picture/removeImage', index);
  toast.success('Изображение удалено');
};

const removeVideo = (index) => {
  store.dispatch('video/removeVideo', index);
  toast.success('Видео удалено');
};

const removeAudio = (index) => {
  store.dispatch('music/removeAudio', index);
  toast.success('Аудио удалено');
};

const removeFormat = (index) => {
  store.dispatch('format/removeFile', index);
  toast.success('Документ удален');
};

// Обработчики для форматирования и ввода
const applyFormat = (format) => {
  document.execCommand(format, false, null);
  editor.value.focus();
};

const handleInput = (event) => {
  const content = event.target.innerHTML.trim();
  if (content.length > 333) {
    event.target.innerHTML = content.slice(0, 333);
  }
  postContent.value = event.target.innerHTML;
  showValidation.value = true;
};

const handleTitleInput = () => {
  if (postTitle.value.length > 33) {
    postTitle.value = postTitle.value.slice(0, 33);
  }
  showValidation.value = true;
};

const handlePaste = (event) => {
  event.preventDefault();
  const text = event.clipboardData.getData('text/plain');
  document.execCommand('insertText', false, text);
};

// Эмодзи
const openEmojiPicker = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  emojiPickerPosition.value = { x: rect.left, y: rect.bottom + 5 };
  showEmojiPicker.value = true;
};

const handleEmojiSelect = (emoji) => {
  const selection = window.getSelection();
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange();
  range.insertNode(document.createTextNode(emoji));
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  postContent.value = editor.value.innerHTML;
  editor.value.focus();
};

// Валидация и отправка
const validateAndSubmit = async () => {
  showValidation.value = true;
  if (!isFormValid.value) {
    toast.error('Заполните заголовок и содержание');
    return;
  }

  try {
    const postData = {
      title: postTitle.value.trim(),
      content: editor.value.innerHTML,
      categoryId: categoryId.value,
      pictures: store.state.picture.uploadedImages,
      videos: store.state.video.uploadedVideos,
      audio: store.state.music.uploadedAudio,
      documents: store.state.format.uploadedFiles,
      tags: store.state.tegs.tags, // Теги из Vuex
      createdAt: new Date().toISOString()
    };

    console.log('[CreatePost] Отправка данных:', postData);
    const postId = await store.dispatch('posts/createPost', postData);
    toast.success('Пост успешно создан');
    clearForm();
    router.push({ name: 'PostDetails', params: { id: postId } });
  } catch (error) {
    console.error('[CreatePost] Ошибка:', error);
    toast.error('Ошибка при создании поста');
  }
};

// Очистка формы
const clearForm = async () => {
  postTitle.value = '';
  if (editor.value) editor.value.innerHTML = '';
  await Promise.all([
    store.dispatch('picture/clearImages'),
    store.dispatch('music/clearAudio'),
    store.dispatch('video/clearVideos'),
    store.dispatch('format/clearFiles'),
    store.dispatch('tegs/clearTags') // Очистка тегов
  ]);
};

// Предпросмотр
const togglePreview = () => {
  previewMode.value = !previewMode.value;
};

// Аудио события
const onAudioLoadStart = (index) => {
  audioLoadingStates.value[index] = true;
};

const onAudioCanPlay = (index) => {
  audioLoadingStates.value[index] = false;
};

const onAudioError = (index) => {
  audioLoadingStates.value[index] = false;
  toast.error('Ошибка при загрузке аудио');
};

// Получение имени файла
const getVideoFileName = (url) => url ? decodeURIComponent(url.split('/').pop()) : '';
const getAudioFileName = (url) => url ? decodeURIComponent(url.split('/').pop()) : '';

// Хук для очистки тегов
onUnmounted(() => {
  store.dispatch('tegs/clearTags');
});

onMounted(() => {
  console.log('Компонент CreatePost смонтирован');
});
</script>

<style scoped>
.video-player {
  --plyr-color-main: #8B5CF6;
  --plyr-video-background: #1F2937;
  --plyr-menu-background: #374151;
  --plyr-menu-color: #F3F4F6;
  --plyr-tooltip-background: #374151;
  --plyr-tooltip-color: #F3F4F6;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.video-player:hover {
  --plyr-video-controls-background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7));
}

.image-preview:hover img {
  transform: scale(1.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

textarea {
  white-space: pre-wrap !important;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  min-height: 300px;
  resize: vertical;
}

.post-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}
</style>