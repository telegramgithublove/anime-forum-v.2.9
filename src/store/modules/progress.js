// store/modules/progress.js
import narutoImg from '@/assets/images/naruto.png';
import luffyImg from '@/assets/images/luffy.png';
import leviImg from '@/assets/images/levi.png';
import gokuImg from '@/assets/images/goku.png';
import sailorMoonImg from '@/assets/images/sailor-moon.png';

const state = {
  createdPosts: parseInt(localStorage.getItem('userCreatedPosts') || '0'),
  totalPosts: 1800,
  milestones: [
    { name: 'New User', posts: 0, image: narutoImg },
    { name: 'User', posts: 200, image: luffyImg },
    { name: 'Moderator', posts: 500, image: leviImg },
    { name: 'Teacher', posts: 1000, image: sailorMoonImg },
    { name: 'Administrator', posts: 1800, image: gokuImg }
  ]
};

const mutations = {
  INCREMENT_POSTS(state) {
    state.createdPosts += 1;
    localStorage.setItem('userCreatedPosts', state.createdPosts.toString());
  },
  SET_POSTS(state, count) {
    state.createdPosts = count;
    localStorage.setItem('userCreatedPosts', count.toString());
  }
};

const actions = {
  incrementPosts({ commit }) {
    commit('INCREMENT_POSTS');
  },
  setPosts({ commit }, count) {
    commit('SET_POSTS', count);
  },
  initializeProgress({ commit }) {
    const savedPosts = localStorage.getItem('userCreatedPosts');
    if (savedPosts) {
      commit('SET_POSTS', parseInt(savedPosts));
    }
  }
};

const getters = {
  getProgress(state) {
    const progress = (state.createdPosts / state.totalPosts) * 100;
    return Math.min(progress, 100);
  },
  getCurrentMilestone(state) {
    const current = state.milestones.find(m => state.createdPosts < m.posts) || state.milestones[state.milestones.length - 1];
    return state.milestones[state.milestones.indexOf(current) - 1] || state.milestones[0];
  },
  getNextMilestone(state) {
    return state.milestones.find(m => state.createdPosts < m.posts) || state.milestones[state.milestones.length - 1];
  },
  getMilestones(state) {
    return state.milestones;
  },
  getCreatedPosts(state) {
    return state.createdPosts;
  },
  getMilestoneProgress: (state) => (index) => {
    if (index >= state.milestones.length - 1) return 100;
    
    const currentMilestone = state.milestones[index];
    const nextMilestone = state.milestones[index + 1];
    const postsInRange = state.createdPosts - currentMilestone.posts;
    const totalRange = nextMilestone.posts - currentMilestone.posts;
    
    return Math.min(Math.max((postsInRange / totalRange) * 100, 0), 100);
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};