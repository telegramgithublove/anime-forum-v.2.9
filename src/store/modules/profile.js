import axios from 'axios';
import { ref as databaseRef, set } from 'firebase/database';
import { database } from '../../plugins/firebase';

const state = {
  profile: {
    username: '',
    avatarUrl: '',
    signature: '',
    settings: {
      profileVisibility: true,
      notifyMessages: true,
      notifyReplies: true,
    },
    messages: [''],
    notices: [''],
    mytopics: [''],
    favorites: [''],
    subscriptions: [''],
    exit: { lastLogout: null },
  },
};

const mutations = {
  SET_PROFILE(state, profile) {
    state.profile = profile;
  },
  UPDATE_PROFILE(state, profileData) {
    state.profile = { ...state.profile, ...profileData };
  },
  UPDATE_USERNAME(state, username) {
    state.profile.username = username;
  },
  UPDATE_AVATAR(state, avatarUrl) {
    state.profile.avatarUrl = avatarUrl;
  },
  UPDATE_SIGNATURE(state, signature) {
    state.profile.signature = signature;
  },
};

const actions = {
  async fetchProfile({ commit }, userId) {
    try {
      const response = await axios.get(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/users/${userId}/profile.json`
      );
      
      if (response.data) {
        // Если в профиле есть avatarUrl, убедимся что он использует правильный домен
        if (response.data.avatarUrl) {
          response.data.avatarUrl = response.data.avatarUrl.replace(
            'http://localhost:3000',
            'http://95.164.90.115:3000'
          );
        }
        commit('SET_PROFILE', response.data);
      }
    } catch (error) {
      console.error('Ошибка при получении профиля:', error);
      throw error;
    }
  },

  async updateUsername({ commit, state }, { userId, username }) {
    try {
      // Проверка на пустое значение
      if (!username.trim()) {
        throw new Error('Имя пользователя не может быть пустым');
      }

      // Сохраняем в Firebase
      const userRef = databaseRef(database, `users/${userId}/profile`);
      await set(userRef, {
        ...state.profile,
        username: username
      });

      // Обновляем в state
      commit('UPDATE_USERNAME', username);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при обновлении имени пользователя:', error);
      throw error;
    }
  },

  async compressImage({ commit }, file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Вычисляем новые размеры, сохраняя пропорции
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Конвертируем canvas в blob
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }));
            },
            'image/jpeg',
            quality
          );
        };
      };
    });
  },

  async updateAvatar({ commit, dispatch }, { userId, avatarFile }) {
    try {
      console.log('Начинаем обработку аватара для пользователя:', userId);
      
      // Сжимаем изображение перед загрузкой
      const compressedFile = await dispatch('compressImage', avatarFile);
      
      // Создаём FormData объект для загрузки сжатого аватара
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('isAvatar', 'true'); // Указываем, что это аватар
      
      console.log('Отправляем сжатое изображение на сервер...');
      // Загружаем аватар через Wasabi
      const uploadResponse = await axios.post('http://95.164.90.115:3000/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
      });

      console.log('Получен ответ от сервера:', uploadResponse.data);

      if (uploadResponse.data && uploadResponse.data.fileUrl) {
        console.log('Получен URL изображения:', uploadResponse.data.fileUrl);
        
        // Обновляем URL аватара в Firebase
        const userRef = databaseRef(database, `users/${userId}/profile`);
        await set(userRef, {
          ...state.profile,
          avatarUrl: uploadResponse.data.fileUrl
        });

        // Обновляем URL в локальном хранилище
        localStorage.setItem('userAvatarUrl', uploadResponse.data.fileUrl);

        // Обновляем state через мутацию
        commit('UPDATE_AVATAR', uploadResponse.data.fileUrl);
        
        return {
          success: true,
          avatarUrl: uploadResponse.data.fileUrl
        };
      } else {
        throw new Error('Не удалось получить URL загруженного изображения');
      }
    } catch (error) {
      console.error('Ошибка при обновлении аватара:', error);
      throw error;
    }
  },

  async updateSignature({ commit }, { userId, signature }) {
    try {
      const signatureRef = databaseRef(database, `users/${userId}/profile/signature`);
      await set(signatureRef, signature);
  
      commit('UPDATE_SIGNATURE', signature);
      console.log('Подпись успешно обновлена:', signature);
    } catch (error) {
      console.error('Ошибка при обновлении подписи:', error.message);
      throw new Error('Не удалось обновить подпись. Пожалуйста, попробуйте еще раз.');
    }
  },

  async updateProfile({ commit, dispatch }, { userId, profileData }) {
    try {
      const response = await axios.patch(
        `https://forum-e06cc-default-rtdb.firebaseio.com/users/${userId}/profile.json`,
        profileData
      );

      if (response.data) {
        // Обновляем локальный профиль
        commit('UPDATE_PROFILE', profileData);
        
        // Синхронизируем данные с auth store
        if (profileData.username) {
          await dispatch('auth/updateUserUsername', profileData.username, { root: true });
        }
        if (profileData.avatarUrl) {
          await dispatch('auth/updateUserAvatar', profileData.avatarUrl, { root: true });
        }

        return response.data;
      } else {
        throw new Error('Ошибка при обновлении профиля');
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      throw error;
    }
  },
};

const getters = {
  getProfile: state => state.profile,
  userAvatar: state => {
    if (!state.profile.avatarUrl) return '/image/empty_avatar.png';
    // Всегда возвращаем полный URL с правильным доменом
    const baseUrl = 'http://95.164.90.115:3000';
    if (state.profile.avatarUrl.startsWith('http')) {
      return state.profile.avatarUrl.replace('http://localhost:3000', baseUrl);
    }
    return `${baseUrl}${state.profile.avatarUrl}`;
  },
  username: state => state.profile.username || 'Гость',
  signature: state => state.profile.signature || '',
  getAvatarUrl: state => {
    if (!state.profile.avatarUrl) return '/image/empty_avatar.png';
    const baseUrl = 'http://95.164.90.115:3000';
    if (state.profile.avatarUrl.startsWith('http')) {
      return state.profile.avatarUrl.replace('http://localhost:3000', baseUrl);
    }
    return `${baseUrl}${state.profile.avatarUrl}`;
  },
  getSignature: state => state.profile.signature
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};