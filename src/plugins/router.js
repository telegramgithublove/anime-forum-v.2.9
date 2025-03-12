// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { getDatabase, ref, get } from 'firebase/database'
import axios from 'axios'
import store from '../store/store'

// Импортируем основные компоненты


import AddTopic from '../views/AddTopic.vue'
import CategoryPosts from '../views/CategoryPosts.vue'
import PostList from '../views/PostList.vue'
import Thread from '../views/Thread.vue'
import AdminSetup from '../views/AdminSetup.vue'
import TopicDetails from '../views/TopicDetails.vue'
import ThreadCard from '../views/ThreadCard.vue'
import ThreadList from '../views/ThreadList.vue'
import AdminPanel from '../views/AdminPanel.vue'
import UserManagement from '../views/UserManagement.vue'
import ContentManagement from '../views/ContentManagement.vue'
import Reports from '../views/Reports.vue'
import PostDetails from '../views/PostDetails.vue'
import Settings from '../views/Settings.vue'

// Импортируем компоненты аутентификации
import Registration from '../views/auth/Registration.vue'
import Notification from '../views/auth/Notification.vue'
import VeryfyEmail from '../views/auth/VeryfyEmail.vue'
import SendEmailVerification from '../views/auth/SendEmailVerification.vue'
import EmailVerificationHandler from '../views/auth/EmailVerificationHandler.vue'

// Используем динамический импорт для Profile и CategoryList
const Profile = () => import('../views/profile/Profile.vue')
const CategoryList = () => import('../views/CategoryList.vue')

const API_BASE_URL = 'https://forum-a36e8-default-rtdb.asia-southeast1.firebasedatabase.app';

// Функция проверки доступа к админ-панели
const checkAdminAccess = async (to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');

  console.log('Checking admin access:', { isAuthenticated, userRole });

  // Специальная проверка для суперпользователя
  if (userRole === 'superuser' && isAuthenticated) {
    console.log('Superuser access granted');
    next();
    return;
  }

  // Если нет аутентификации, перенаправляем на логин
  if (!isAuthenticated) {
    console.log('No authenticated user found');
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  // Для обычных пользователей проверяем роль в базе данных
  try {
    const db = getDatabase();
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not found');
    }

    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      const dbUserRole = userData.role;
      console.log('User role from database:', dbUserRole);
      
      localStorage.setItem('userRole', dbUserRole);
      
      if (dbUserRole === 'admin' || dbUserRole === 'superuser') {
        console.log('Admin/Superuser access granted from database');
        next();
      } else {
        console.log('Access denied: not an admin/superuser');
        next('/');
      }
    } else {
      console.log('User data not found in database');
      next('/');
    }
  } catch (error) {
    console.error('Error checking admin access:', error);
    next('/');
  }
};

