// store/modules/tegs.js
const state = {
  tags: []
};

const mutations = {
  ADD_TAG(state, tag) {
    if (!state.tags.includes(tag) && state.tags.length < 3) {
      state.tags.push(tag);
    }
  },
  REMOVE_TAG(state, tag) {
    const index = state.tags.indexOf(tag);
    if (index > -1) {
      state.tags.splice(index, 1);
    }
  },
  CLEAR_TAGS(state) {
    state.tags = [];
  }
};

const actions = {
  addTag({ commit, state }, tag) {
    if (state.tags.length >= 3) {
      return { success: false, message: 'Максимальное количество тегов - 3' };
    }
    if (!state.tags.includes(tag)) {
      commit('ADD_TAG', tag);
      return { success: true };
    }
    return { success: false, message: 'Такой тег уже существует' };
  },
  removeTag({ commit }, tag) {
    commit('REMOVE_TAG', tag);
  },
  clearTags({ commit }) {
    commit('CLEAR_TAGS');
  }
};

const getters = {
  getTags: state => state.tags,
  canAddMoreTags: state => state.tags.length < 3
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};