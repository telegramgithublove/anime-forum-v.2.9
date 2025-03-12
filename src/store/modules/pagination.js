import axios from 'axios';

export default {
  namespaced: true,
  state() {
    return {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      baseUrl: 'http://95.164.90.115:3000', // Базовый URL сервера
      uploadedFileUrl: '' // Сюда будем сохранять URL загруженного файла
    };
  },
  mutations: {
    SET_CURRENT_PAGE(state, page) {
      state.currentPage = page;
    },
    SET_ITEMS_PER_PAGE(state, count) {
      state.itemsPerPage = count;
    },
    SET_TOTAL_ITEMS(state, total) {
      state.totalItems = total;
    },
    SET_UPLOADED_FILE_URL(state, url) {
      state.uploadedFileUrl = url;
    }
  },
  actions: {
    setCurrentPage({ commit }, page) {
      commit('SET_CURRENT_PAGE', page);
    },
    setItemsPerPage({ commit }, count) {
      commit('SET_ITEMS_PER_PAGE', count);
    },
    setTotalItems({ commit }, total) {
      commit('SET_TOTAL_ITEMS', total);
    },
    async uploadFile({ commit, state }, file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${state.baseUrl}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const fileUrl = response.data.fileUrl.startsWith('http')
          ? response.data.fileUrl
          : `${state.baseUrl}${response.data.fileUrl.startsWith('/') ? response.data.fileUrl : '/' + response.data.fileUrl}`;

        commit('SET_UPLOADED_FILE_URL', fileUrl);
        return fileUrl;
      } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        throw error;
      }
    }
  },
  getters: {
    getCurrentPage: state => state.currentPage,
    getItemsPerPage: state => state.itemsPerPage,
    getTotalItems: state => state.totalItems,
    getTotalPages: state => Math.ceil(state.totalItems / state.itemsPerPage),
    getPagedItems: state => items => {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      const end = start + state.itemsPerPage;
      return items.slice(start, end);
    },
    getUploadedFileUrl: state => state.uploadedFileUrl
  }
};
