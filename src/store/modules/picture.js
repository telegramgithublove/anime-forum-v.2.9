import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';


const state = {
  postImages: {},
  uploadedImages: [],
  uploadProgress: {},
  selectedImage: null,
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  SET_POST_IMAGES(state, { postId, images }) {
    state.postImages[postId] = images;
  },
  ADD_IMAGE(state, imageUrl) {
    if (!state.uploadedImages.includes(imageUrl)) {
      state.uploadedImages.push(imageUrl);
    }
  },
  SET_UPLOADED_IMAGES(state, images) {
    state.uploadedImages = Array.isArray(images) ? images : [];
    console.log('Обновлен список изображений:', state.uploadedImages);
  },
  SET_UPLOAD_PROGRESS(state, { fileName, progress }) {
    state.uploadProgress[fileName] = progress;
  },
  REMOVE_IMAGE(state, index) {
    state.uploadedImages.splice(index, 1);
  },
  CLEAR_UPLOADED_IMAGES(state) {
    state.uploadedImages = [];
    state.uploadProgress = {};
  },
  setSelectedImage(state, image) {
    state.selectedImage = image;
  }
};

const actions = {
  async uploadImage({ dispatch, commit, state }, { file, type = 'post' }) {
    // Проверка на наличие файла
    if (!file) {
      const error = new Error('Файл не предоставлен');
      console.error(`picture/uploadImage (${type}) - Ошибка загрузки:`, error);
      throw error;
    }

    try {
      console.log(`picture/uploadImage - Начало загрузки файла (${type}):`, file.name);

      // Создаём объект FormData для отправки файла
      const formData = new FormData();
      formData.append('file', file);

      // Отправляем POST-запрос на сервер
      const response = await axios.post(`${state.baseUrl}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Проверяем успешность ответа
      if (!response.data || !response.data.success || !response.data.fileUrl) {
        throw new Error('Сервер не вернул корректный URL изображения');
      }

      // Формируем полный URL изображения
      const relativePath = response.data.fileUrl;
      const imageUrl = `${state.baseUrl}${relativePath.startsWith('/') ? relativePath : '/' + relativePath}`;
      console.log('Полный URL изображения:', imageUrl);

      // Получаем userId из localStorage
      const userId = localStorage.getItem('userId') || 'default';
      let imagesRef;

      // Определяем путь в базе данных в зависимости от типа (post или comment)
      if (type === 'comment') {
        imagesRef = databaseRef(database, `users/${userId}/commentImages`);
      } else {
        imagesRef = databaseRef(database, `users/${userId}/images`);
      }

      // Получаем текущие изображения из Firebase Realtime Database
      const currentImagesSnapshot = await get(imagesRef);
      const currentImages = currentImagesSnapshot.val() || [];
      
      // Проверяем, что currentImages — массив
      if (!Array.isArray(currentImages)) {
        console.warn('currentImages не является массивом, инициализируем как пустой массив');
        await set(imagesRef, []);
      }

      // Добавляем изображение, если его нет в списке
      if (!currentImages.includes(imageUrl)) {
        currentImages.push(imageUrl);
        await set(imagesRef, currentImages); // Сохраняем обновлённый список
      }

      commit('ADD_IMAGE', imageUrl); // Добавляем URL в состояние Vuex
      return imageUrl; // Возвращаем URL для использования
    } catch (error) {
      console.error(`picture/uploadImage (${type}) - Ошибка загрузки:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error; // Передаём ошибку дальше
    }
  },
  clearImages({ commit }) {
    commit('CLEAR_UPLOADED_IMAGES');
  },
};

const getters = {
  getPostImages: (state) => (postId) => state.postImages[postId] || [],
  getUploadedImages: (state) => state.uploadedImages,
  getUploadProgress: (state) => (fileName) => state.uploadProgress[fileName] || 0,
  getSelectedImage: (state) => state.selectedImage,
  getImageUrl: (state) => (url) => url
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};