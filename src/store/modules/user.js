import axios from 'axios';
import { auth, database } from '@/plugins/firebase';
import { ref, set, update } from 'firebase/database';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';

const state = {
  user: null,
  loading: false,
  error: null,
  authInitialized: false,
  isVerified: false
}

const mutations = {
  setUser(state, user) {
    state.user = user
    state.isVerified = user ? user.emailVerified : false
  },
  setLoading(state, loading) {
    state.loading = loading
  },
  setError(state, error) {
    state.error = error
  },
  setAuthInitialized(state, initialized) {
    state.authInitialized = initialized
  }
}

const actions = {
  async fetchUsers({ commit }) {
    commit('setLoading', true);
    try {
      const response = await axios.get('https://forum-e06cc-default-rtdb.firebaseio.com/users.json');
      const users = response.data;
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },
  initAuth({ commit }) {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          commit('setUser', {
            email: user.email,
            uid: user.uid,
            emailVerified: user.emailVerified
          });
        } else {
          commit('setUser', null);
        }
        commit('setAuthInitialized', true);
        unsubscribe();
        resolve();
      });
    });
  },

  async registerUser({ commit }, { email, password }) {
    commit('setLoading', true);
    try {
      // Создаем пользователя в Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Получаем токен для аутентификации запросов
      const idToken = await getIdToken(user);

      // Отправляем письмо для верификации
      await sendEmailVerification(user);

      // Данные для сохранения
      const userData = {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'active'
      };

      // Сохраняем в Firebase Realtime Database
      await set(ref(database, `users/${user.uid}`), userData);

      // Также сохраняем через axios для надежности
      await axios.put(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${user.uid}.json?auth=${idToken}`,
        userData
      );

      commit('setUser', userData);
    } catch (error) {
      console.error('Registration error:', error);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },

  async loginUser({ commit, dispatch }, { email, password }) {
    commit('setLoading', true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Получаем токен для аутентификации запросов
      const idToken = await getIdToken(user);

      // Обновляем данные пользователя
      const updates = {
        lastLogin: new Date().toISOString(),
        emailVerified: user.emailVerified,
        status: 'online'
      };

      // Обновляем в Firebase Database
      const userRef = ref(database, `users/${user.uid}`);
      await update(userRef, updates);

      // Сохраняем токен и данные пользователя
      localStorage.setItem('userToken', idToken);
      commit('setUser', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });

      return user;

      // Если пользователь верифицирован, обновляем его роль
      if (user.emailVerified) {
        await dispatch('fetchUserRole');
      }
    } catch (error) {
      console.error('Login error:', error);
      commit('setError', error.message);
      throw error;
    } finally {
      commit('setLoading', false);
    }
  },
  async fetchUserRole({ commit, state }) {
    if (!state.user?.uid) return null;
    
    try {
      const idToken = await getIdToken(auth.currentUser);
      
      const response = await axios.get(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${state.user.uid}/role.json?auth=${idToken}`
      );
      
      if (response.data) {
        commit('setUser', {
          ...state.user,
          role: response.data
        });
        return response.data;
      }
      return 'user'; // Роль по умолчанию если не задана
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user'; // Роль по умолчанию при ошибке
    }
  },
  updateUser({ commit }, user) {
    commit('setUser', user);
  },
  clearUser({ commit }) {
    commit('setUser', null);
  }
}

const getters = {
  isAuthenticated: state => !!state.user,
  currentUser: state => state.user,
  isLoading: state => state.loading,
  error: state => state.error,
  isVerified: state => state.isVerified,
  hasFullAccess: state => state.user && state.isVerified
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
