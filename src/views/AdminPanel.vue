<template>
  <div class="flex min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
    <!-- Sidebar -->
    <aside class="w-72 bg-gray-800 shadow-lg">
      <div class="p-6 border-b border-gray-700 text-center">
        <h2 class="text-2xl font-bold tracking-wider">Admin Panel</h2>
        <p class="text-sm text-gray-400 mt-1">Manage everything efficiently</p>
      </div>
      <nav class="mt-8">
        <ul class="space-y-2">
          <li>
            <router-link to="/user-management" class="flex items-center px-6 py-3 hover:bg-gray-700 rounded transition">
              <span class="text-lg font-medium">User Management</span>
            </router-link>
          </li>
          <li>
            <router-link to="/content-management" class="flex items-center px-6 py-3 hover:bg-gray-700 rounded transition">
              <span class="text-lg font-medium">Content Management</span>
            </router-link>
          </li>
          <li>
            <router-link to="/reports" class="flex items-center px-6 py-3 hover:bg-gray-700 rounded transition">
              <span class="text-lg font-medium">Reports</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-10">
      <header class="flex justify-between items-center pb-6 border-b border-gray-700">
        <h1 class="text-3xl font-semibold">Dashboard</h1>
        <button @click="logout" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded shadow-md">
          Logout
        </button>
      </header>
      
      <section class="grid grid-cols-3 gap-6 mt-8">
        <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-semibold mb-4">Active Users</h2>
          <p class="text-5xl font-bold">1,234</p>
        </div>
        <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-semibold mb-4">Pending Reports</h2>
          <p class="text-5xl font-bold">27</p>
        </div>
        <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-semibold mb-4">New Posts Today</h2>
          <p class="text-5xl font-bold">45</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

// Проверка прав доступа при монтировании компонента
onMounted(() => {
  const userRole = localStorage.getItem('userRole');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated || userRole !== 'superuser') {
    router.push('/');
  }
});

function logout() {
  // Очищаем все данные SuperUser из localStorage
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('username');
  localStorage.removeItem('userAvatarUrl');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userSettings');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('emailVerified');

  // Очищаем состояние в store
  store.commit('auth/SET_USER', null);
  
  // Перенаправляем на страницу логина
  router.push('/login');
}

console.log('Admin Panel Loaded');
</script>

<style scoped>
.material-icons {
  font-size: 1.8rem;
}
</style>
