import axios from 'axios';

const apiUrl = 'https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/categories.json';

export default {
  namespaced: true,
  state() {
    return {
      categories: [],
      error: null
    };
  },
  mutations: {
    setCategories(state, categories) {
      state.categories = categories;
    },
    addCategory(state, category) {
      state.categories.push(category);
    },
    updateCategory(state, { id, updatedCategory }) {
      const index = state.categories.findIndex(cat => cat.id === id);
      if (index !== -1) {
        state.categories[index] = { ...state.categories[index], ...updatedCategory };
      }
    },
    deleteCategory(state, id) {
      state.categories = state.categories.filter(cat => cat.id !== id);
    },
    setError(state, error) {
      state.error = error;
    }
  },
  actions: {
    async fetchCategories({ commit, rootState }) {
      try {
        // Проверяем superuser
        const isSuperUser = rootState.auth?.user?.role === 'superuser' || localStorage.getItem('userRole') === 'superuser';
        
        let response;
        if (isSuperUser) {
          response = await axios.get(apiUrl);
        } else {
          // Для обычных пользователей используем токен
          const token = await rootState.auth.user.getIdToken();
          response = await axios.get(apiUrl, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        const data = response.data;
        if (data) {
          const categories = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          commit('setCategories', categories);
          commit('setError', null);
          return categories;
        } else {
          commit('setCategories', []);
          return [];
        }
      } catch (error) {
        console.error("Ошибка при загрузке категорий:", error);
        commit('setError', 'Ошибка при загрузке категорий');
        return [];
      }
    },

    async addCategory({ commit, rootState }, category) {
      try {
        const isSuperUser = rootState.auth?.user?.role === 'superuser' || localStorage.getItem('userRole') === 'superuser';
        
        let response;
        if (isSuperUser) {
          response = await axios.post(apiUrl, category);
        } else {
          const token = await rootState.auth.user.getIdToken();
          response = await axios.post(apiUrl, category, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        commit('addCategory', { id: response.data.name, ...category });
        commit('setError', null);
      } catch (error) {
        console.error("Ошибка при добавлении категории:", error);
        commit('setError', 'Ошибка при добавлении категории');
      }
    },

    async editCategory({ commit, rootState }, { id, updatedCategory }) {
      try {
        const isSuperUser = rootState.auth?.user?.role === 'superuser' || localStorage.getItem('userRole') === 'superuser';
        const url = `https://forum-e06cc-default-rtdb.firebaseio.com/categories/${id}.json`;

        if (isSuperUser) {
          await axios.put(url, updatedCategory);
        } else {
          const token = await rootState.auth.user.getIdToken();
          await axios.put(url, updatedCategory, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        commit('updateCategory', { id, updatedCategory });
        commit('setError', null);
      } catch (error) {
        console.error("Ошибка при редактировании категории:", error);
        commit('setError', 'Ошибка при редактировании категории');
      }
    },

    async deleteCategory({ commit, rootState }, id) {
      try {
        const isSuperUser = rootState.auth?.user?.role === 'superuser' || localStorage.getItem('userRole') === 'superuser';
        const url = `https://forum-e06cc-default-rtdb.firebaseio.com/categories/${id}.json`;

        if (isSuperUser) {
          await axios.delete(url);
        } else {
          const token = await rootState.auth.user.getIdToken();
          await axios.delete(url, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        commit('deleteCategory', id);
        commit('setError', null);
      } catch (error) {
        console.error("Ошибка при удалении категории:", error);
        commit('setError', 'Ошибка при удалении категории');
      }
    }
  },
  getters: {
    categories: (state) => state.categories,
    error: (state) => state.error
  }
};
