import { ref as databaseRef, set, get, onValue, push, update } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  comments: [],
  isLoading: false,
  error: null,
  unsubscribe: null,
  baseUrl: 'http://95.164.90.115:3000',
};

const mutations = {
  SET_COMMENTS(state, comments) {
    state.comments = comments;
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_UNSUBSCRIBE(state, unsubscribe) {
    state.unsubscribe = unsubscribe;
  },
  CLEAR_COMMENTS(state) {
    state.comments = [];
    if (state.unsubscribe) {
      state.unsubscribe();
      state.unsubscribe = null;
    }
  },
};

const actions = {
  async fetchComments({ commit, state }, postId) {
    if (state.unsubscribe) {
      state.unsubscribe();
    }
    commit('SET_LOADING', true);
    try {
      const commentsRef = databaseRef(database, `posts/${postId}/comments`);
      const unsubscribe = onValue(
        commentsRef,
        (snapshot) => {
          const comments = snapshot.exists()
            ? Object.entries(snapshot.val()).map(([key, value]) => ({ id: key, ...value }))
            : [];
          console.log('Fetched comments from Firebase:', comments);
          commit('SET_COMMENTS', comments);
          commit('SET_LOADING', false);
        },
        (error) => {
          console.error('Ошибка в подписке на комментарии:', error);
          commit('SET_ERROR', error.message);
          commit('SET_LOADING', false);
        }
      );
      commit('SET_UNSUBSCRIBE', unsubscribe);
    } catch (error) {
      console.error('Ошибка при загрузке комментариев:', error);
      commit('SET_ERROR', error.message);
      commit('SET_LOADING', false);
    }
  },

  async addComment({ commit }, commentData) {
    try {
      const userId = localStorage.getItem('userId') || 'default';
      const commentsRef = databaseRef(database, `posts/${commentData.postId}/comments`);
      const newCommentRef = push(commentsRef);

      const comment = {
        author: {
          username: userId,
          avatarUrl: null,
          signature: null,
        },
        content: commentData.content,
        image: commentData.image || null,
        createdAt: Date.now(),
        likes: {}, // Инициализация объекта для лайков
        likesCount: 0, // Инициализация счетчика лайков
      };

      await set(newCommentRef, comment);
      console.log('Комментарий успешно добавлен:', comment);
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      commit('SET_ERROR', error.message);
      throw error;
    }
  },

  async toggleCommentLike({ commit }, { postId, commentId, userId, liked }) {
    try {
      const commentRef = databaseRef(database, `posts/${postId}/comments/${commentId}`);
      const snapshot = await get(commentRef);
      if (!snapshot.exists()) throw new Error('Комментарий не найден');

      const commentData = snapshot.val();
      const likes = commentData.likes || {};
      let likesCount = commentData.likesCount || 0;

      if (liked) {
        // Поставить лайк
        likes[userId] = true;
        likesCount += 1;
      } else {
        // Убрать лайк
        delete likes[userId];
        likesCount = Math.max(likesCount - 1, 0);
      }

      await update(commentRef, { likes, likesCount });
      console.log(`Лайк для комментария ${commentId} обновлен:`, { liked, likesCount });
    } catch (error) {
      console.error('Ошибка при обновлении лайка:', error);
      throw error;
    }
  },

  clearComments({ commit }) {
    commit('CLEAR_COMMENTS');
  },
};

const getters = {
  getComments: (state) => state.comments,
  isLoading: (state) => state.isLoading,
  getError: (state) => state.error,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};