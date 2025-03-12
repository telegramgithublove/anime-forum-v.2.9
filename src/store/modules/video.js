import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  postVideos: {},
  uploadedVideos: [],
  uploadProgress: {},
  baseUrl: 'http://95.164.90.115:3000' // Используем реальный IP сервера вместо localhost
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
    return new Promise((resolve, reject) => {
      const allowedTypes = ['video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('Поддерживаются только форматы MP4 и MOV'));
        return;
      }

      const maxSize = 20 * 1024 * 1024; 
      if (file.size > maxSize) {
        reject(new Error('Размер видео не должен превышать 20MB'));
        return;
      }

      resolve(file);
    });
  },

  async uploadVideo({ commit, state }, formDataOrFile) {
    try {
      console.log('Начало загрузки видео');
      
      const userId = localStorage.getItem('userId') || 'default';
      let formData;
      let file;
  
      // Проверяем, получили ли мы FormData или File
      if (formDataOrFile instanceof FormData) {
        formData = formDataOrFile;
        file = formDataOrFile.get('file');
      } else {
        file = formDataOrFile;
        formData = new FormData();
        formData.append('file', file);
      }
  
      if (!file) {
        throw new Error('Файл не найден в FormData');
      }
  
      const uploadUrl = `${state.baseUrl}/upload`;
      console.log('Отправка запроса на:', uploadUrl);
      console.log('Тип файла:', file.type);
      console.log('Размер отправляемого файла:', (file.size / 1024 / 1024).toFixed(2), 'MB');
  
      // Добавляем таймаут и повторные попытки
      const response = await axios.post(uploadUrl, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000, // 5 минут таймаут для больших файлов
        maxContentLength: Infinity, // Для больших файлов
        maxBodyLength: Infinity, // Для больших файлов
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          commit('SET_UPLOAD_PROGRESS', { fileName: file.name, progress });
        },
        // Повторные попытки при ошибке сети
        retry: 3,
        retryDelay: 1000
      });
  
      if (response.data && response.data.fileUrl) {
        const videoUrl = response.data.fileUrl;
        console.log('Итоговый URL видео:', videoUrl);
  
        // Сохраняем URL в Firebase
        const videosRef = databaseRef(database, `users/${userId}/videos`);
        const currentVideos = (await get(videosRef)).val() || [];
        
        if (!currentVideos.includes(videoUrl)) {
          await set(videosRef, [...currentVideos, videoUrl]);
        }
  
        commit('ADD_VIDEO', videoUrl);
        return { success: true, videoUrl };
      }
      
      throw new Error('Неверный формат ответа сервера: ' + JSON.stringify(response.data));
    } catch (error) {
      console.error('Ошибка при загрузке видео:', error);
      
      // Улучшенная обработка ошибок
      let errorMessage = 'Произошла ошибка при загрузке видео';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Не удалось подключиться к серверу. Пожалуйста, проверьте подключение к интернету.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Превышено время ожидания ответа от сервера. Попробуйте загрузить файл меньшего размера.';
      } else if (error.response) {
        errorMessage = `Ошибка сервера: ${error.response.status} ${error.response.data.message || ''}`;
      }
      
      throw new Error(errorMessage);
    }
  },

  async uploadMultipleVideos({ dispatch }, files) {
    const results = await Promise.all(files.map(file => dispatch('uploadVideo', file)));
    return results.filter(result => result.success).map(result => result.videoUrl);
  },

  async savePostVideos({ commit }, { postId, videos }) {
    try {
      console.log('Сохранение видео для поста:', { postId, videos });
      const videosRef = databaseRef(database, `posts/${postId}/videos`);
      await set(videosRef, videos);
      commit('SET_POST_VIDEOS', { postId, videos });
      return { success: true };
    } catch (error) {
      console.error('Ошибка при сохранении видео:', error);
      throw error;
    }
  },

  async fetchPostVideos({ commit }, postId) {
    try {
      console.log('video/fetchPostVideos - Загрузка видео поста:', postId);
      
      const videosRef = databaseRef(database, `posts/${postId}/videos`);
      const snapshot = await get(videosRef);
      
      if (snapshot.exists()) {
        const videos = snapshot.val();
        const processedVideos = Array.isArray(videos) ? videos : Object.values(videos);
        commit('SET_POST_VIDEOS', { postId, videos: processedVideos });
        console.log('video/fetchPostVideos - Видео загружены:', processedVideos);
        return processedVideos;
      }
      
      return [];
    } catch (error) {
      console.error('video/fetchPostVideos - Ошибка загрузки:', error);
      throw new Error('Не удалось загрузить видео поста');
    }
  },

  async removePostVideo({ commit, state }, { postId, videoUrl }) {
    try {
      console.log('video/removePostVideo - Удаление видео:', videoUrl);
      
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
      console.error('video/removePostVideo - Ошибка удаления:', error);
      throw new Error('Не удалось удалить видео');
    }
  },

  clearVideos({ commit }) {
    commit('CLEAR_UPLOADED_VIDEOS');
  }
};

const getters = {
  getPostVideos: (state) => (postId) => {
    const videos = state.postVideos[postId] || [];
    return videos;
  },
  getUploadedVideos: (state) => {
    return state.uploadedVideos;
  },
  getUploadProgress: (state) => (fileName) => state.uploadProgress[fileName] || 0,
  getVideoFileName: () => (url) => {
    if (!url) return '';
    try {
      // Извлекаем имя файла из URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      // Декодируем URL-encoded символы
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