import axios from 'axios';

export default {
    namespaced: true,
    state() {
      return {
        users: [],  // Хранение пользователей
        currentUser: null, // Текущий пользователь
      };
    },
    mutations: {
      SET_USER(state, user) {
        state.currentUser = user;
      },
      UPDATE_USER_VERIFIED_STATUS(state, { userId, isVerified }) {
        const user = state.users.find(u => u.id === userId);
        if (user) {
          user.isVerified = isVerified;
        }
      }
    },
    actions: {
      async fetchUser({ commit }, userId) {
        try {
          const user = await axios.get(`/api/users/${userId}`);
          commit('SET_USER', user);
        } catch (error) {
          console.error('Ошибка при получении данных пользователя:', error);
        }
      },
      async verifyUserEmail({ commit }, userId) {
        try {
          // Здесь логика для подтверждения email через API
          const response = await axios.patch(`/api/users/${userId}`, { isVerified: true });
          commit('UPDATE_USER_VERIFIED_STATUS', { userId, isVerified: true });
          return response;
        } catch (error) {
          console.error('Ошибка при подтверждении email:', error);
          throw error;
        }
      }
    },
    getters: {
      isVerified: (state) => {
        return state.currentUser?.isVerified || false;  // Проверка, подтвержден ли аккаунт
      }
    }
  };
  