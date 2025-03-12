import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const state = {
  topics: [],
  categorys: [],
  topicAuthor: null,
  currentTopic: null,
  posts: [],
  picture: '',
  commentLikes: {}, // количество лайков для комментариев
  userLikes: {}, // отслеживание лайков пользователей (commentId -> Set of userIds)
  draftTopic: {
    title: '',
    content: '',
    categoryId: null,
    pictureBase64: null
  },
  loading: false,
  error: null
};

const actions = {
  // Загрузка тем по категории
  async fetchTopicsByCategory({ commit }, categoryId) {
    try {
      console.log('Загрузка тем для категории:', categoryId);
      const response = await axios.get(
        `https://forum-e06cc-default-rtdb.firebaseio.com/categories/${categoryId}/topics.json`
      );
      console.log('Полученные данные:', response.data);
      const topics = response.data || {};
      const topicsArray = Object.entries(topics).map(([id, topic]) => ({
        id,
        ...topic,
        categoryId // добавляем categoryId к каждому топику
      }));
      console.log('Преобразованные топики:', topicsArray);
      commit('SET_TOPICS', topicsArray);
      return topicsArray;
    } catch (error) {
      console.error('Ошибка при загрузке тем:', error);
      throw error;
    }
  },

  // Загрузка темы по ID
  async fetchTopicById({ commit }, topicId) {
    try {
      console.log('Загрузка темы по ID:', topicId);
      const response = await axios.get(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/topics/${topicId}.json`
      );
      
      console.log('Ответ от Firebase:', response);
      
      if (!response.data) {
        console.error('Тема не найдена');
        return null;
      }
      
      const topic = { id: topicId, ...response.data };
      console.log('Загруженная тема:', topic);
      
      commit('SET_CURRENT_TOPIC', topic);
      return topic;
    } catch (error) {
      console.error('Ошибка при загрузке темы:', error);
      throw error;
    }
  },

  // Добавление новой темы
  async addTopic({ commit, dispatch }, topicData) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.uid) {
      throw new Error('Пользователь не авторизован');
    }

    if (!topicData.categoryId) {
      throw new Error('Не указана категория для темы');
    }

    let pictureUrl = '';

    // Проверяем, есть ли картинка
    if (topicData.picture) {
      try {
        // Используем централизованную логику загрузки из media.js
        pictureUrl = await dispatch('media/uploadPicture', {
          userId: user.uid,
          pictureFile: topicData.picture
        }, { root: true });
      } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        throw error;
      }
    }

    const newTopic = {
      title: topicData.title,
      content: topicData.content,
      createdAt: new Date().toISOString(),
      username: user.username || user.email,
      userId: user.uid,
      categoryId: topicData.categoryId,
      picture: pictureUrl || '' // Используем пустую строку если нет URL
    };

    console.log('Отправляем тему на сервер:', newTopic);

    try {
      // Сначала создаем топик
      const response = await axios.post(
        `https://forum-e06cc-default-rtdb.firebaseio.com/topics.json`,
        newTopic
      );
      
      console.log('Ответ от Firebase:', response);
      console.log('Данные ответа:', response.data);

      if (!response.data || !response.data.name) {
        console.error('Неверный формат ответа от Firebase:', response);
        throw new Error('Не удалось получить ID созданной темы');
      }

      const topicId = response.data.name;
      console.log('Полученный ID темы:', topicId);

      const topicWithId = { id: topicId, ...newTopic };

      // Затем добавляем ссылку на него в категорию
      await axios.put(
        `https://forum-e06cc-default-rtdb.firebaseio.com/categories/${topicData.categoryId}/topics/${topicId}.json`,
        topicWithId
      );

      // Сохраняем в store
      commit('ADD_TOPIC', topicWithId);
      commit('SET_CURRENT_TOPIC', topicWithId);

      return topicWithId;
    } catch (error) {
      console.error('Подробная ошибка при добавлении темы:', error);
      console.error('Статус ответа:', error.response?.status);
      console.error('Данные ошибки:', error.response?.data);
      throw error;
    }
  },

  // Обновление лайков на сервере для темы
  async updateTopicLikes({ commit }, { topicId, likes }) {
    try {
      const response = await axios.patch(`http://95.164.90.115:3000/topics/${topicId}`, { likes });
      if (response.data) {
        commit('updateTopicLikes', { topicId, likes });
      }
    } catch (error) {
      console.error('Ошибка при обновлении количества лайков на сервере:', error);
    }
  },

  // Загрузка изображений и возврат URL для хранения в постах
  async handleImageUpload(_, imageFile) {
    try {
      const storageRef = ref(storage, `images/${imageFile.name}-${Date.now()}`);
      await uploadBytes(storageRef, imageFile);
      return await getDownloadURL(storageRef); // URL загруженного изображения
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      throw error;
    }
  },

  // Добавление нового поста
  async addPost({ commit, dispatch }, postData) {
    try {
      let pictureUrl = '';
      if (postData.picture instanceof File) {
        pictureUrl = await dispatch('handleImageUpload', postData.picture);
      } else {
        pictureUrl = postData.picture; // Если URL уже есть, используем его напрямую
      }

      // Добавляем новый пост в Firestore
      const docRef = await addDoc(collection(db, 'posts'), {
        title: postData.title,
        content: postData.content,
        categoryId: postData.categoryId,
        picture: pictureUrl, // Ссылка на изображение
        createdAt: new Date(),
      });

      const newPost = { id: docRef.id, ...postData, picture: pictureUrl, createdAt: new Date() };
      commit('addPost', newPost);
      return { id: docRef.id };
    } catch (error) {
      console.error('Ошибка при добавлении поста:', error);
      throw error;
    }
  },

  // Получение всех постов
  async fetchPosts({ commit }) {
    try {
      const querySnapshot = await getDocs(collection(db, 'posts'));
      const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      commit('setPosts', posts);
    } catch (error) {
      console.error('Ошибка при получении постов:', error);
    }
  },

  // Получение поста по ID
  async fetchPostById({ commit }, postId) {
    try {
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        commit('SET_POST', { id: postId, ...docSnap.data() });
      } else {
        console.error('Пост не найден');
      }
    } catch (error) {
      console.error('Ошибка при получении поста по ID:', error);
    }
  },

  // Редактирование поста
  async editPost({ commit }, { postId, updatedPost }) {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, updatedPost);
      commit('updatePost', { id: postId, updatedPost });
    } catch (error) {
      console.error('Ошибка при редактировании поста:', error);
    }
  },

  // Удаление поста
  async deletePost({ commit }, postId) {
    try {
      const docRef = doc(db, 'posts', postId);
      await deleteDoc(docRef);
      commit('deletePost', postId);
    } catch (error) {
      console.error('Ошибка при удалении поста:', error);
    }
  },

  // Сохранение черновика темы
  saveDraftTopic({ commit }, draftData) {
    commit('SET_DRAFT_TOPIC', draftData);
  },

  // Очистка черновика
  clearDraftTopic({ commit }) {
    commit('CLEAR_DRAFT_TOPIC');
  },

  // Загрузка черновика при инициализации
  loadDraftTopic({ commit }) {
    const savedDraft = localStorage.getItem('draftTopic');
    if (savedDraft) {
      commit('SET_DRAFT_TOPIC', JSON.parse(savedDraft));
    }
  },

  // Увеличение счетчика лайков комментария
  async incrementCommentLike({ commit, state }, { commentId, userId }) {
    try {
      // Проверяем, не лайкнул ли уже пользователь этот комментарий
      if (state.userLikes[commentId]?.includes(userId)) {
        throw new Error('Вы уже поставили лайк этому комментарию');
      }

      // Получаем токен пользователя
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      
      const currentLikes = state.commentLikes[commentId] || 0;
      const newLikes = currentLikes + 1;
      
      // Сохраняем информацию о лайке пользователя
      const currentUserLikes = state.userLikes[commentId] || [];
      
      // Обновляем в базе данных с токеном
      await axios.put(
        `https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app/commentLikes/${commentId}.json?auth=${token}`,
        {
          count: newLikes,
          users: [...currentUserLikes, userId]
        }
      );
      
      commit('SET_COMMENT_LIKES', { commentId, count: newLikes });
      commit('ADD_USER_LIKE', { commentId, userId });
      return newLikes;
    } catch (error) {
      console.error('Ошибка при обновлении лайков:', error);
      throw error;
    }
  },

  // Загрузка количества лайков комментария
  async fetchCommentLikes({ commit }, commentId) {
    try {
      // Получаем токен пользователя
      const auth = getAuth();
      let url = `https://forum-e06cc-default-rtdb.firebaseio.com/commentLikes/${commentId}.json`;
      
      // Добавляем токен только если пользователь авторизован
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        url += `?auth=${token}`;
      }
      
      const response = await axios.get(url);
      if (response.data) {
        commit('SET_COMMENT_LIKES', { commentId, count: response.data.count || 0 });
        commit('SET_USER_LIKES', { commentId, users: response.data.users || [] });
      }
      return response.data?.count || 0;
    } catch (error) {
      console.error('Ошибка при загрузке лайков:', error);
      throw error;
    }
  }
};

