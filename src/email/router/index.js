import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/plugins/firebase'
import GetAuth from '@/components/GetAuth.vue'
import EmailVerificationHandler from '@/components/EmailVerificationHandler.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: GetAuth
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: EmailVerificationHandler
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/protected',
    name: 'Protected',
    component: () => import('@/views/Protected.vue'),
    meta: { requiresAuth: true, requiresVerification: true }
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// Защита роутов
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresVerification = to.matched.some(record => record.meta.requiresVerification)
  const currentUser = auth.currentUser

  if (requiresAuth && !currentUser) {
    next('/')
    return
  }

  if (requiresVerification && currentUser && !currentUser.emailVerified) {
    next('/profile')
    return
  }

  if (to.path === '/' && currentUser) {
    next('/profile')
    return
  }

  next()
})

export default router
