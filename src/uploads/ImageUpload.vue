<template>
  <div>

     <input
      type="file"
      @change="handleAvatarChange"
      ref="fileInput"
      accept="image/*"
      class="hidden"
    />
    
    <!-- Кнопка, которая визуально выглядит как инпут -->
    <button
      @click="triggerFileInput"
      class="text-white px-4 py-3 rounded-lg shadow-md bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 active:from-red-600 active:to-red-800 focus:ring-4 focus:ring-red-300 transition duration-300 ease-in-out text-lg flex justify-center items-center"
    >
      <i class="fas fa-image mr-2"></i> Картинка
    </button>
              
    <!-- <button
       accept="image/*"
      @click="triggerImageInput"
      class="text-white px-4 py-3 rounded-lg shadow-md bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 active:from-red-600 active:to-red-800 focus:ring-4 focus:ring-red-300 transition duration-300 ease-in-out text-lg flex justify-center items-center"
    >
      <i class="fas fa-image mr-2"></i> Картинка
    </button> -->

    <!-- Превью изображения -->
    <div v-if="uploadedImageUrl" class="mt-4">
      <p class="text-lg font-semibold text-gray-700">Предпросмотр картинки:</p>
      <img :src="uploadedImageUrl" alt="Предпросмотр картинки" class="w-full max-w-xs h-auto rounded-lg shadow-lg"/>
    </div>

    <!-- Ошибка загрузки -->
    <p v-if="uploadError" class="text-red-500 text-sm mt-2">{{ uploadError }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';

const uploadedImageUrl = ref('');
const uploadError = ref('');
const selectedFile = ref(null);
const fileInput = ref(null);

const triggerFileInput = () => {
  fileInput.value.click(); // Программно вызываем клик по скрытому инпуту
};



const store = useStore();

const props = defineProps({
  userId: {
    type: String,
    required: true,
  }
});

const emit = defineEmits(['update:imageUrl']); // Событие для передачи URL родителю

// Устанавливаем разрешенные типы файлов
const fileTypes = ref('image/jpeg, image/png, image/gif');

// Триггер для открытия окна выбора файла
function triggerImageInput() {
  const imageInput = document.querySelector('input[type="file"]');
  if (imageInput) imageInput.click();
}

// Обработка загрузки изображения
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Проверка на тип файла (по MIME)
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    uploadError.value = 'Неверный формат файла';
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    // Используем Vuex для загрузки картинки через action
    const pictureUrl = await store.dispatch('media/uploadPicture', {
      userId: props.userId,
      pictureFile: file,
    });

    // Присваиваем полученный URL
    uploadedImageUrl.value = pictureUrl;
    uploadError.value = '';
    emit('update:imageUrl', uploadedImageUrl.value); // Отправляем URL родителю
  } catch (error) {
    uploadError.value = 'Ошибка при загрузке изображения';
  }
}
</script>