// Проверка аутентификации для защищенных маршрутов
const checkAuth = async (to, from, next) => {
  const auth = getAuth()
  
  // Ждем инициализации Firebase Auth
  await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })

  const currentUser = auth.currentUser
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Если пользователь авторизован, обновляем его данные в store
  if (currentUser) {
    await store.dispatch('auth/setUser', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified
    })
    
    // Загружаем профиль пользователя
    try {
      await store.dispatch('profile/fetchProfile', currentUser.uid)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Проверяем права доступа
  if (requiresAuth && !currentUser) {
    // Сохраняем целевой маршрут для редиректа после логина
    next({ 
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (to.path === '/login' && currentUser) {
    // Если пользователь уже авторизован и пытается перейти на страницу логина
    next({ path: '/' })
  } else {
    next()
  }
};

// Проверка верификации email
const checkEmailVerified = async (to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');
  const emailVerified = localStorage.getItem('emailVerified') === 'true';

  // Проверяем superuser
  if (userRole === 'superuser' && isAuthenticated && emailVerified) {
    next();
    return;
  }

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user && !isAuthenticated) {
    next('/login');
    return;
  }

  await user?.reload();
  if (!user?.emailVerified && !emailVerified) {
    next('/verify-email');
  } else {
    next();
  }
};

const routes = [
  


  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: {
      requiresGuest: true
    }
  },
  {
    path: '/register',
    name: 'Registration',
    component: Registration,
    meta: {
      requiresGuest: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      requiresAuth: true,
      requiresEmailVerified: true,
      title: 'Настройки'
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { 
      requiresAuth: true,
      title: 'Профиль пользователя'
    }
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: () => import('../views/profile/EditProfile.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Редактировать профиль'
    }
  },
  {
    path: '/profile/settings',
    name: 'ProfileSettings',
    component: () => import('../views/profile/Settings.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Настройки профиля'
    }
  },
  {
    path: '/profile/friends',
    name: 'Friends',
    component: () => import('../views/profile/Friends.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Друзья'
    }
  },
  {
    path: '/',
    name: 'CategoryList',
    component: CategoryList,
    meta: { requiresAuth: false }
  },

  {
    path: '/category/:categoryId',
    name: 'CategoryPosts',
    component: CategoryPosts,
    props: true,
  },
  {
    path: '/topics/:id',
    name: 'TopicDetails',
    component: TopicDetails,
    props: true,
  },
  {
    path: '/category/:id/addtopic',
    name: 'AddTopic',
    component: AddTopic,
    props: true,
  },
  {
    path: '/post/:id',
    name: 'post-details',
    component: PostDetails,
    meta: {
      requiresAuth: true,
      title: 'Просмотр поста'
    }
  },
  {
    path: '/post/:id/details',
    name: 'PostDetails',
    component: PostDetails,
    props: true,
  },
  {
    path: '/new-post',
    name: 'NewPost',
    component: PostList,
  },
  {
    path: '/post-list',
    name: 'PostList',
    component: PostList,
  },
  {
    path: '/thread',
    name: 'Thread',
    component: Thread,
  },
  {
    path: '/thread-card',
    name: 'ThreadCard',
    component: ThreadCard,
  },
  {
    path: '/thread-list',
    name: 'ThreadList',
    component: ThreadList,
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    beforeEnter: (to, from, next) => {
      const userRole = localStorage.getItem('userRole');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      if (isAuthenticated && (userRole === 'admin' || userRole === 'superuser')) {
        next();
      } else {
        next('/login');
      }
    },
    meta: { 
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/user-management',
    name: 'UserManagement',
    component: UserManagement,
    beforeEnter: checkAdminAccess,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/content-management',
    name: 'ContentManagement',
    component: ContentManagement,
    beforeEnter: checkAdminAccess,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports,
    beforeEnter: checkAdminAccess,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/send-verification',
    name: 'SendVerification',
    component: SendEmailVerification,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VeryfyEmail
  },
  {
    path: '/email-verification',
    name: 'EmailVerificationHandler',
    component: EmailVerificationHandler,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin-setup',
    name: 'AdminSetup',
    component: AdminSetup
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('../views/Friends.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Друзья'
    }
  },
  {
    path: '/category/:categoryId/create',
    name: 'create-post',
    component: () => import('../views/CreatePost.vue'),
    meta: {
      requiresAuth: true,
      title: 'Создать пост'
    }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const auth = getAuth()
  
  // Ждем инициализации Firebase Auth
  await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })

  const currentUser = auth.currentUser
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  // Проверяем superuser
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const userRole = localStorage.getItem('userRole')

  // Специальная проверка для админ-панели
  if (to.path === '/admin') {
    if (userRole === 'superuser' && isAuthenticated) {
      next()
      return
    } else {
      next('/')
      return
    }
  }

  if (requiresAuth && !currentUser && !isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  if (to.path === '/login' && isAuthenticated) {
    if (userRole === 'superuser') {
      next('/admin')
      return
    }
    next('/')
    return
  }

  next()
})

// Функция проверки статуса администратора
async function checkAdminStatus(uid) {
  if (!uid) return false
  
  try {
    const db = getDatabase()
    const adminRef = ref(db, `admins/${uid}`)
    const snapshot = await get(adminRef)
    return snapshot.exists() && snapshot.val() === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}



export default router;
