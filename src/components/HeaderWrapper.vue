<template>
  <component :is="currentHeader" />
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import Header from './Header.vue';
import AdminHeader from './AdminHeader.vue';

const store = useStore();

// Определяем текущий хедер на основе роли
const currentHeader = computed(() => {
  const userRole = store.getters['auth/userRole'];
  return userRole === 'admin' || userRole === 'superuser' || userRole === 'moderator'
    ? AdminHeader
    : Header;
});

// Загружаем профиль при монтировании компонента
onMounted(async () => {
  const userId = store.getters['auth/getUserId'];
  if (userId) {
    try {
      await store.dispatch('profile/fetchProfile', userId);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }
});
</script>
