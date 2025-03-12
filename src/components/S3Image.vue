<template>
  <img
    :src="currentSrc"
    :alt="alt"
    :class="imageClass"
    @error="handleError"
    @load="handleLoad"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Image'
  },
  imageClass: {
    type: String,
    default: ''
  }
});

const store = useStore();
const currentSrc = ref(props.src);
const retryCount = ref(0);
const maxRetries = 3;

const handleError = async () => {
  console.error('Ошибка загрузки изображения:', currentSrc.value);
  
  if (retryCount.value < maxRetries) {
    retryCount.value++;
    
    try {
      // Пробуем загрузить через прокси
      const response = await axios.get(`${store.state.picture.baseUrl}/images/proxy?url=${encodeURIComponent(props.src)}`, {
        responseType: 'blob'
      });
      
      currentSrc.value = URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Ошибка при попытке загрузить через прокси:', error);
      // Пробуем использовать оригинальный URL
      currentSrc.value = props.src;
    }
  }
};

const handleLoad = () => {
  console.log('Изображение успешно загружено:', currentSrc.value);
};

onMounted(() => {
  currentSrc.value = props.src;
});
</script>
