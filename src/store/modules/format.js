import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

const state = {
  uploadedFiles: [],
  uploadProgress: {},
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  ADD_FILE(state, fileData) {
    console.log('📄 ADD_FILE мутация:', { 
      входныеДанные: fileData,
      текущиеФайлы: state.uploadedFiles 
    });

    if (!Array.isArray(state.uploadedFiles)) {
      state.uploadedFiles = [];
    }
    
    // Проверяем наличие URL
    if (!fileData.url) {
      console.error('❌ Отсутствует URL в данных файла:', fileData);
      return;
    }
    
    // Обрабатываем URL
    let fileUrl = fileData.url;
    if (fileUrl.includes('localhost:3000')) {
      fileUrl = fileUrl.replace('http://localhost:3000', state.baseUrl);
    }
    if (!fileUrl.startsWith('http')) {
      fileUrl = `${state.baseUrl}${fileUrl}`;
    }

    const newFile = {
      ...fileData,
      url: fileUrl
    };

    state.uploadedFiles.push(newFile);
    
    console.log('📄 После добавления:', { 
      добавленныйФайл: newFile,
      всеФайлы: state.uploadedFiles 
    });
  },
  REMOVE_FILE(state, index) {
    state.uploadedFiles.splice(index, 1);
  },
  CLEAR_FILES(state) {
    state.uploadedFiles = [];
    state.uploadProgress = {};
  },
  SET_UPLOAD_PROGRESS(state, { fileName, progress }) {
    state.uploadProgress = {
      ...state.uploadProgress,
      [fileName]: progress
    };
  }
};

