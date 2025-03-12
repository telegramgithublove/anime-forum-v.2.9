<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <!-- Компонент уведомления -->
    <EmailVerificationNotification v-if="showEmailVerificationNotification" @close="showEmailVerificationNotification = false" />

    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
        <!-- Кнопка "Назад" -->
        <button @click="goBack" class="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Назад</span>
        </button>

        <h1 class="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-center">
          Создать новую тему
        </h1>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Заголовок поста -->
          <div class="space-y-2">
            <input
              v-model="postTitle"
              type="text"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors bg-pink-50/70"
              placeholder="Введите заголовок темы..."
              maxlength="44"
              @input="handleTitleInput"
              required
            />
            <p class="text-sm text-gray-500 text-right">
              Осталось: <span class="font-medium text-purple-600">{{ remainingTitleCharacters }} символов</span>
            </p>
          </div>

          <!-- Загрузка изображения -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">
              Добавить изображение
            </label>
            <input
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="file-input block w-full text-sm text-gray-500
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-medium
                file:bg-purple-50 file:text-purple-600
                hover:file:bg-purple-100
                transition-all duration-200
                mb-2"
            />
            <div class="flex items-center space-x-2 px-2">
              <svg v-if="!fileName" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p v-if="fileName" class="text-sm text-gray-600">Файл: <span class="font-medium text-purple-600">{{ fileName }}</span></p>
              <p v-else class="text-sm text-gray-500">Файл не выбран</p>
            </div>
          </div>

          <!-- Предпросмотр изображения -->
          <div v-if="uploadedImageUrl" class="flex justify-center">
            <div class="relative group w-[280px] h-[280px] rounded-xl">
              <div class="absolute inset-0 overflow-visible">
                <div class="relative w-full h-full transform transition-all duration-500 ease-out group-hover:scale-150 origin-center hover:z-50">
                  <img
                    :src="uploadedImageUrl"
                    alt="Предпросмотр"
                    class="w-full h-full object-cover rounded-xl shadow-md"
                  />
                  <button
                    @click="removeImage"
                    class="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full p-2 transition-all duration-200 hover:scale-105"
                  >
                    <span class="sr-only">Удалить изображение</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Текст поста -->
          <div class="space-y-2">
            <textarea
              v-model="postContent"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none bg-pink-50/70"
              placeholder="Введите текст вашего поста..."
              rows="6"
              maxlength="2000"
              @input="handleContentInput"
              required
            ></textarea>
            <p class="text-sm text-gray-500 text-right">
              Осталось: <span class="font-medium text-purple-600">{{ remainingContentCharacters }} символов</span>
            </p>
          </div>

          <!-- Кнопка отправки -->
          <div class="flex justify-end pt-4">
            <button
              type="submit"
              class="relative px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium
                     overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none group"
              :disabled="!postTitle.trim() || !postContent.trim()"
              @click="handleSubmit"
            >
              <span class="relative z-10 group-hover:text-white transition-colors">
                Создать тему
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-300 group-hover:animate-shimmer"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getAuth } from 'firebase/auth';
import EmailVerificationNotification from './Notifications/EmailVerificationNotification.vue';

const auth = getAuth();
const store = useStore();
const router = useRouter();

// Состояния
const postTitle = ref('');
const postContent = ref('');
const remainingTitleCharacters = ref(44);
const remainingContentCharacters = ref(2000);
const uploadedImageUrl = ref('');
const fileName = ref('');
const isEmailVerified = ref(false);
const showEmailVerificationNotification = ref(false);
const currentUser = ref(null);

// Следим за текущим пользователем
onMounted(() => {
  currentUser.value = auth.currentUser;
});

// Проверка статуса верификации email
const checkEmailVerification = async () => {
  const user = currentUser.value || auth.currentUser;
  
  if (!user) {
    router.push('/login');
    return false;
  }

  await user.reload();
  return user.emailVerified;
};

// Обработчик нажатия на кнопку
async function handleSubmit(event) {
  event.preventDefault();
  
  const user = auth.currentUser;
  if (!user?.emailVerified) {
    showEmailVerificationNotification.value = true;
    return;
  }
  
  await submitPost();
}

// Основная функция создания поста
async function submitPost() {
  console.log('=== НАЧАЛО СОЗДАНИЯ ПОСТА ===');
  console.log('Значения формы:', {
    title: postTitle.value,
    titleLength: postTitle.value?.length,
    content: postContent.value,
    contentLength: postContent.value?.length,
    hasImage: !!uploadedImageUrl.value,
    imageUrlLength: uploadedImageUrl.value?.length || 0
  });
  
  if (!postTitle.value?.trim() || !postContent.value?.trim()) {
    console.warn('Валидация не пройдена: пустой заголовок или содержание');
    return;
  }

  try {
    console.log('Подготовка данных поста');
    const postData = {
      title: postTitle.value.trim(),
      content: postContent.value.trim(),
      categoryId: 'general',
      picture: uploadedImageUrl.value || null
    };
    
    console.log('Подготовленные данные поста:', {
      titleLength: postData.title.length,
      contentLength: postData.content.length,
      hasPicture: !!postData.picture,
      pictureLength: postData.picture ? postData.picture.length : 0,
      categoryId: postData.categoryId
    });

    // Используем правильный action для создания темы
    console.log('Отправка данных в store topics/addTopic');
    const result = await store.dispatch('topics/addTopic', postData);
    console.log('Результат создания темы:', result);
    
    // Очищаем форму
    postTitle.value = '';
    postContent.value = '';
    uploadedImageUrl.value = '';
    fileName.value = '';

    console.log('Форма очищена');
    
    // Перенаправляем на страницу темы
    if (result && result.id) {
      console.log('Перенаправление на страницу темы:', result.id);
      router.push(`/topics/${result.id}`);
    } else {
      console.warn('Не получен ID созданной темы');
    }
  } catch (error) {
    console.error('Ошибка при создании поста:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
  }
  console.log('=== КОНЕЦ ПРОЦЕССА СОЗДАНИЯ ПОСТА ===');
}

// Добавляем логирование изменений в полях формы
watch(postTitle, (newVal) => {
  console.log('Изменение заголовка:', {
    value: newVal,
    length: newVal?.length || 0
  });
});

watch(postContent, (newVal) => {
  console.log('Изменение содержания:', {
    value: newVal,
    length: newVal?.length || 0
  });
});

watch(uploadedImageUrl, (newVal) => {
  console.log('Изменение URL изображения:', {
    hasImage: !!newVal,
    length: newVal?.length || 0
  });
});

// Вспомогательные функции
const handleTitleInput = () => {
  remainingTitleCharacters.value = 44 - postTitle.value.length;
};

const handleContentInput = () => {
  remainingContentCharacters.value = 2000 - postContent.value.length;
};

const handleImageUpload = (event) => {
  console.log('Начало загрузки изображения');
  const file = event.target.files[0];
  if (file) {
    console.log('Файл получен:', {
      name: file.name,
      type: file.type,
      size: file.size + ' bytes'
    });
    
    fileName.value = file.name;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('FileReader успешно прочитал файл');
      uploadedImageUrl.value = e.target.result;
      console.log('URL изображения установлен:', uploadedImageUrl.value.substring(0, 50) + '...');
    };
    
    reader.onerror = (error) => {
      console.error('Ошибка при чтении файла:', error);
    };
    
    console.log('Начало чтения файла через FileReader');
    reader.readAsDataURL(file);
  } else {
    console.log('Файл не был выбран');
  }
};

const removeImage = () => {
  uploadedImageUrl.value = '';
  fileName.value = '';
};

const goBack = () => {
  router.push('/');
};
</script>
