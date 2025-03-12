import axios from 'axios';
import { ref as dbRef, get, set, remove } from 'firebase/database';
import { database } from '@/plugins/firebase';


const forumModule = {
  namespaced: true,
  state: {
    emojis: [], // Для хранения полученных эмодзи
    loading: false, // Статус загрузки
    error: null, // Ошибки при запросе
    likes: {}, // Объект для хранения лайков
  },
  mutations: {
    SET_EMOJIS(state, emojis) {
      state.emojis = emojis; // Сохранение эмодзи в состоянии
    },
    SET_LOADING(state, isLoading) {
      state.loading = isLoading; // Установка статуса загрузки
    },
    SET_ERROR(state, error) {
      state.error = error; // Установка ошибки
    },
    SET_REPLY_LIKES(state, { replyId, likes }) {
      state.likes = { 
        ...state.likes, 
        [replyId]: likes 
      };
      console.log('Обновлено состояние лайков:', state.likes);
    },
  },
  actions: {
    async fetchEmojis({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const response = await axios.get('http://localhost:3001/api/emoji/all');
        commit('SET_EMOJIS', response.data);
      } catch (error) {
        commit('SET_ERROR', error.message);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async toggleLike({ commit, dispatch }, { replyId, userId }) {
      console.log('Toggling like for reply:', replyId, 'user:', userId);
      try {
        const likesRef = dbRef(database, `likes/${replyId}`);
        const snapshot = await get(likesRef);
        const currentLikes = snapshot.val() || {};
        
        if (currentLikes[userId]) {
          console.log('Removing like');
          delete currentLikes[userId];
        } else {
          console.log('Adding like');
          currentLikes[userId] = true;
        }
        
        await set(likesRef, currentLikes);
        commit('SET_REPLY_LIKES', { replyId, likes: currentLikes });
        console.log('Updated likes:', currentLikes);
        return Object.keys(currentLikes).length;
      } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
      }
    },

    async fetchReplyLikes({ commit }, replyId) {
      console.log('Fetching likes for reply:', replyId);
      try {
        const likesRef = dbRef(database, `likes/${replyId}`);
        const snapshot = await get(likesRef);
        const likes = snapshot.val() || {};
        console.log('Fetched likes:', likes);
        commit('SET_REPLY_LIKES', { replyId, likes });
        return Object.keys(likes).length;
      } catch (error) {
        console.error('Error fetching likes:', error);
        return 0;
      }
    },
  },
  getters: {
    emojis: (state) => state.emojis, // Геттер для получения списка эмодзи
    loading: (state) => state.loading, // Геттер для проверки статуса загрузки
    error: (state) => state.error, // Геттер для получения ошибок
    getLikes: (state) => (replyId) => state.likes[replyId] || {}, // Геттер для получения лайков для конкретного ответа
    getLikeCount: (state) => (replyId) => {
      const likes = state.likes[replyId] || {};
      return Object.keys(likes).length; // Геттер для получения количества лайков для конкретного ответа
    },
    isLikedByUser: (state) => (replyId, userId) => {
      const likes = state.likes[replyId] || {};
      return !!likes[userId]; // Геттер для проверки, поставил ли пользователь лайк
    },
  },
};

export default forumModule;
