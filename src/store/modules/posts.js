// store/modules/posts.js
import { 
  ref as dbRef,
  push,
  set,
  get,
  update,
  serverTimestamp
} from 'firebase/database';
import { getDatabase } from 'firebase/database';

export default {
  namespaced: true,
  
  state: {
    posts: {},
    comments: {},
    currentPost: null,
    editingPost: null,
    loading: false,
    error: null
  },

  mutations: {
    SET_POSTS(state, posts) {
      state.posts = { ...state.posts, ...posts };
    },
    SET_POST(state, post) {
      state.posts = { ...state.posts, [post.id]: post };
    },
    SET_CURRENT_POST(state, post) {
      state.currentPost = post;
    },
    UPDATE_POST(state, updatedPost) {
      console.log('Мутация UPDATE_POST:', updatedPost);
      state.posts[updatedPost.id] = { ...state.posts[updatedPost.id], ...updatedPost };
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_ERROR(state, error) {
      state.error = error;
    }
  },

  actions: {
    async createPost({ commit, rootState }, postData) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const postsRef = dbRef(db, 'posts');
        const newPostRef = push(postsRef);
        const postId = newPostRef.key;

        if (!postId) throw new Error('Не удалось сгенерировать ID для поста');

        const currentUser = rootState.auth.user;
        if (!currentUser) throw new Error('Требуется авторизация для создания поста');

        const fullPostData = {
          id: postId,
          title: postData.title,
          content: postData.content,
          categoryId: postData.categoryId,
          authorId: currentUser.uid,
          pictures: postData.pictures || [],
          videos: postData.videos || [],
          audio: postData.audio || [],
          documents: postData.documents || [],
          tags: Array.isArray(postData.tags) ? postData.tags : [],
          likes: {},
          likesCount: 0,
          views: 0,
          createdAt: postData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await Promise.all([
          set(newPostRef, fullPostData),
          set(dbRef(db, `categories/${postData.categoryId}/posts/${postId}`), fullPostData)
        ]);

        commit('SET_POST', fullPostData);
        commit('SET_CURRENT_POST', fullPostData);
        return postId;
      } catch (error) {
        console.error('Ошибка при создании поста:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async toggleLike({ commit, rootState }, postId) {
      const currentUser = rootState.auth.user;
      if (!currentUser) throw new Error('Требуется авторизация');

      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const categoriesRef = dbRef(db, 'categories');
        const categoriesSnapshot = await get(categoriesRef);
        
        if (!categoriesSnapshot.exists()) throw new Error('Категории не найдены');

        const categories = categoriesSnapshot.val();
        let categoryId = null;
        let post = null;

        for (const catId in categories) {
          if (categories[catId].posts && categories[catId].posts[postId]) {
            categoryId = catId;
            post = categories[catId].posts[postId];
            break;
          }
        }

        if (!post) throw new Error(`Пост ${postId} не найден`);

        const postRef = dbRef(db, `categories/${categoryId}/posts/${postId}`);
        const globalPostRef = dbRef(db, `posts/${postId}`);

        const likes = post.likes || {};
        let likesCount = post.likesCount || Object.keys(likes).length;

        if (likes[currentUser.uid]) {
          delete likes[currentUser.uid];
          likesCount = Math.max(0, likesCount - 1);
        } else {
          likes[currentUser.uid] = true;
          likesCount += 1;
        }

        const updatedPost = {
          ...post,
          id: postId,
          categoryId,
          likes,
          likesCount
        };

        await Promise.all([
          update(postRef, { likes, likesCount }),
          update(globalPostRef, { likes, likesCount })
        ]);

        commit('UPDATE_POST', updatedPost);
        return updatedPost;
      } catch (error) {
        console.error('[toggleLike] Ошибка:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async fetchPostsByCategory({ commit }, categoryId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const categoryPostsRef = dbRef(db, `categories/${categoryId}/posts`);
        const categoryPostsSnapshot = await get(categoryPostsRef);

        if (!categoryPostsSnapshot.exists()) {
          commit('SET_POSTS', {});
          return {};
        }

        const postsData = categoryPostsSnapshot.val();
        const posts = {};

        for (const postId in postsData) {
          posts[postId] = {
            id: postId,
            ...postsData[postId],
            tags: Array.isArray(postsData[postId].tags) ? postsData[postId].tags : (postsData[postId].tags ? [postsData[postId].tags] : ['форум'])
          };
        }

        commit('SET_POSTS', posts);
        return posts;
      } catch (error) {
        console.error('Ошибка при загрузке постов категории:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async fetchPostById({ commit }, postId) {
      commit('SET_LOADING', true);
      try {
        const db = getDatabase();
        const categoriesRef = dbRef(db, 'categories');
        const categoriesSnapshot = await get(categoriesRef);
        
        if (categoriesSnapshot.exists()) {
          const categories = categoriesSnapshot.val();
          for (const categoryId in categories) {
            if (categories[categoryId].posts && categories[categoryId].posts[postId]) {
              const postData = {
                id: postId,
                categoryId,
                ...categories[categoryId].posts[postId],
                tags: Array.isArray(categories[categoryId].posts[postId].tags) ? categories[categoryId].posts[postId].tags : (categories[categoryId].posts[postId].tags ? [categories[categoryId].posts[postId].tags] : ['форум'])
              };
              if (postData.authorId) {
                const authorRef = dbRef(db, `users/${postData.authorId}/profile`);
                const authorSnapshot = await get(authorRef);
                if (authorSnapshot.exists()) {
                  postData.author = { id: postData.authorId, ...authorSnapshot.val() };
                }
              }
              commit('SET_POST', postData);
              commit('SET_CURRENT_POST', postData);
              return postData;
            }
          }
        }
        throw new Error('Пост не найден');
      } catch (error) {
        console.error('Ошибка при загрузке поста:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  },

  getters: {
    getAllPosts: state => state.posts,
    getPostById: state => id => state.posts[id],
    getCurrentPost: state => state.currentPost,
    isLoading: state => state.loading,
    getError: state => state.error
  }
};