import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  postVideos: {},
  uploadedVideos: [],
  uploadProgress: {},
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  SET_POST_VIDEOS(state, { postId, videos }) {
    state.postVideos[postId] = videos;
  },
  ADD_POST_VIDEO(state, { postId, videoUrl }) {
    if (!state.postVideos[postId]) {
      state.postVideos[postId] = [];
    }
    if (!state.uploadedVideos.includes(videoUrl)) {
      state.uploadedVideos.push(videoUrl);
    } else {
      console.warn('Видео уже добавлено:', videoUrl);
    }
    state.postVideos[postId].push(videoUrl);
  },
  REMOVE_POST_VIDEO(state, { postId, videoUrl }) {
    if (state.postVideos[postId]) {
      state.postVideos[postId] = state.postVideos[postId].filter(url => url !== videoUrl);
    }
  },
  CLEAR_POST_VIDEOS(state, postId) {
    if (postId) {
      state.postVideos[postId] = [];
    } else {
      state.postVideos = {};
    }
  },
  ADD_VIDEO(state, videoUrl) {
    if (!state.uploadedVideos.includes(videoUrl)) {
      state.uploadedVideos.push(videoUrl);
    }
  },
  CLEAR_UPLOADED_VIDEOS(state) {
    state.uploadedVideos = [];
    state.uploadProgress = {};
  },
  REMOVE_VIDEO(state, index) {
    state.uploadedVideos.splice(index, 1);
  },
  SET_UPLOAD_PROGRESS(state, { fileName, progress }) {
    state.uploadProgress[fileName] = progress;
  }
};

const actions = {
  async validateVideo({ commit }, file) {
    console.log('video/validateVideo - Проверка файла:', file.name);
    return new Promise((resolve, reject) => {
      const allowedTypes = ['video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        console.error('video/validateVideo - Неподдерживаемый тип:', file.type);
        reject(new Error('Поддерживаются только форматы MP4 и MOV'));
        return;
      }

      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error('video/validateVideo - Слишком большой файл:', file.size);
        reject(new Error('Размер видео не должен превышать 20MB'));
        return;
      }

      console.log('video/validateVideo - Файл прошёл проверку');
      resolve(file);
    });
  },

  async uploadVideo({ commit, state }, formDataOrFile) {
    console.log('video/uploadVideo - Начало загрузки');
    try {
      const userId = localStorage.getItem('userId') || 'default';
      let formData;
      let file;

      if (formDataOrFile instanceof FormData) {
        formData = formDataOrFile;
        file = formDataOrFile.get('file');
      } else {
        file = formDataOrFile;
        formData = new FormData();
        formData.append('file', file);
      }

      if (!file) {
        console.error('video/uploadVideo - Файл не найден');
        throw new Error('Файл не найден в FormData');
      }

      console.log('video/uploadVideo - Загружаемый файл:', file.name, 'Размер:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const uploadUrl = `${state.baseUrl}/upload`;
      console.log('video/uploadVideo - URL загрузки:', uploadUrl);

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log('video/uploadVideo - Прогресс загрузки:', progress + '%');
          commit('SET_UPLOAD_PROGRESS', { fileName: file.name, progress });
        },
        retry: 3,
        retryDelay: 1000
      });

      console.log('video/uploadVideo - Ответ сервера:', response.data);
      if (response.data && response.data.fileUrl) {
        const videoUrl = response.data.fileUrl;
        console.log('video/uploadVideo - Итоговый URL:', videoUrl);

        const videosRef = databaseRef(database, `users/${userId}/videos`);
        const currentVideos = (await get(videosRef)).val() || [];

        if (!currentVideos.includes(videoUrl)) {
          await set(videosRef, [...currentVideos, videoUrl]);
          console.log('video/uploadVideo - Видео сохранено в Firebase');
        }

        commit('ADD_VIDEO', videoUrl);
        return { success: true, videoUrl };
      }

      throw new Error('Неверный формат ответа сервера: ' + JSON.stringify(response.data));
    } catch (error) {
      console.error('video/uploadVideo - Ошибка загрузки:', error.message, error.response?.data);
      throw new Error('Ошибка при загрузке видео: ' + (error.message || 'Неизвестная ошибка'));
    }
  },

  async uploadMultipleVideos({ dispatch }, files) {
    console.log('video/uploadMultipleVideos - Начало загрузки нескольких видео');
    const results = await Promise.all(files.map(file => dispatch('uploadVideo', file)));
    console.log('video/uploadMultipleVideos - Результаты:', results);
    return results.filter(result => result.success).map(result => result.videoUrl);
  },

  async savePostVideos({ commit }, { postId, videos }) {
    console.log('video/savePostVideos - Сохранение видео для поста:', postId);
    try {
      const videosRef = databaseRef(database, `posts/${postId}/videos`);
      await set(videosRef, videos);
      commit('SET_POST_VIDEOS', { postId, videos });
      console.log('video/savePostVideos - Успешно сохранено');
      return { success: true };
    } catch (error) {
      console.error('video/savePostVideos - Ошибка:', error);
      throw error;
    }
  },

  async fetchPostVideos({ commit }, postId) {
    console.log('video/fetchPostVideos - Загрузка видео для поста:', postId);
    try {
      const videosRef = databaseRef(database, `posts/${postId}/videos`);
      const snapshot = await get(videosRef);

      if (snapshot.exists()) {
        const videos = snapshot.val();
        const processedVideos = Array.isArray(videos) ? videos : Object.values(videos);
        commit('SET_POST_VIDEOS', { postId, videos: processedVideos });
        console.log('video/fetchPostVideos - Видео загружены:', processedVideos);
        return processedVideos;
      }

      console.log('video/fetchPostVideos - Видео не найдены');
      return [];
    } catch (error) {
      console.error('video/fetchPostVideos - Ошибка:', error);
      throw new Error('Не удалось загрузить видео поста');
    }
  },

  async removePostVideo({ commit, state }, { postId, videoUrl }) {
    console.log('video/removePostVideo - Удаление видео:', videoUrl);
    try {
      if (postId) {
        const videosRef = databaseRef(database, `posts/${postId}/videos`);
        const snapshot = await get(videosRef);

        if (snapshot.exists()) {
          const videos = snapshot.val().filter(url => url !== videoUrl);
          await set(videosRef, videos);
          commit('SET_POST_VIDEOS', { postId, videos });
        }
      } else {
        const newVideos = state.uploadedVideos.filter(url => url !== videoUrl);
        commit('CLEAR_UPLOADED_VIDEOS');
        newVideos.forEach(url => commit('ADD_VIDEO', url));
      }

      console.log('video/removePostVideo - Видео удалено');
      return true;
    } catch (error) {
      console.error('video/removePostVideo - Ошибка:', error);
      throw new Error('Не удалось удалить видео');
    }
  },

  clearVideos({ commit }) {
    console.log('video/clearVideos - Очистка видео');
    commit('CLEAR_UPLOADED_VIDEOS');
  }
};

const getters = {
  getPostVideos: (state) => (postId) => state.postVideos[postId] || [],
  getUploadedVideos: (state) => state.uploadedVideos,
  getUploadProgress: (state) => (fileName) => state.uploadProgress[fileName] || 0,
  getVideoFileName: () => (url) => {
    if (!url) return '';
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      return decodeURIComponent(fileName);
    } catch (error) {
      console.error('Ошибка при получении имени файла:', error);
      return 'Неизвестный файл';
    }
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};