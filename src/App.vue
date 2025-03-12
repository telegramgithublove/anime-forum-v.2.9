<template>
  <div class="flex flex-col min-h-screen bg-gray-100 text-gray-900">
    <!-- Header -->
    <HeaderWrapper class="bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md" />

    <!-- Main Content Area -->
    <div class="flex flex-1">
      <!-- Sidebar -->
      <Sidebar />

      <!-- Router View for Page Content -->
      <main class="flex-1 p-6">
        <div v-if="isInitializing" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
        <RouterView v-else />
      </main>
    </div>

    <!-- Footer -->
    <Footer class="bg-gray-800 text-gray-300 text-center p-4" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import HeaderWrapper from './components/HeaderWrapper.vue'
import Sidebar from './components/Sidebar.vue'
import Footer from './components/Footer.vue'
import { RouterView } from 'vue-router'
import { initializeDefaultCategories } from './utils/initializeCategories'

export default {
  name: 'App',
  components: {
    HeaderWrapper,
    Sidebar,
    Footer,
    RouterView
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const isInitializing = ref(true)

    onMounted(async () => {
      console.log('App: Инициализация...')
      
      try {
        // Инициализируем аутентификацию
        const user = await store.dispatch('auth/initAuth')
        
        // Если пользователь авторизован, загружаем его профиль
        if (user) {
          await store.dispatch('profile/fetchProfile', user.uid);
        }
        
        await initializeDefaultCategories()
        
        // Загружаем категории
        await store.dispatch('categories/fetchCategories')
        console.log('App: Категории загружены')
      } catch (error) {
        console.error('App: Ошибка при загрузке категорий:', error)
      } finally {
        isInitializing.value = false
      }
    })

    return {
      isInitializing
    }
  }
}
</script>

<style>
/* Custom Tailwind CSS Utilities for consistent theming across the forum */
</style>
