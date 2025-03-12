const express = require('express'); // Импортируем Express
const multer = require('multer'); // Импортируем Multer
const cors = require('cors');
const path = require('path'); // Для работы с путями файлов
const fs = require('fs'); // Для проверки/создания папок

// Создаем экземпляр Express
const app = express();

// --- НАСТРОЙКА CORS --- //
// Разрешаем доступ с любых источников и обрабатываем предзапросы (OPTIONS)
app.use(cors({
  origin: '*', // Разрешить доступ со всех источников (можно заменить на конкретный домен, если нужно)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Разрешенные HTTP-методы
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Разрешенные заголовки
  credentials: true // Разрешаем отправку учетных данных (если требуется)
}));

// Обработка предзапросов OPTIONS для всех маршрутов
app.options('*', cors());


// Функция для создания пользовательских папок
const createUserFolder = (baseFolder, userId) => {
  const userFolder = path.join(baseFolder, userId);
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
  }
  return userFolder;
};

// Общая функция для обработки загрузки файлов
const createStorageAndFilter = (baseFolder, fileTypes, maxSize) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const { userId } = req.params;
        const userFolder = createUserFolder(baseFolder, userId);
        cb(null, userFolder);
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      const isFileTypeValid = fileTypes.test(file.mimetype) && fileTypes.test(path.extname(file.originalname).toLowerCase());
      cb(null, isFileTypeValid);
    },
    limits: { fileSize: maxSize },
  });
};

// Настройки для каждого типа файлов
const uploadAvatar = createStorageAndFilter('uploads/avatar', /jpeg|jpg|png/, 5 * 1024 * 1024); // 5 MB
const uploadImage = createStorageAndFilter('uploads/images', /jpeg|jpg|png|gif/, 5 * 1024 * 1024); // 5 MB
const uploadVideo = createStorageAndFilter('uploads/videos', /mp4|avi|mkv/, 50 * 1024 * 1024); // 50 MB
const uploadAudio = createStorageAndFilter('uploads/music', /audio\/mpeg|audio\/mp3|audio\/wav|audio\/x-wav|audio\/flac|audio\/x-flac|audio\/aiff|audio\/x-aiff|\.mp3$|\.wav$|\.flac$|\.aiff$/i, 50 * 1024 * 1024);
const uploadIcon = createStorageAndFilter('uploads/formats', /pdf|doc|docx|txt|odt/, 2 * 1024 * 1024); // 2 MB

// Маршруты для загрузки файлов с использованием userId

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

app.post('/upload/avatar/:userId', uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  const fileUrl = `http://94.232.245.11:3000/uploads/avatar/${req.params.userId}/${req.file.filename}`;
  res.status(200).json({
    message: 'Аватар успешно загружен',
    avatarUrl: fileUrl,
  });
});

app.post('/upload/image/:userId', uploadImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  const fileUrl = `http://94.232.245.11:3000/uploads/images/${req.params.userId}/${req.file.filename}`;
  res.status(200).json({
    message: 'Изображение успешно загружено',
    fileUrl: fileUrl,
  });
});

app.post('/upload/video/:userId', uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  const fileUrl = `http://94.232.245.11:3000/uploads/videos/${req.params.userId}/${req.file.filename}`;
  res.status(200).json({
    message: 'Видео успешно загружено',
    fileUrl: fileUrl,
  });
});

app.post('/upload/audio/:userId', uploadAudio.single('audio'), (req, res) => {
  console.log('Получен запрос на загрузку аудио:', {
    file: req.file,
    body: req.body,
    params: req.params
  });

  if (!req.file) {
    console.error('Файл не был загружен');
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  const fileUrl = `http://94.232.245.11:3000/uploads/music/${req.params.userId}/${req.file.filename}`;
  console.log('Файл успешно загружен:', fileUrl);
  
  res.status(200).json({
    message: 'Аудиофайл успешно загружен',
    fileUrl: fileUrl
  });
});

app.post('/upload/format/:userId', uploadIcon.single('format'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  const fileUrl = `http://94.232.245.11:3000/uploads/format/${req.params.userId}/${req.file.filename}`;
  res.status(200).json({
    message: 'Файл успешно загружена',
    fileUrl: fileUrl,
  });
});

// --- ПРОКСИ ДЛЯ FIREBASE --- //
// Маршрут для проксирования запросов к Firebase
app.get('/firebase-proxy', async (req, res) => {
  try {
    const { firebaseUrl } = req.query; // Получаем URL из query параметра
    const response = await axios.get(firebaseUrl); // Отправляем запрос на Firebase
    res.status(response.status).send(response.data); // Отправляем ответ клиенту
  } catch (error) {
    console.error('Ошибка при проксировании:', error.message);
    res.status(500).json({ error: 'Ошибка при проксировании запроса' });
  }
});

// --- ПРОВЕРКА ЗДОРОВЬЯ СЕРВЕРА --- //
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// --- СТАТИЧЕСКИЕ ФАЙЛЫ --- //
// Позволяет клиенту получать доступ к загруженным файлам
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// --- ЗАПУСК СЕРВЕРА --- //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер работает на порту ${PORT}`);
});