const mutations = {
  SET_TOPICS(state, topics) {
    state.topics = topics;
  },
  SET_CURRENT_TOPIC(state, topic) {
    state.currentTopic = topic;
  },
  ADD_TOPIC(state, topic) {
    state.topics.push(topic);
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  updateTopicLikes(state, { topicId, likes }) {
    const topic = state.topics.find(t => t.id === topicId);
    if (topic) {
      topic.likes = likes;
    }
  },
  setPosts(state, posts) {
    state.posts = posts;
  },
  addPost(state, post) {
    state.posts.push(post);
  },
  updatePost(state, { id, updatedPost }) {
    const index = state.posts.findIndex(post => post.id === id);
    if (index !== -1) {
      state.posts[index] = { ...state.posts[index], ...updatedPost };
    }
  },
  deletePost(state, id) {
    state.posts = state.posts.filter(post => post.id !== id);
  },
  SET_POST(state, post) {
    const index = state.posts.findIndex(p => p.id === post.id);
    if (index === -1) {
      state.posts.push(post);
    } else {
      state.posts[index] = post;
    }
  },
  SET_DRAFT_TOPIC(state, draft) {
    state.draftTopic = { ...state.draftTopic, ...draft };
    // Сохраняем черновик в localStorage
    localStorage.setItem('draftTopic', JSON.stringify(state.draftTopic));
  },
  
  CLEAR_DRAFT_TOPIC(state) {
    state.draftTopic = {
      title: '',
      content: '',
      categoryId: null,
      pictureBase64: null
    };
    localStorage.removeItem('draftTopic');
  },
  SET_COMMENT_LIKES(state, { commentId, count }) {
    state.commentLikes[commentId] = count;
  },
  
  SET_USER_LIKES(state, { commentId, users }) {
    state.userLikes[commentId] = users;
  },
  
  ADD_USER_LIKE(state, { commentId, userId }) {
    if (!state.userLikes[commentId]) {
      state.userLikes[commentId] = [];
    }
    state.userLikes[commentId].push(userId);
  }
};

const getters = {
  getTopicById: (state) => (id) => {
    return state.topics.find(topic => topic.id === id);
  },
  getCurrentTopic: (state) => state.currentTopic,
  isLoading: (state) => state.loading,
  getError: (state) => state.error,
  getTopics: (state) => state.topics,
  topicsByCategory: (state) => (categoryId) => {
    return state.topics.filter(topic => topic.categoryId === categoryId);
  },
  getPostsByCategory: (state) => (categoryId) => {
    return state.posts.filter(post => post.categoryId === categoryId);
  },
  getDraftTopic: (state) => state.draftTopic,
  currentTopic: (state) => state.currentTopic,
  // Получить количество лайков комментария
  getCommentLikes: (state) => (commentId) => {
    return state.commentLikes[commentId] || 0;
  },
  
  // Проверить, лайкнул ли пользователь комментарий
  hasUserLikedComment: (state) => (commentId, userId) => {
    return state.userLikes[commentId]?.includes(userId) || false;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};