import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export const initializeDefaultCategories = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Проверяем, существуют ли уже категории
  const db = getDatabase();
  const categoriesRef = ref(db, 'categories');
  
  try {
    const snapshot = await get(categoriesRef);
    if (snapshot.exists()) {
      console.log('Категории уже существуют');
      return;
    }
    
    // Если категорий нет и пользователь superuser, создаем их
    if (user) {
      const defaultCategories = {
        anime: {
          name: 'Аниме',
          description: 'Обсуждение аниме сериалов и фильмов',
          type: 'anime',
          topicsCount: 0
        },
        manga: {
          name: 'Манга',
          description: 'Обсуждение манги и манхвы',
          type: 'manga',
          topicsCount: 0
        },
        news: {
          name: 'Новости',
          description: 'Новости аниме и манга индустрии',
          type: 'news',
          topicsCount: 0
        },
        art: {
          name: 'Арт',
          description: 'Фан-арты и творчество',
          type: 'art',
          topicsCount: 0
        },
        discussion: {
          name: 'Общее обсуждение',
          description: 'Общие темы для обсуждения',
          type: 'discussion',
          topicsCount: 0
        }
      };

      await set(categoriesRef, defaultCategories);
      console.log('Категории успешно инициализированы');
    } else {
      console.log('Категории не существуют, но пользователь не авторизован как superuser');
    }
  } catch (error) {
    console.error('Ошибка при инициализации категорий:', error);
  }
};
