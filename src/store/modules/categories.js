import { getDatabase, ref as dbRef, get, set, update, remove } from 'firebase/database'

const state = {
  categories: [],
  loading: false,
  error: null,
  currentCategory: null
}

const getters = {
  getAllCategories: state => state.categories,
  getCategoryById: state => id => state.categories.find(cat => cat.id === id),
  isLoading: state => state.loading,
  getError: state => state.error,
  getCurrentCategory: state => state.currentCategory
}

const actions = {
  // Загрузка всех категорий
  async fetchCategories({ commit }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const db = getDatabase()
      const categoriesRef = dbRef(db, 'categories')
      const snapshot = await get(categoriesRef)

      if (snapshot.exists()) {
        const categoriesData = snapshot.val()
        const categoriesArray = Object.entries(categoriesData).map(([id, data]) => ({
          id,
          ...data
        }))
        commit('SET_CATEGORIES', categoriesArray)
      } else {
        // Если категорий нет, создаем базовые
        const defaultCategories = {
          'anime-discussions': {
            name: 'Обсуждение аниме',
            description: 'Общие обсуждения аниме и манги',
            order: 1,
            icon: '🎬'
          },
          'news': {
            name: 'Новости',
            description: 'Новости аниме индустрии',
            order: 2,
            icon: '📰'
          },
          'recommendations': {
            name: 'Рекомендации',
            description: 'Рекомендации аниме и манги',
            order: 3,
            icon: '👍'
          }
        }

        await set(categoriesRef, defaultCategories)
        const categoriesArray = Object.entries(defaultCategories).map(([id, data]) => ({
          id,
          ...data
        }))
        commit('SET_CATEGORIES', categoriesArray)
      }
    } catch (error) {
      console.error('Categories: Ошибка при загрузке категорий:', error)
      commit('SET_ERROR', error.message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Загрузка одной категории по ID
  async fetchCategory({ commit, state }, categoryId) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      // Сначала проверяем, есть ли категория уже в state
      const existingCategory = state.categories.find(cat => cat.id === categoryId)
      if (existingCategory) {
        commit('SET_CURRENT_CATEGORY', existingCategory)
        commit('SET_LOADING', false)
        return existingCategory
      }

      // Если нет, загружаем из базы данных
      const db = getDatabase()
      const categoryRef = dbRef(db, `categories/${categoryId}`)
      const snapshot = await get(categoryRef)

      if (snapshot.exists()) {
        const categoryData = snapshot.val()
        const category = {
          id: categoryId,
          ...categoryData
        }
        commit('SET_CURRENT_CATEGORY', category)
        return category
      } else {
        commit('SET_ERROR', 'Категория не найдена')
        return null
      }
    } catch (error) {
      console.error('Categories: Ошибка при загрузке категории:', error)
      commit('SET_ERROR', error.message)
      return null
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Создание новой категории
  async createCategory({ commit }, categoryData) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const db = getDatabase()
      const categoriesRef = dbRef(db, 'categories')
      const newCategoryRef = dbRef(db, `categories/${categoryData.id}`)
      
      const categoryWithTimestamp = {
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await set(newCategoryRef, categoryWithTimestamp)
      commit('ADD_CATEGORY', { id: categoryData.id, ...categoryWithTimestamp })
    } catch (error) {
      console.error('Categories: Ошибка при создании категории:', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Обновление категории
  async updateCategory({ commit }, { id, data }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const db = getDatabase()
      const categoryRef = dbRef(db, `categories/${id}`)
      
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString()
      }

      await update(categoryRef, updatedData)
      commit('UPDATE_CATEGORY', { id, ...updatedData })
    } catch (error) {
      console.error('Categories: Ошибка при обновлении категории:', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Удаление категории
  async deleteCategory({ commit }, id) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)

    try {
      const db = getDatabase()
      const categoryRef = dbRef(db, `categories/${id}`)
      await remove(categoryRef)
      commit('REMOVE_CATEGORY', id)
    } catch (error) {
      console.error('Categories: Ошибка при удалении категории:', error)
      commit('SET_ERROR', error.message)
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  // Установка текущей категории
  setCurrentCategory({ commit }, category) {
    commit('SET_CURRENT_CATEGORY', category)
  }
}

const mutations = {
  SET_CATEGORIES(state, categories) {
    state.categories = categories
  },
  ADD_CATEGORY(state, category) {
    state.categories.push(category)
  },
  UPDATE_CATEGORY(state, updatedCategory) {
    const index = state.categories.findIndex(cat => cat.id === updatedCategory.id)
    if (index !== -1) {
      state.categories.splice(index, 1, updatedCategory)
    }
  },
  REMOVE_CATEGORY(state, id) {
    state.categories = state.categories.filter(cat => cat.id !== id)
  },
  SET_CURRENT_CATEGORY(state, category) {
    state.currentCategory = category
  },
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
