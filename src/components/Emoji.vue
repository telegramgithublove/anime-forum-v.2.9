<template>
    <div v-if="isVisible" class="emoji-picker-container">
      <div class="emoji-picker-overlay" @click="closeEmojiPicker"></div>
      <div class="emoji-picker-content" :style="pickerStyle">
        <EmojiPicker 
          :dark="isDarkMode"
          @select="onEmojiSelect"
          :style="{ width: '100%' }"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import { useStore } from 'vuex';
  import EmojiPicker from 'vue3-emoji-picker';
  import 'vue3-emoji-picker/css';
  
  const store = useStore();
  const props = defineProps({
    isVisible: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    isDarkMode: {
      type: Boolean,
      default: false
    }
  });
  
  const pickerStyle = computed(() => {
    return {
      position: 'fixed',
      left: `${props.position.x}px`,
      top: `${props.position.y}px`,
      zIndex: 1000
    };
  });
  
  const emit = defineEmits(['close', 'select']);
  
  const onEmojiSelect = (emoji) => {
    emit('select', emoji.i);
    emit('close');
  };
  
  const closeEmojiPicker = () => {
    emit('close');
  };
  </script>
  
  <style scoped>
  .emoji-picker-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }
  
  .emoji-picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .emoji-picker-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 320px;
  }
  
  :deep(.v3-emoji-picker) {
    --ep-color-border: #e2e8f0;
    --ep-color-sbg: #f8fafc;
    --ep-color-active: #e2e8f0;
  }
  
  :deep(.v3-emoji-picker.dark) {
    --ep-color-border: #2d3748;
    --ep-color-sbg: #1a202c;
    --ep-color-active: #2d3748;
  }
  </style>