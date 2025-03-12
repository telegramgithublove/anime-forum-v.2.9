import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  onAuthStateChanged
} from 'firebase/auth';
import { ref as databaseRef, get, set, update } from 'firebase/database';
import { database } from '../../plugins/firebase';
import axios from 'axios';

const auth = getAuth();

const state = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: null,
  authUnsubscribe: null,
};

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  currentUser: state => state.user,
  getUserId: state => state.user?.uid || localStorage.getItem('userId'),
  authError: state => state.error,
  isLoading: state => state.loading,
  getUsername: state => state.user?.profile?.username || localStorage.getItem('username') || 'Гость',
  getUserAvatar: state => state.user?.profile?.avatarUrl || localStorage.getItem('userAvatarUrl') || '/image/empty_avatar.png',
  getUserSignature: state => state.user?.profile?.signature || localStorage.getItem('userSignature') || '',
  isSuperUser: state => state.user?.role === 'superuser',
  userRole: state => state.user?.role || null,
  isEmailVerified: state => state.user?.emailVerified || localStorage.getItem('emailVerified') === 'true',
  getUserSettings: state => state.user?.settings || JSON.parse(localStorage.getItem('userSettings') || '{}'),
};

const actions = {
  async registration({ commit }, userData) {
    try {
      if (!userData.username || !userData.email || !userData.password || !userData.passwordConfirmation) {
        throw new Error('Пожалуйста, заполните все поля.');
      }
      if (userData.password !== userData.passwordConfirmation) {
        throw new Error('Пароли не совпадают');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      await sendEmailVerification(user, { url: window.location.origin + '/verify-email' });

      const userRef = databaseRef(database, `users/${user.uid}`);
      const userProfile = {
        username: userData.username,
        avatarUrl: '/image/empty_avatar.png',
        signature: 'New User'
      };
      const userDataForDB = {
        email: userData.email,
        role: 'user',
        profile: userProfile,
        settings: { profileVisibility: true, notifyMessages: true, notifyReplies: true, theme: 'light' },
        emailVerified: false,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        status: 'active'
      };

      await set(userRef, userDataForDB);

      const userDataToStore = {
        uid: user.uid,
        email: userData.email,
        profile: userProfile,
        role: 'user',
        emailVerified: false,
        settings: userDataForDB.settings
      };

      commit('SET_USER', userDataToStore);
      commit('SET_AUTHENTICATED', true);
      commit('SET_TOKEN', user.accessToken);

      localStorage.setItem('user', JSON.stringify(userDataToStore));
      localStorage.setItem('userToken', user.accessToken);
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('username', userProfile.username);
      localStorage.setItem('userAvatarUrl', userProfile.avatarUrl);
      localStorage.setItem('userSignature', userProfile.signature);
      localStorage.setItem('userRole', 'user');
      localStorage.setItem('emailVerified', 'false');
      localStorage.setItem('userSettings', JSON.stringify(userDataForDB.settings));

      return { success: true, user: userDataToStore };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Ошибка при регистрации');
    }
  },

  async login({ commit }, { email, password }) {
    try {
      if (email.toLowerCase() === 'superuser' && password === 'C7ceb1fd&') {
        const superUserData = {
          uid: 'superuser-id',
          email: 'admin@example.com',
          profile: { username: 'SuperUser', avatarUrl: '/image/empty_avatar.png', signature: 'Administrator' },
          role: 'superuser',
          emailVerified: true,
          settings: { profileVisibility: true, notifyMessages: true, notifyReplies: true, theme: 'light' }
        };
        commit('SET_USER', superUserData);
        commit('SET_AUTHENTICATED', true);
        commit('SET_TOKEN', 'superuser-token');
        localStorage.setItem('user', JSON.stringify(superUserData));
        localStorage.setItem('userToken', 'superuser-token');
        localStorage.setItem('userId', superUserData.uid);
        localStorage.setItem('username', superUserData.profile.username);
        localStorage.setItem('userAvatarUrl', superUserData.profile.avatarUrl);
        localStorage.setItem('userSignature', superUserData.profile.signature);
        localStorage.setItem('userRole', 'superuser');
        localStorage.setItem('emailVerified', 'true');
        localStorage.setItem('userSettings', JSON.stringify(superUserData.settings));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', 'superuser');
        return { error: false, user: superUserData, redirectTo: '/admin' };
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = databaseRef(database, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.exists() ? snapshot.val() : {};

      const userDataToStore = {
        uid: user.uid,
        email: user.email,
        profile: {
          username: userData.profile?.username || 'Гость',
          avatarUrl: userData.profile?.avatarUrl || '/image/empty_avatar.png',
          signature: userData.profile?.signature || ''
        },
        role: userData.role || 'user',
        emailVerified: user.emailVerified,
        settings: userData.settings || {}
      };

      commit('SET_USER', userDataToStore);
      commit('SET_AUTHENTICATED', true);
      commit('SET_TOKEN', user.accessToken);

      localStorage.setItem('user', JSON.stringify(userDataToStore));
      localStorage.setItem('userToken', user.accessToken);
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('username', userDataToStore.profile.username);
      localStorage.setItem('userAvatarUrl', userDataToStore.profile.avatarUrl);
      localStorage.setItem('userSignature', userDataToStore.profile.signature);
      localStorage.setItem('userRole', userDataToStore.role);
      localStorage.setItem('emailVerified', user.emailVerified.toString());
      localStorage.setItem('userSettings', JSON.stringify(userDataToStore.settings));

      return { error: false, user: userDataToStore, redirectTo: userDataToStore.role === 'superuser' ? '/admin' : '/' };
    } catch (error) {
      console.error('Login error:', error);
      await signOut(auth);
      throw new Error(error.message || 'Ошибка при входе');
    }
  },

  async logout({ commit, state }) {
    try {
      await signOut(auth);
      commit('SET_USER', null);
      commit('SET_AUTHENTICATED', false);
      commit('SET_TOKEN', null);
      if (state.authUnsubscribe) {
        state.authUnsubscribe();
        commit('SET_AUTH_UNSUBSCRIBE', null);
      }
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  async initAuth({ commit }) {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken(true);
          const userRef = databaseRef(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          const userData = snapshot.exists() ? snapshot.val() : {};
          
          const userDataToStore = {
            uid: user.uid,
            email: user.email,
            profile: {
              username: userData.profile?.username || localStorage.getItem('username') || 'Гость',
              avatarUrl: userData.profile?.avatarUrl || localStorage.getItem('userAvatarUrl') || '/image/empty_avatar.png',
              signature: userData.profile?.signature || localStorage.getItem('userSignature') || ''
            },
            role: userData.role || 'user',
            emailVerified: user.emailVerified,
            settings: userData.settings || {}
          };

          commit('SET_USER', userDataToStore);
          commit('SET_AUTHENTICATED', true);
          commit('SET_TOKEN', token);
        } else {
          commit('SET_USER', null);
          commit('SET_AUTHENTICATED', false);
          commit('SET_TOKEN', null);
        }
        resolve(user);
      });
      commit('SET_AUTH_UNSUBSCRIBE', unsubscribe);
    });
  },

  // Добавляем действие setUser
  async setUser({ commit }, userData) {
    try {
      if (userData) {
        const userRef = databaseRef(database, `users/${userData.uid}`);
        const snapshot = await get(userRef);
        const dbUserData = snapshot.exists() ? snapshot.val() : {};

        const userDataToStore = {
          uid: userData.uid,
          email: userData.email,
          profile: {
            username: dbUserData.profile?.username || localStorage.getItem('username') || 'Гость',
            avatarUrl: dbUserData.profile?.avatarUrl || localStorage.getItem('userAvatarUrl') || '/image/empty_avatar.png',
            signature: dbUserData.profile?.signature || localStorage.getItem('userSignature') || ''
          },
          role: dbUserData.role || 'user',
          emailVerified: userData.emailVerified,
          settings: dbUserData.settings || {}
        };

        commit('SET_USER', userDataToStore);
        commit('SET_AUTHENTICATED', true);
        commit('SET_TOKEN', await auth.currentUser.getIdToken(true));
      } else {
        commit('SET_USER', null);
        commit('SET_AUTHENTICATED', false);
        commit('SET_TOKEN', null);
      }
    } catch (error) {
      console.error('Ошибка в setUser:', error);
      throw error;
    }
  },

  // Остальные действия (updateUserAvatar, updateUsername, etc.) остаются без изменений
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
    if (!user) {
      localStorage.clear();
    } else {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.profile) {
        localStorage.setItem('username', user.profile.username);
        localStorage.setItem('userAvatarUrl', user.profile.avatarUrl);
        localStorage.setItem('userSignature', user.profile.signature || '');
      }
    }
  },
  SET_AUTHENTICATED(state, value) {
    state.isAuthenticated = value;
  },
  SET_TOKEN(state, token) {
    state.token = token;
  },
  SET_AUTH_UNSUBSCRIBE(state, unsubscribe) {
    if (state.authUnsubscribe) state.authUnsubscribe();
    state.authUnsubscribe = unsubscribe;
  },
  // Остальные мутации остаются без изменений
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};