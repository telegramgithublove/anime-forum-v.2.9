import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class VideoCompressor {
  constructor(callbacks = {}) {
    this.ffmpeg = null;
    this.callbacks = {
      onProgress: callbacks.onProgress || (() => {}),
      onStatus: callbacks.onStatus || (() => {}),
      onLog: callbacks.onLog || (() => {}),
      onError: callbacks.onError || (() => {}),
      onSuccess: callbacks.onSuccess || (() => {})
    };
  }

  async init() {
    try {
      if (!this.ffmpeg) {
        this.ffmpeg = new FFmpeg();
        
        this.callbacks.onStatus('Инициализация FFmpeg...');
        
        // Загружаем ядро FFmpeg из публичной директории
        await this.ffmpeg.load({
          coreURL: await toBlobURL(
            new URL('/ffmpeg/ffmpeg-core.js', window.location),
            'text/javascript'
          ),
          wasmURL: await toBlobURL(
            new URL('/ffmpeg/ffmpeg-core.wasm', window.location),
            'application/wasm'
          )
        });

        this.callbacks.onStatus('FFmpeg инициализирован');

        // Добавляем обработчик логов
        this.ffmpeg.on('log', ({ message }) => {
          this.callbacks.onLog(message);
        });

        // Добавляем обработчик прогресса
        this.ffmpeg.on('progress', ({ progress }) => {
          this.callbacks.onProgress(Math.round(progress * 100));
        });
      }
      return true;
    } catch (error) {
      this.callbacks.onError(`Ошибка инициализации FFmpeg: ${error.message}`);
      return false;
    }
  }

  async compressVideo(videoFile, options = {}) {
    try {
      // Validate input
      if (!(videoFile instanceof File) && !(videoFile instanceof Blob)) {
        throw new Error('Input must be a File or Blob');
      }

      // Инициализируем FFmpeg, если еще не инициализирован
      if (!this.ffmpeg) {
        const initialized = await this.init();
        if (!initialized) {
          throw new Error('Failed to initialize FFmpeg');
        }
      }

      this.callbacks.onStatus('Начало сжатия...');
      
      // Write the input file to FFmpeg's virtual filesystem
      const inputFileName = 'input.mp4';
      const outputFileName = 'output.mp4';
      
      // Конвертируем файл в ArrayBuffer и загружаем в виртуальную файловую систему
      const fileData = await videoFile.arrayBuffer();
      await this.ffmpeg.writeFile(inputFileName, new Uint8Array(fileData));
      
      this.callbacks.onStatus('Анализ видео...');
      
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

      this.callbacks.onStatus('Сжатие видео...');
      
      // Run compression
      await this.ffmpeg.exec(args);
      
      this.callbacks.onStatus('Чтение сжатого файла...');
      
      // Read the output file
      const data = await this.ffmpeg.readFile(outputFileName);
      
      // Create a new Blob from the compressed data
      const compressedVideo = new Blob([data.buffer], { type: 'video/mp4' });
      
      // Clean up
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);
      
      this.callbacks.onSuccess({
        compressedVideo,
        originalSize: videoFile.size,
        compressedSize: compressedVideo.size
      });

    } catch (error) {
      this.callbacks.onError(`Compression error: ${error.message}`);
      throw error;
    }
  }

  destroy() {
    if (this.ffmpeg) {
      this.ffmpeg = null;
    }
  }
}
