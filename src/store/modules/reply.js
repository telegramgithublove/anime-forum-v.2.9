import { ref as databaseRef, push, set, get, onValue, off } from 'firebase/database';
import { database } from '../../plugins/firebase';

export default {
  namespaced: true,
  state() {
    return {
      replies: {},
      isLoading: false,
      error: null,
      unsubscribers: {},
    };
  },
  mutations: {
    SET_REPLIES(state, { commentId, replies }) {
      state.replies[commentId] = replies;
    },
    ADD_REPLY(state, { commentId, reply }) {
      if (!state.replies[commentId]) {
        state.replies[commentId] = [];
      }
      if (!state.replies[commentId].some(r => r.id === reply.id)) {
        state.replies[commentId].push(reply);
      }
    },
    SET_LOADING(state, status) {
      state.isLoading = status;
    },
    SET_ERROR(state, error) {
      state.error = error;
    },
    SET_UNSUBSCRIBE(state, { commentId, unsubscribe }) {
      state.unsubscribers[commentId] = unsubscribe;
    },
    CLEAR_UNSUBSCRIBE(state, commentId) {
      delete state.unsubscribers[commentId];
    },
  },
  actions: {
    async fetchReplies({ commit, state }, { postId, commentId }) {
      if (state.unsubscribers[commentId]) {
        state.unsubscribers[commentId]();
        commit('CLEAR_UNSUBSCRIBE', commentId);
      }

      commit('SET_LOADING', true);
      try {
        const repliesRef = databaseRef(database, `posts/${postId}/comments/${commentId}/replies`);
        const unsubscribe = onValue(
          repliesRef,
          (snapshot) => {
            const replies = [];
            if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                replies.push({
                  id: childSnapshot.key,
                  ...childSnapshot.val(),
                });
              });
            }
            console.log(`Fetched replies for comment ${commentId}:`, replies);
            commit('SET_REPLIES', { commentId, replies });
            commit('SET_LOADING', false);
          },
          (error) => {
            console.error('Ошибка в подписке на ответы:', error);
            commit('SET_ERROR', error.message);
            commit('SET_LOADING', false);
          }
        );
        commit('SET_UNSUBSCRIBE', { commentId, unsubscribe });
      } catch (error) {
        console.error('Ошибка при загрузке ответов:', error);
        commit('SET_ERROR', error.message);
        commit('SET_LOADING', false);
      }
    },

    async addReply({ commit, rootState }, { postId, commentId, content }) {
      try {
        console.log('addReply started for commentId:', commentId);
        const currentUser = rootState.auth.user;
        if (!currentUser) {
          throw new Error('Пожалуйста, войдите в систему');
        }

        const userProfileRef = databaseRef(database, `users/${currentUser.uid}/profile`);
        const userProfileSnapshot = await get(userProfileRef);
        const userProfile = userProfileSnapshot.val() || {};

        const newReply = {
          content,
          author: {
            uid: currentUser.uid,
            username: userProfile.username || 'Гость',
            avatarUrl: userProfile.avatarUrl || '/image/empty_avatar.png',
            signature: userProfile.signature || 'Участник форума',
          },
          createdAt: new Date().toISOString(),
        };

        const repliesRef = databaseRef(database, `posts/${postId}/comments/${commentId}/replies`);
        console.log('Attempting to save reply to:', repliesRef.toString());
        const newReplyRef = push(repliesRef);
        await set(newReplyRef, newReply);
        console.log('Reply saved to Firebase with key:', newReplyRef.key);

        const replyWithId = { id: newReplyRef.key, ...newReply };
        commit('ADD_REPLY', { commentId, reply: replyWithId });
        console.log('Added reply:', replyWithId);
        return { success: true };
      } catch (error) {
        console.error('Ошибка при добавлении ответа:', error);
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    unsubscribeReplies({ state, commit }, { commentId }) {
      if (state.unsubscribers[commentId]) {
        state.unsubscribers[commentId]();
        commit('CLEAR_UNSUBSCRIBE', commentId);
        console.log(`Unsubscribed from replies for comment ${commentId}`);
      }
    },
  },
  getters: {
    getReplies: (state) => (commentId) => state.replies[commentId] || [],
    isLoading: (state) => state.isLoading,
    hasError: (state) => state.error !== null,
    getError: (state) => state.error,
  },
};