const actions = {
  validateFile({ commit }, file) {
    console.group('📝 Валидация документов');
    console.log('Проверка файла:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });

    return new Promise((resolve, reject) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.oasis.opendocument.text',
        'text/plain',
        'application/rtf',
        'text/rtf'
      ];
      
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.odt', '.txt', '.rtf'];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
      const hasValidExtension = allowedExtensions.includes(fileExtension);
      
      console.log('📑 Детали валидации:', {
        fileName,
        fileExtension,
        hasValidExtension,
        isTypeAllowed: allowedTypes.includes(file.type)
      });
      
      if (!allowedTypes.includes(file.type) && !hasValidExtension) {
        const error = new Error('Поддерживаются только форматы DOC, DOCX, PDF, TXT, RTF и ODT');
        console.error('❌ Неподдерживаемый тип файла:', {
          type: file.type,
          extension: fileExtension,
          error: error.message
        });
        console.groupEnd();
        reject(error);
        return;
      }
      
      if (fileExtension === '.rtf' && !file.type.includes('rtf')) {
        console.log('⚠️ Исправляем MIME-тип для RTF файла:', {
          originalType: file.type,
          newType: 'application/rtf'
        });
        file = new File([file], file.name, { type: 'application/rtf' });
      }
      
      console.log('✅ Файл прошел валидацию');
      console.groupEnd();
      resolve(file);
    });
  },

  validateFileSize({ commit }, file) {
    console.group('📏 Проверка размера файла');
    return new Promise((resolve, reject) => {
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (file.size > maxSize) {
        const error = new Error('Размер файла не должен превышать 20MB');
        console.error('❌ Превышен максимальный размер файла:', {
          actualSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          maxAllowedSize: '20 MB',
          error: error.message
        });
        console.groupEnd();
        reject(error);
        return;
      }
      console.log('✅ Размер файла в пределах нормы:', {
        actualSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        maxAllowedSize: '20 MB'
      });
      console.groupEnd();
      resolve(file);
    });
  },

  async compressFile({ commit, dispatch }, file) {
    console.group('🗜️ Сжатие документов');
    try {
      console.log('📄 Начало сжатия файла:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        lastModified: new Date(file.lastModified).toLocaleString()
      });

      if (file.size < 1024 * 1024) {
        console.log('✨ Файл достаточно маленький, сжатие не требуется:', {
          size: `${(file.size / 1024).toFixed(2)} KB`,
          threshold: '1 MB'
        });
        return file;
      }

      let compressedFile;
      console.log('🔍 Определение метода сжатия для типа:', file.type);

      switch (file.type) {
        case 'application/pdf':
          console.log('📌 Выбран метод сжатия PDF');
          compressedFile = await dispatch('compressPDF', file);
          break;

        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/vnd.oasis.opendocument.text':
        case 'application/rtf':
        case 'text/rtf':
          console.log('📌 Выбран метод сжатия текстового документа');
          compressedFile = await dispatch('compressTextBasedDoc', file);
          break;

        case 'text/plain':
          console.log('📌 Выбран метод сжатия простого текста');
          compressedFile = await dispatch('compressTextFile', file);
          break;

        default:
          console.log('⚠️ Неподдерживаемый тип файла для сжатия:', file.type);
          return file;
      }

      if (!compressedFile || compressedFile.size >= file.size) {
        console.log('⚠️ Сжатый файл больше оригинала или сжатие не удалось:', {
          originalSize: `${(file.size / 1024).toFixed(2)} KB`,
          compressedSize: compressedFile ? `${(compressedFile.size / 1024).toFixed(2)} KB` : 'N/A'
        });
        return file;
      }

      const compressionStats = {
        originalSize: `${(file.size / 1024).toFixed(2)} KB`,
        compressedSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
        reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
        method: file.type === 'application/pdf' ? 'PDF Compression' : 'Text Compression'
      };

      console.log('✅ Статистика сжатия:', compressionStats);
      return compressedFile;

    } catch (error) {
      console.error('❌ Ошибка при сжатии файла:', {
        error: error.message,
        stack: error.stack,
        fileName: file.name,
        fileType: file.type
      });
      return file;
    } finally {
      console.groupEnd();
    }
  },

  async compressPDF({ commit }, file) {
    console.group('📄 Сжатие PDF файла');
    try {
      // Читаем файл как ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Загружаем PDF документ
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        updateMetadata: false // Отключаем обновление метаданных для уменьшения размера
      });
      
      // Получаем все страницы
      const pages = pdfDoc.getPages();
      console.log(`📑 Количество страниц в PDF: ${pages.length}`);
      
      // Устанавливаем параметры сжатия
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true, // Использовать потоки объектов для уменьшения размера
        addDefaultPage: false, // Не добавлять пустую страницу
        useCompression: true, // Использовать сжатие
        preserveCollectedStreams: false, // Не сохранять собранные потоки
        removeUnusedObjects: true, // Удалить неиспользуемые объекты
        compressContentStreams: true // Сжимать потоки содержимого
      });
      
      // Создаем новый File объект
      const compressedFile = new File([compressedPdfBytes], file.name, { type: 'application/pdf' });
      
      console.log('📊 Результаты сжатия:', {
        originalSize: `${(file.size / 1024).toFixed(2)} KB`,
        compressedSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
        reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
      });
      
      return compressedFile;
    } catch (error) {
      console.error('❌ Ошибка при сжатии PDF:', {
        error: error.message,
        stack: error.stack,
        fileName: file.name
      });
      return null;
    } finally {
      console.groupEnd();
    }
  },

  async compressTextBasedDoc({ commit }, file) {
    try {
      // Читаем файл как ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Конвертируем в текст, если возможно
      let text;
      try {
        text = new TextDecoder().decode(arrayBuffer);
      } catch (error) {
        console.warn('⚠️ Не удалось преобразовать файл в текст, возвращаем оригинал');
        return file;
      }
      
      // Удаляем лишние пробелы и переносы строк
      const compressedText = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*/g, '\n')
        .trim();
      
      // Создаем новый файл
      return new File([compressedText], file.name, { type: file.type });
    } catch (error) {
      console.error('❌ Ошибка при сжатии документов:', {
        error: error.message,
        stack: error.stack,
        fileName: file.name
      });
      return file;
    }
  },

  async compressTextFile({ commit }, file) {
    try {
      // Читаем содержимое файла
      const text = await file.text();
      
      // Удаляем лишние пробелы и переносы строк
      const compressedText = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*/g, '\n')
        .trim();
      
      // Создаем новый файл
      return new File([compressedText], file.name, { type: file.type });
    } catch (error) {
      console.error('❌ Ошибка при сжатии текстового файла:', {
        error: error.message,
        stack: error.stack,
        fileName: file.name
      });
      return file;
    }
  },

  async uploadFile({ commit, dispatch }, file) {
    console.group('📤 Загрузка документов');
    try {
      console.log('🔍 Подготовка к загрузке:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      });

      // Сначала проверяем тип файла
      console.log('✨ Начало валидации типа файла');
      await dispatch('validateFile', file);
      console.log('✅ Валидация типа успешна');

      // Затем сжимаем файл
      console.log('🗜️ Начало сжатия файла');
      const compressedFile = await dispatch('compressFile', file);
      console.log('✅ Сжатие завершено:', {
        originalSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        compressedSize: `${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB`
      });

      // После сжатия проверяем размер
      console.log('📏 Проверка размера сжатого файла');
      await dispatch('validateFileSize', compressedFile);
      console.log('✅ Размер файла допустим');

      const formData = new FormData();
      formData.append('file', compressedFile);

      console.log('📦 Подготовка FormData:', {
        fileName: compressedFile.name,
        fileType: compressedFile.type,
        fileSize: `${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB`
      });

      const url = `${state.baseUrl}/upload`;
      console.log('🌐 URL для загрузки:', url);

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📊 Прогресс загрузки: ${progress}%`);
          commit('SET_UPLOAD_PROGRESS', { fileName: compressedFile.name, progress });
        }
      });

      console.log('📥 Ответ сервера:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (response.status === 200 && response.data.fileUrl) {
        const fileData = {
          name: compressedFile.name,
          type: compressedFile.type,
          url: response.data.fileUrl,
          size: `${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB`
        };

        console.log('✅ Файл успешно загружен:', fileData);
        commit('ADD_FILE', fileData);
        
        return { 
          success: true, 
          message: `✅ Файл успешно загружен: ${compressedFile.name}` 
        };
      } else {
        throw new Error('Не удалось получить URL файла');
      }

    } catch (error) {
      console.error('❌ Ошибка при загрузке файла:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      return { 
        success: false, 
        message: error.message || 'Произошла ошибка при загрузке файла'
      };
    } finally {
      console.groupEnd();
    }
  },

  async uploadMultipleFiles({ dispatch }, files) {
    return Promise.all(files.map(file => dispatch('uploadFile', file)));
  },

  async removeFile({ commit, state }, index) {
    try {
      const file = state.uploadedFiles[index];
      if (!file) {
        throw new Error('Файл не найден');
      }

      // Здесь можно добавить запрос на удаление файла с сервера, если необходимо
      
      commit('REMOVE_FILE', index);
      return { success: true, message: 'Файл успешно удален' };
    } catch (error) {
      console.error('Ошибка при удалении файла:', {
        error: error.message,
        stack: error.stack
      });
      return { success: false, message: 'Ошибка при удалении файла' };
    }
  },

  clearFiles({ commit }) {
    commit('CLEAR_FILES');
  }
};

const getters = {
  getUploadedFiles: (state) => state.uploadedFiles,
  getUploadProgress: (state) => state.uploadProgress
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};