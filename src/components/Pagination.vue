<template>
  <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2 mt-6">
    <button 
      @click="prevPage" 
      :disabled="currentPage === 1"
      class="px-4 py-2 rounded-lg bg-purple-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors duration-300"
    >
      <i class="fas fa-chevron-left mr-2"></i>
      Назад
    </button>
    
    <div class="flex items-center space-x-2">
      <template v-for="page in displayedPages" :key="page">
        <button 
          v-if="page !== '...'"
          @click="goToPage(page)"
          :class="[
            'px-4 py-2 rounded-lg transition-colors duration-300',
            currentPage === page 
              ? 'bg-purple-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
          ]"
        >
          {{ page }}
        </button>
        <span v-else class="px-2">...</span>
      </template>
    </div>

    <button 
      @click="nextPage" 
      :disabled="currentPage === totalPages"
      class="px-4 py-2 rounded-lg bg-purple-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors duration-300"
    >
      Вперед
      <i class="fas fa-chevron-right ml-2"></i>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
  totalItems: {
    type: Number,
    required: true
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
});

const store = useStore();

const currentPage = computed(() => store.getters['pagination/getCurrentPage']);
const totalPages = computed(() => {
  const total = Math.ceil(props.totalItems / props.itemsPerPage);
  console.log('Total Pages:', total);
  return total;
});

const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages.value);
    } else if (currentPage.value >= totalPages.value - 2) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage.value - 1; i <= currentPage.value + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages.value);
    }
  }
  
  return pages;
});

const goToPage = (page) => {
  store.dispatch('pagination/setCurrentPage', page);
};

const prevPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    goToPage(currentPage.value + 1);
  }
};
</script>