import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;

// Initialize FFmpeg
async function initFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    try {
      self.postMessage({ type: 'status', message: 'Инициализация FFmpeg...' });
      
      // Загружаем ядро FFmpeg из публичной директории
      await ffmpeg.load({
        coreURL: await toBlobURL(
          new URL('/ffmpeg/ffmpeg-core.js', self.location),
          'text/javascript'
        ),
        wasmURL: await toBlobURL(
          new URL('/ffmpeg/ffmpeg-core.wasm', self.location),
          'application/wasm'
        )
      });

      self.postMessage({ type: 'status', message: 'FFmpeg инициализирован' });

      // Добавляем обработчик логов
      ffmpeg.on('log', ({ message }) => {
        self.postMessage({ type: 'log', message });
      });

      // Добавляем обработчик прогресса
      ffmpeg.on('progress', ({ progress, time }) => {
        self.postMessage({ type: 'progress', progress: Math.round(progress * 100) });
      });

      return ffmpeg;
    } catch (error) {
      self.postMessage({ 
        type: 'error', 
        message: `Ошибка инициализации FFmpeg: ${error.message}` 
      });
      throw error;
    }
  }
  return ffmpeg;
}

// Compress video function
async function compressVideo(videoFile, options = {}) {
  try {
    const ffmpeg = await initFFmpeg();
    
    self.postMessage({ type: 'status', message: 'Начало сжатия...' });
    
    // Write the input file to FFmpeg's virtual filesystem
    const inputFileName = 'input.mp4';
    const outputFileName = 'output.mp4';
    
    // Конвертируем файл в ArrayBuffer и загружаем в виртуальную файловую систему
    const fileData = await videoFile.arrayBuffer();
    await ffmpeg.writeFile(inputFileName, new Uint8Array(fileData));
    
    self.postMessage({ type: 'status', message: 'Анализ видео...' });
    
    // Prepare compression command with quality preservation
    const args = [
      '-i', inputFileName,
      '-c:v', 'libx264',      // Видеокодек H.264
      '-preset', 'medium',     // Баланс между скоростью и качеством
      '-crf', '23',           // Постоянное качество (18-28 - хороший диапазон)
      '-c:a', 'aac',          // Аудиокодек AAC
      '-b:a', '128k',         // Битрейт аудио
      '-movflags', '+faststart', // Оптимизация для веб-просмотра
      '-y',                   // Перезаписывать выходной файл
      outputFileName
    ];

    self.postMessage({ type: 'status', message: 'Сжатие видео...' });
    
    // Run compression
    await ffmpeg.exec(args);
    
    self.postMessage({ type: 'status', message: 'Чтение сжатого файла...' });
    
    // Read the output file
    const data = await ffmpeg.readFile(outputFileName);
    
    // Create a new Blob from the compressed data
    const compressedVideo = new Blob([data.buffer], { type: 'video/mp4' });
    
    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    
    self.postMessage({
      type: 'success',
      compressedVideo,
      originalSize: videoFile.size,
      compressedSize: compressedVideo.size
    });
  } catch (error) {
    console.error('Compression error:', error);
    self.postMessage({
      type: 'error',
      message: `Ошибка сжатия: ${error.message}`
    });
  }
}

// Handle messages from the main thread
self.onmessage = async (e) => {
  if (e.data.type === 'compress') {
    try {
      await compressVideo(e.data.video, e.data.options);
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error.message
      });
    }
  }
};
