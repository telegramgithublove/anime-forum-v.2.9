<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Управление категориями</h1>
          <button
            @click="showAddForm = true"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            Добавить категорию
          </button>
        </div>

        <!-- Форма добавления/редактирования категории -->
        <div v-if="showAddForm || editingCategory" class="mb-8 bg-gray-50 p-6 rounded-lg">
          <h2 class="text-xl font-semibold mb-4">
            {{ editingCategory ? 'Редактировать категорию' : 'Новая категория' }}
          </h2>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                v-model="categoryForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                v-model="categoryForm.description"
                required
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Тип категории</label>
              <select
                v-model="categoryForm.type"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="default">Обычная</option>
                <option value="announcement">Объявления</option>
                <option value="discussion">Обсуждения</option>
                <option value="help">Помощь</option>
              </select>
            </div>

            <div class="flex gap-3">
              <button
                type="submit"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                {{ editingCategory ? 'Сохранить' : 'Создать' }}
              </button>
              <button
                type="button"
                @click="cancelEdit"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>

        <!-- Список категорий -->
        <div class="space-y-4">
          <div
            v-for="category in categories"
            :key="category.id"
            class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ category.name }}</h3>
                <span 
                  class="inline-block px-2 py-1 text-sm rounded mt-1"
                  :class="{
                    'bg-green-100 text-green-800': category.type === 'default',
                    'bg-blue-100 text-blue-800': category.type === 'announcement',
                    'bg-purple-100 text-purple-800': category.type === 'discussion',
                    'bg-yellow-100 text-yellow-800': category.type === 'help'
                  }"
                >
                  {{ getCategoryTypeName(category.type) }}
                </span>
                <p class="text-gray-600 mt-2">{{ category.description }}</p>
              </div>
              <div class="flex gap-2">
                <button
                  @click="startEdit(category)"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="confirmDelete(category)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Сообщение если нет категорий -->
        <div v-if="!categories.length" class="text-center py-8">
          <p class="text-gray-500">Категории пока не созданы</p>
        </div>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 class="text-lg font-semibold mb-4">Подтверждение удаления</h3>
        <p class="text-gray-600 mb-6">
          Вы действительно хотите удалить категорию "{{ categoryToDelete?.name }}"?
          Это действие нельзя будет отменить.
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Отмена
          </button>
          <button
            @click="deleteCategory"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { database } from '@/plugins/firebase';
import { ref as dbRef, push, set, remove, get, onValue } from 'firebase/database';

const router = useRouter();
const store = useStore();

const categories = ref([]);
const showAddForm = ref(false);
const editingCategory = ref(null);
const showDeleteModal = ref(false);
const categoryToDelete = ref(null);
const isLoading = ref(false);

const categoryForm = ref({
  name: '',
  description: '',
  type: 'default'
});

const getCategoryTypeName = (type) => {
  const types = {
    default: 'Обычная',
    announcement: 'Объявления',
    discussion: 'Обсуждения',
    help: 'Помощь'
  };
  return types[type] || type;
};

const resetForm = () => {
  categoryForm.value = {
    name: '',
    description: '',
    type: 'default'
  };
  showAddForm.value = false;
  editingCategory.value = null;
};

const handleSubmit = async () => {
  try {
    isLoading.value = true;
    const categoriesRef = dbRef(database, 'categories');

    if (editingCategory.value) {
      // Обновление существующей категории
      const categoryRef = dbRef(database, `categories/${editingCategory.value.id}`);
      const updates = {
        name: categoryForm.value.name,
        description: categoryForm.value.description,
        type: categoryForm.value.type,
        updatedAt: Date.now()
      };
      
      await set(categoryRef, updates);
      console.log('Категория обновлена:', editingCategory.value.id);
    } else {
      // Создание новой категории
      const newCategoryData = {
        name: categoryForm.value.name,
        description: categoryForm.value.description,
        type: categoryForm.value.type,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        topicsCount: 0,
        postsCount: 0
      };

      const newCategoryRef = push(categoriesRef);
      await set(newCategoryRef, newCategoryData);
      
      console.log('Создана новая категория:', newCategoryRef.key);
    }
    resetForm();
  } catch (error) {
    console.error('Ошибка при сохранении категории:', error);
    alert('Произошла ошибка при сохранении категории: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

const startEdit = (category) => {
  editingCategory.value = category;
  categoryForm.value = {
    name: category.name,
    description: category.description,
    type: category.type
  };
  showAddForm.value = false;
};

const cancelEdit = () => {
  resetForm();
};

const confirmDelete = (category) => {
  categoryToDelete.value = category;
  showDeleteModal.value = true;
};

const deleteCategory = async () => {
  if (!categoryToDelete.value) return;

  try {
    isLoading.value = true;
    // Сначала проверяем, есть ли темы в этой категории
    const topicsRef = dbRef(database, 'topics');
    const topicsSnapshot = await get(topicsRef);
    
    if (topicsSnapshot.exists()) {
      const topics = Object.values(topicsSnapshot.val());
      const hasTopics = topics.some(topic => topic.categoryId === categoryToDelete.value.id);
      
      if (hasTopics) {
        alert('Нельзя удалить категорию, содержащую темы. Сначала удалите все темы в этой категории.');
        showDeleteModal.value = false;
        categoryToDelete.value = null;
        return;
      }
    }

    // Если тем нет, удаляем категорию
    await remove(dbRef(database, `categories/${categoryToDelete.value.id}`));
    console.log('Категория удалена:', categoryToDelete.value.id);
    
    showDeleteModal.value = false;
    categoryToDelete.value = null;
  } catch (error) {
    console.error('Ошибка при удалении категории:', error);
    alert('Произошла ошибка при удалении категории: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

// Проверка прав доступа
const checkAccess = () => {
  const user = store.state.auth.user;
  if (!user || (user.role !== 'admin' && user.role !== 'superuser')) {
    router.push('/');
  }
};

onMounted(() => {
  checkAccess();
  
  // Слушаем изменения в категориях
  const categoriesRef = dbRef(database, 'categories');
  
  onValue(categoriesRef, (snapshot) => {
    try {
      if (snapshot.exists()) {
        const data = snapshot.val();
        categories.value = Object.entries(data).map(([id, category]) => ({
          id,
          ...category
        })).sort((a, b) => b.createdAt - a.createdAt); // Сортируем по дате создания
      } else {
        categories.value = [];
      }
    } catch (error) {
      console.error('Ошибка при обработке данных категорий:', error);
      alert('Ошибка при загрузке категорий: ' + error.message);
    }
  }, (error) => {
    console.error('Ошибка при получении категорий:', error);
    alert('Ошибка при загрузке категорий: ' + error.message);
  });
});
</script>
