import { applyActionCode, sendEmailVerification } from 'firebase/auth'
import { ref, set } from 'firebase/database'
import { auth, database } from '@/plugins/firebase'

const state = {
  loading: false,
  error: null,
  verificationStatus: 'pending',
  lastVerificationSent: null,
  cooldownPeriod: 60000 // 1 минута в миллисекундах
}

const getters = {
  isLoading: state => state.loading,
  error: state => state.error,
  verificationStatus: state => state.verificationStatus,
  canResendVerification: state => {
    if (!state.lastVerificationSent) return true
    const now = Date.now()
    return now - state.lastVerificationSent >= state.cooldownPeriod
  },
  timeUntilNextVerification: state => {
    if (!state.lastVerificationSent) return 0
    const now = Date.now()
    const timePassed = now - state.lastVerificationSent
    return Math.max(0, state.cooldownPeriod - timePassed)
  }
}

const actions = {
  async sendVerificationEmail({ commit, state }) {
    if (!auth.currentUser) {
      commit('setError', 'Пользователь не авторизован')
      return
    }

    if (!getters.canResendVerification(state)) {
      commit('setError', 'Пожалуйста, подождите перед повторной отправкой')
      return
    }

    commit('setLoading', true)
    commit('setError', null)

    try {
      await sendEmailVerification(auth.currentUser)
      commit('setLastVerificationSent', Date.now())
    } catch (error) {
      commit('setError', error.message)
    } finally {
      commit('setLoading', false)
    }
  },

  async verifyEmail({ commit }, oobCode) {
    commit('setLoading', true)
    commit('setError', null)

    try {
      await applyActionCode(auth, oobCode)
      
      // Перезагружаем пользователя для получения актуального статуса
      if (auth.currentUser) {
        await auth.currentUser.reload()
        
        if (auth.currentUser.emailVerified) {
          commit('setVerificationStatus', 'verified')
          
          // Обновляем статус в базе данных
          const userRef = ref(database, `users/${auth.currentUser.uid}`)
          await set(userRef, {
            emailVerified: true,
            verifiedAt: new Date().toISOString(),
            status: 'active'
          }, { merge: true })

          // Обновляем статус в localStorage
          localStorage.setItem('emailVerified', 'true')
          
          return true
        }
      }
      
      // Если код верификации применен, но статус не обновился или пользователь не найден
      throw new Error('Email не был подтвержден. Пожалуйста, попробуйте войти в систему заново.')
      
    } catch (error) {
      console.error('Ошибка верификации:', error)
      let errorMessage = 'Произошла ошибка при подтверждении email'
      
      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Ссылка подтверждения недействительна или уже была использована'
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage = 'Срок действия ссылки подтверждения истек'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Аккаунт пользователя отключен'
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Пользователь не найден'
      }
      
      commit('setError', errorMessage)
      commit('setVerificationStatus', 'failed')
      return false
    } finally {
      commit('setLoading', false)
    }
  },

  async checkVerificationStatus({ commit }) {
    if (!auth.currentUser) {
      commit('setError', 'Пользователь не авторизован')
      return false
    }

    commit('setLoading', true)
    
    try {
      // Перезагружаем пользователя для получения актуального статуса
      await auth.currentUser.reload()
      
      const isVerified = auth.currentUser.emailVerified
      
      if (isVerified) {
        commit('setVerificationStatus', 'verified')
        
        // Обновляем статус в базе данных
        const userRef = ref(database, `users/${auth.currentUser.uid}`)
        await set(userRef, {
          emailVerified: true,
          status: 'active'
        }, { merge: true })

        // Обновляем статус в localStorage
        localStorage.setItem('emailVerified', 'true')
        
        return true
      } else {
        commit('setVerificationStatus', 'pending')
        return false
      }
    } catch (error) {
      console.error('Ошибка проверки статуса верификации:', error)
      commit('setError', error.message)
      return false
    } finally {
      commit('setLoading', false)
    }
  }
}

const mutations = {
  setLoading(state, loading) {
    state.loading = loading
  },
  setError(state, error) {
    state.error = error
  },
  setVerificationStatus(state, status) {
    state.verificationStatus = status
  },
  setLastVerificationSent(state, timestamp) {
    state.lastVerificationSent = timestamp
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}