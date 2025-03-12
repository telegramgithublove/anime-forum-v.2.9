const state = () => ({
    selectedEmoji: null,
    recentEmojis: [],
    maxRecentEmojis: 20
  });
  
  const mutations = {
    SET_SELECTED_EMOJI(state, emoji) {
      state.selectedEmoji = emoji;
    },
    ADD_RECENT_EMOJI(state, emoji) {
      // Удаляем эмодзи если он уже есть в списке
      const index = state.recentEmojis.indexOf(emoji);
      if (index > -1) {
        state.recentEmojis.splice(index, 1);
      }
      
      // Добавляем эмодзи в начало списка
      state.recentEmojis.unshift(emoji);
      
      // Ограничиваем количество последних эмодзи
      if (state.recentEmojis.length > state.maxRecentEmojis) {
        state.recentEmojis.pop();
      }
    },
    CLEAR_SELECTED_EMOJI(state) {
      state.selectedEmoji = null;
    }
  };
  
  const actions = {
    selectEmoji({ commit }, emoji) {
      commit('SET_SELECTED_EMOJI', emoji);
      commit('ADD_RECENT_EMOJI', emoji);
    },
    clearSelectedEmoji({ commit }) {
      commit('CLEAR_SELECTED_EMOJI');
    }
  };
  
  const getters = {
    getSelectedEmoji: (state) => state.selectedEmoji,
    getRecentEmojis: (state) => state.recentEmojis
  };
  
  export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
  };