import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref as databaseRef, push, set, get, child, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { database } from '../../plugins/firebase';

const state = {
  topics: [],
  categorys: [],
  topicAuthor: null,
  currentTopic: null,
  posts: [],
  picture: '',
  draftTopic: {
    title: '',
    content: '',
    categoryId: null,
    pictureBase64: null
  },
  replies: {},  // Добавляем состояние для ответов
  loading: false,
  error: null
};

const actions = {
  // Загрузка тем по категории
  async fetchTopicsByCategory({ commit, dispatch }, categoryId) {
    try {
      console.log('topics/fetchTopicsByCategory - Загрузка постов категории:', categoryId);
      
      // Получаем посты категории
      const postsRef = databaseRef(database, `categories/${categoryId}/posts`);
      const snapshot = await get(postsRef);
      
      if (snapshot.exists()) {
        const posts = [];
        const postsData = snapshot.val();
        
        // Обрабатываем каждый пост
        for (const [postId, post] of Object.entries(postsData)) {
          // Если у поста есть изображения, загружаем их
          if (post.hasImages) {
            console.log('topics/fetchTopicsByCategory - Загрузка изображений для поста:', postId);
            const images = await dispatch('picture/fetchPostImages', postId, { root: true });
            post.images = images;
          }
          
          posts.push({ id: postId, ...post });
        }
        
        // Сортируем посты по дате создания (новые сверху)
        posts.sort((a, b) => b.createdAt - a.createdAt);
        
        commit('SET_TOPICS', posts);
        console.log('topics/fetchTopicsByCategory - Посты загружены:', posts);
        return posts;
      }
      
      return [];
    } catch (error) {
      console.error('topics/fetchTopicsByCategory - Ошибка загрузки постов:', error);
      throw new Error('Не удалось загрузить посты');
    }
  },

  // Загрузка темы по ID
  async fetchTopicById({ commit }, topicId) {
    console.log('=== НАЧАЛО ЗАГРУЗКИ ТЕМЫ ===');
    console.log('ID темы:', topicId);
    
    try {
      console.log('Создание ссылки на тему в базе данных...');
      const topicRef = databaseRef(database, `topics/${topicId}`);
      console.log('Ссылка создана:', topicRef.toString());
      
      console.log('Получение данных темы...');
      const topicSnapshot = await get(topicRef);
      console.log('Получен снапшот:', {
        exists: topicSnapshot.exists(),
        key: topicSnapshot.key
      });
      
      if (!topicSnapshot.exists()) {
        console.log('Тема не найдена в /topics');
        return null;
      }
      
      const topicData = topicSnapshot.val();
      console.log('Данные темы:', topicData);
      
      const topic = { id: topicId, ...topicData };
      console.log('Подготовленный объект темы:', topic);
      
      commit('SET_CURRENT_TOPIC', topic);
      console.log('Тема установлена в store');
      
      console.log('=== КОНЕЦ ЗАГРУЗКИ ТЕМЫ ===');
      return topic;
    } catch (error) {
      console.error('Подробная ошибка при загрузке темы:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  },

  // Добавление новой темы
  async addTopic({ commit }, topicData) {
    console.log('=== НАЧАЛО ДОБАВЛЕНИЯ ТЕМЫ ===');
    console.log('Данные темы:', topicData);
    
    try {
      // Создаем ссылку на темы в категории
      const topicsRef = databaseRef(database, `categories/${topicData.categoryId}/topics`);
      const newTopicRef = push(topicsRef);
      const topicId = newTopicRef.key;

      if (!topicId) {
        throw new Error('Не удалось создать ID для темы');
      }

      // Добавляем дополнительные поля
      const topicWithId = {
        id: topicId,
        ...topicData,
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        isPinned: false,
        lastActivity: new Date().toISOString()
      };

      // Сохраняем тему в базу данных
      await set(newTopicRef, topicWithId);
      console.log('Тема сохранена в базу данных:', topicWithId);

      // Добавляем тему в store
      commit('ADD_TOPIC', topicWithId);
      console.log('Тема добавлена в store');

      return topicWithId;
    } catch (error) {
      console.error('Ошибка при добавлении темы:', error);
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
 
  // Добавление нового поста
  async addPost({ commit, rootState }, { title, content, categoryId, images, videos, audio }) {
    try {
      console.log('Создание нового поста:', { title, content, categoryId });
      
      // Получаем текущего пользователя
      const user = rootState.auth.user;
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      // Создаем новый пост
      const post = {
        title,
        content,
        categoryId,
        authorId: user.uid,
        authorName: user.displayName || 'Аноним',
        authorAvatar: user.photoURL || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        views: 0,
        comments: [],
        images: images || [],
        videos: videos || [],
        audio: audio || [] // Добавляем поддержку аудио файлов
      };

      // Сохраняем пост в базу данных
      const postsRef = databaseRef(database, 'posts');
      const newPostRef = push(postsRef);
      const postId = newPostRef.key;
      
      await set(newPostRef, post);
      
      // Если есть изображения, сохраняем их связь с постом
      if (images && images.length > 0) {
        await dispatch('picture/savePostImages', { postId, images }, { root: true });
      }

      // Если есть видео, сохраняем их связь с постом
      if (videos && videos.length > 0) {
        await dispatch('video/savePostVideos', { postId, videos }, { root: true });
      }

      // Если есть аудио, сохраняем их связь с постом
      if (audio && audio.length > 0) {
        await dispatch('music/savePostAudio', { postId, audioFiles: audio }, { root: true });
      }

      console.log('Пост успешно создан:', postId);
      return { success: true, postId };
    } catch (error) {
      console.error('Ошибка при создании поста:', error);
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
  async fetchPostById({ commit, dispatch }, postId) {
    try {
      console.log('topics/fetchPostById - Загрузка поста:', postId);
      
      const postRef = databaseRef(database, `posts/${postId}`);
      const snapshot = await get(postRef);

      if (snapshot.exists()) {
        const post = snapshot.val();
        
        // Если у поста есть изображения, загружаем их
        if (post.hasImages) {
          console.log('topics/fetchPostById - Загрузка изображений поста');
          const images = await dispatch('picture/fetchPostImages', postId, { root: true });
          post.images = images;
        }

        commit('SET_POST', { ...post, id: postId });
        return post;
      }

      return null;
    } catch (error) {
      console.error('topics/fetchPostById - Ошибка загрузки поста:', error);
      throw error;
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
  // Увеличение счетчика просмотров темы
  async incrementViews({ commit }, topicId) {
    try {
      const topicRef = databaseRef(database, `topics/${topicId}`);
      const snapshot = await get(topicRef);
      
      if (snapshot.exists()) {
        const topic = snapshot.val();
        const updatedViews = (topic.views || 0) + 1;
        
        await set(child(topicRef, 'views'), updatedViews);
        commit('UPDATE_TOPIC_VIEWS', { topicId, views: updatedViews });
      }
    } catch (error) {
      console.error('Ошибка при обновлении просмотров:', error);
      throw error;
    }
  },
  // Закрепление/открепление темы
  async togglePinTopic({ commit }, { topicId, isPinned }) {
    try {
      const topicRef = databaseRef(database, `topics/${topicId}`);
      await set(child(topicRef, 'isPinned'), isPinned);
      commit('UPDATE_TOPIC_PIN', { topicId, isPinned });
    } catch (error) {
      console.error('Ошибка при закреплении/откреплении темы:', error);
      throw error;
    }
  },
  // Загрузка ответов по ID темы
  async fetchReplies({ commit }, { topicId }) {
    try {
      const repliesRef = databaseRef(database, `replies/${topicId}`);
      const snapshot = await get(repliesRef);
      
      if (snapshot.exists()) {
        const replies = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
        commit('SET_REPLIES', { topicId, replies });
        return replies;
      }
      return [];
    } catch (error) {
      console.error('Ошибка при загрузке ответов:', error);
      throw error;
    }
  },
  // Добавление нового ответа
  async addReply({ commit }, { topicId, reply }) {
    try {
      const repliesRef = databaseRef(database, `replies/${topicId}`);
      const newReplyRef = push(repliesRef);
      
      const replyData = {
        ...reply,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newReplyRef, replyData);
      
      const newReply = {
        id: newReplyRef.key,
        ...replyData
      };
      
      commit('ADD_REPLY', { topicId, reply: newReply });
      return newReply;
    } catch (error) {
      console.error('Ошибка при добавлении ответа:', error);
      throw error;
    }
  },
  // Обновление ответа
  async updateReply({ commit }, { topicId, replyId, content }) {
    try {
      const replyRef = databaseRef(database, `replies/${topicId}/${replyId}`)
      
      const updates = {
        content,
        updatedAt: new Date().toISOString()
      }
      
      await update(replyRef, updates)
      
      // Обновляем состояние
      commit('UPDATE_REPLY', { topicId, replyId, updates })
    } catch (error) {
      console.error('Ошибка при обновлении ответа:', error)
      throw error
    }
  },
  // Удаление ответа
  async deleteReply({ commit }, { topicId, replyId }) {
    try {
      const replyRef = databaseRef(database, `replies/${topicId}/${replyId}`)
      await remove(replyRef)
      
      // Обновляем состояние
      commit('DELETE_REPLY', { topicId, replyId })
    } catch (error) {
      console.error('Ошибка при удалении ответа:', error)
      throw error
    }
  }
};

const mutations = {
  SET_TOPICS(state, topics) {
    state.topics = topics;
    console.log('Обновленное состояние тем:', state.topics);
  },
  SET_CURRENT_TOPIC(state, topic) {
    state.currentTopic = topic;
  },
  ADD_TOPIC(state, topic) {
    // Добавляем новую тему в начало массива
    state.topics.unshift(topic);
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
  UPDATE_TOPIC_VIEWS(state, { topicId, views }) {
    const topic = state.topics.find(t => t.id === topicId);
    if (topic) {
      topic.views = views;
    }
  },
  UPDATE_TOPIC_PIN(state, { topicId, isPinned }) {
    const topic = state.topics.find(t => t.id === topicId);
    if (topic) {
      topic.isPinned = isPinned;
    }
  },
  SET_REPLIES(state, { topicId, replies }) {
    state.replies = {
      ...state.replies,
      [topicId]: replies
    }
  },
  ADD_REPLY(state, { topicId, reply }) {
    if (!state.replies[topicId]) {
      state.replies[topicId] = []
    }
    state.replies[topicId].push(reply)
  },
  UPDATE_REPLY(state, { topicId, replyId, updates }) {
    const replies = state.replies[topicId]
    if (replies) {
      const reply = replies.find(r => r.id === replyId)
      if (reply) {
        Object.assign(reply, updates)
      }
    }
  },
  DELETE_REPLY(state, { topicId, replyId }) {
    const replies = state.replies[topicId]
    if (replies) {
      const index = replies.findIndex(r => r.id === replyId)
      if (index !== -1) {
        replies.splice(index, 1)
      }
    }
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
  getTopicReplies: (state) => (topicId) => {
    return state.replies[topicId] || []
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};