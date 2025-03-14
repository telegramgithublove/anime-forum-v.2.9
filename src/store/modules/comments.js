import { ref as databaseRef, push, set, get, onValue, off } from 'firebase/database';
import { database } from '../../plugins/firebase';

export default {
  namespaced: true,
  state() {
    return {
      comments: [],
      isLoading: false,
      error: null,
      unsubscribe: null,
    };
  },
  mutations: {
    SET_COMMENTS(state, comments) {
      console.log('comments/SET_COMMENTS - Установка комментариев:', comments);
      state.comments = comments;
    },
    ADD_COMMENT(state, comment) {
      console.log('comments/ADD_COMMENT - Добавление комментария:', comment);
      if (!state.comments.some(c => c.id === comment.id)) {
        state.comments.push(comment);
      }
    },
    SET_LOADING(state, status) {
      console.log('comments/SET_LOADING - Изменение состояния загрузки:', status);
      state.isLoading = status;
    },
    SET_ERROR(state, error) {
      console.log('comments/SET_ERROR - Установка ошибки:', error);
      state.error = error;
    },
    SET_UNSUBSCRIBE(state, unsubscribe) {
      console.log('comments/SET_UNSUBSCRIBE - Установка функции отписки');
      state.unsubscribe = unsubscribe;
    },
  },
  actions: {
    async fetchComments({ commit, state }, postId) {
      console.log('comments/fetchComments - Начало загрузки комментариев для поста:', postId);
      if (state.unsubscribe) {
        state.unsubscribe();
      }

      commit('SET_LOADING', true);
      return new Promise((resolve, reject) => {
        try {
          const commentsRef = databaseRef(database, `posts/${postId}/comments`);
          const unsubscribe = onValue(
            commentsRef,
            (snapshot) => {
              const comments = [];
              if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                  comments.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val(),
                  });
                });
              }
              console.log('comments/fetchComments - Комментарии получены:', comments);
              commit('SET_COMMENTS', comments);
              commit('SET_LOADING', false);
              resolve(comments);
            },
            (error) => {
              console.error('comments/fetchComments - Ошибка подписки:', error);
              commit('SET_ERROR', error.message);
              commit('SET_LOADING', false);
              reject(error);
            }
          );
          commit('SET_UNSUBSCRIBE', unsubscribe);
        } catch (error) {
          console.error('comments/fetchComments - Ошибка при загрузке:', error);
          commit('SET_ERROR', error.message);
          commit('SET_LOADING', false);
          reject(error);
        }
      });
    },

    unsubscribeComments({ state, commit }) {
      console.log('comments/unsubscribeComments - Отписка от комментариев');
      if (state.unsubscribe) {
        state.unsubscribe();
        commit('SET_UNSUBSCRIBE', null);
      }
    },

    async addComment({ commit, rootState }, { postId, content, image, video }) {
      console.log('comments/addComment - Начало добавления комментария для поста:', postId);
      try {
        const currentUser = rootState.auth.user;
        if (!currentUser) {
          console.error('comments/addComment - Пользователь не авторизован');
          throw new Error('Пожалуйста, войдите в систему');
        }

        console.log('comments/addComment - Текущий пользователь:', currentUser.uid);
        const userProfileRef = databaseRef(database, `users/${currentUser.uid}/profile`);
        const userProfileSnapshot = await get(userProfileRef);
        const userProfile = userProfileSnapshot.val() || {};
        console.log('comments/addComment - Профиль пользователя:', userProfile);

        const commentsRef = databaseRef(database, `posts/${postId}/comments`);
        const newCommentRef = push(commentsRef);

        const comment = {
          author: {
            uid: currentUser.uid,
            username: userProfile.username || currentUser.uid || 'Гость',
            avatarUrl: userProfile.avatarUrl || '/image/empty_avatar.png',
            signature: userProfile.signature || 'Участник форума',
          },
          content: content || '',
          image: image || null,
          video: video || null,
          createdAt: Date.now(),
          likes: {},
          likesCount: 0,
        };

        console.log('comments/addComment - Данные нового комментария:', comment);
        await set(newCommentRef, comment);
        console.log('comments/addComment - Комментарий сохранён в Firebase, ключ:', newCommentRef.key);

        const commentWithId = { id: newCommentRef.key, ...comment };
        commit('ADD_COMMENT', commentWithId);
        console.log('comments/addComment - Комментарий добавлен в состояние:', commentWithId);
        return { success: true, commentId: newCommentRef.key };
      } catch (error) {
        console.error('comments/addComment - Ошибка при добавлении комментария:', error);
        commit('SET_ERROR', error.message);
        throw error;
      }
    },

    async toggleCommentLike({ commit, state }, { postId, commentId, userId, liked }) {
      console.log('comments/toggleCommentLike - Переключение лайка, commentId:', commentId, 'liked:', liked);
      try {
        const commentRef = databaseRef(database, `posts/${postId}/comments/${commentId}`);
        const snapshot = await get(commentRef);
        if (!snapshot.exists()) {
          console.error('comments/toggleCommentLike - Комментарий не найден');
          throw new Error('Комментарий не найден');
        }

        const comment = snapshot.val();
        const likes = comment.likes || {};
        let likesCount = comment.likesCount || 0;

        if (liked) {
          likes[userId] = true;
          likesCount += 1;
        } else {
          delete likes[userId];
          likesCount -= 1;
        }

        await set(commentRef, { ...comment, likes, likesCount });
        console.log('comments/toggleCommentLike - Лайк обновлён в Firebase');

        const updatedComments = state.comments.map(c =>
          c.id === commentId ? { ...c, likes, likesCount } : c
        );
        commit('SET_COMMENTS', updatedComments);
        console.log('comments/toggleCommentLike - Комментарии обновлены в состоянии');
      } catch (error) {
        console.error('comments/toggleCommentLike - Ошибка:', error);
        throw error;
      }
    },
  },
  getters: {
    getComments: (state) => {
      console.log('comments/getComments - Получение комментариев:', state.comments);
      return state.comments;
    },
    isLoading: (state) => state.isLoading,
    hasError: (state) => state.error !== null,
    getError: (state) => state.error,
  },
};