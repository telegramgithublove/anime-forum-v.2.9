import axios from 'axios';
import { ref as databaseRef, set, get } from 'firebase/database';
import { database } from '../../plugins/firebase';
import lamejs from 'lamejs';

const state = {
  postAudio: {},
  uploadedAudio: [], // Изменяем название массива для соответствия с видео
  uploadProgress: {},
  baseUrl: 'http://95.164.90.115:3000'
};

const mutations = {
  SET_POST_AUDIO(state, { postId, audio }) {
    state.postAudio[postId] = audio;
  },
  ADD_AUDIO(state, audioData) {
    console.log('🎵 ADD_AUDIO мутация:', { 
      входныеДанные: audioData,
      текущиеФайлы: state.uploadedAudio 
    });

    if (!Array.isArray(state.uploadedAudio)) {
      state.uploadedAudio = [];
    }
    
    // Проверяем наличие URL
    if (!audioData.url) {
      console.error('❌ Отсутствует URL в данных аудио:', audioData);
      return;
    }
    
    // Обрабатываем URL
    let audioUrl = audioData.url;
    if (audioUrl.includes('localhost:3000')) {
      audioUrl = audioUrl.replace('http://localhost:3000', state.baseUrl);
    }
    if (!audioUrl.startsWith('http')) {
      audioUrl = `${state.baseUrl}${audioUrl}`;
    }

    const newAudio = {
      ...audioData,
      url: audioUrl
    };

    state.uploadedAudio.push(newAudio);
    
    console.log('🎵 После добавления:', { 
      добавленныйФайл: newAudio,
      всеФайлы: state.uploadedAudio 
    });
  },
  REMOVE_AUDIO(state, index) {
    state.uploadedAudio.splice(index, 1);
  },
  CLEAR_AUDIO(state) {
    state.uploadedAudio = [];
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
  async validateAudio({ commit }, file) {
    console.log('🎵 Валидация аудио файла:', file.name);
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ в байтах
    const ALLOWED_TYPES = [
      'audio/mpeg',        // .mp3
      'audio/mp4',         // .m4a
      'audio/wav',         // .wav
      'audio/ogg',         // .ogg
      'audio/x-m4a'        // .m4a (альтернативный MIME тип)
    ];

    // Проверка размера файла
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ Ошибка: файл слишком большой', {
        размерФайла: file.size,
        максимальныйРазмер: MAX_FILE_SIZE
      });
      throw new Error(`Размер файла не должен превышать 10 МБ. Текущий размер: ${(file.size / 1024 / 1024).toFixed(2)} МБ`);
    }

    // Проверка типа файла
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('❌ Ошибка: неподдерживаемый тип файла', {
        типФайла: file.type,
        разрешенныеТипы: ALLOWED_TYPES
      });
      throw new Error('Поддерживаются только аудио файлы форматов: MP3, M4A, WAV, OGG');
    }

    // Проверка, что файл действительно является аудио
    try {
      return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'metadata';

        audio.onloadedmetadata = () => {
          console.log('✅ Аудио файл валиден:', {
            имяФайла: file.name,
            размер: `${(file.size / 1024 / 1024).toFixed(2)} МБ`,
            длительность: `${Math.round(audio.duration)} сек`
          });
          resolve(true);
        };

        audio.onerror = () => {
          console.error('❌ Ошибка: файл не является валидным аудио');
          reject(new Error('Файл не является валидным аудио'));
        };

        audio.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('❌ Ошибка при проверке аудио файла:', error);
      throw new Error('Не удалось проверить аудио файл');
    }
  },

  async uploadAudio({ commit }, file) {
    console.log('🎵 Начало загрузки аудио');
    
    try {
      // Валидация файла
      await this.dispatch('music/validateAudio', file);
      
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      console.log('⬆️ Начало загрузки аудио:', { fileName, fileType, fileSize });
      
      const formData = new FormData();
      formData.append('file', file); // Используем 'file' вместо 'audio'
      
      console.log('📦 FormData содержимое:');
      for (let [key, value] of formData.entries()) {
        console.log('Ключ:', key, 'Значение:', value);
      }
      
      const url = `${state.baseUrl}/upload`; // Исправляем на правильный эндпоинт
      
      console.log('📤 Отправка запроса:', {
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          commit('SET_UPLOAD_PROGRESS', { fileName, progress });
          console.log('📊 Прогресс загрузки:', progress + '%');
        }
      });
      
      console.log('📥 Детали ответа сервера:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      if (response.status === 200 && response.data.fileUrl) {
        const audioUrl = response.data.fileUrl;
        console.log('✅ Аудио успешно загружено:', audioUrl);
        
        // Создаем объект с данными аудио
        const audioData = {
          name: fileName,
          type: fileType,
          url: audioUrl,
          size: fileSize
        };
        
        console.log('📝 Подготовленные данные аудио:', audioData);
        
        // Добавляем аудио в state
        commit('ADD_AUDIO', audioData);
        
        return { success: true, message: `✅ Файл успешно загружен: ${fileName}` };
      } else {
        console.error('❌ Неверный ответ сервера:', response.data);
        throw new Error('Не удалось получить URL аудио файла');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при загрузке аудио:', error);
      if (error.response) {
        console.error('Статус ошибки:', error.response.status);
        console.error('Данные ошибки:', error.response.data);
      }
      return { 
        success: false, 
        message: error.message || 'Произошла ошибка при загрузке аудио'
      };
    }
  },

  async uploadMultipleAudio({ dispatch }, files) {
    return Promise.all(files.map(file => dispatch('uploadAudio', file)));
  },

  async savePostAudio({ commit }, { postId, audio }) {
    try {
      const audioRef = databaseRef(database, `posts/${postId}/audio`);
      await set(audioRef, audio);
      commit('SET_POST_AUDIO', { postId, audio });
    } catch (error) {
      console.error('Ошибка при сохранении аудио для поста:', error);
      throw error;
    }
  },

  async fetchPostAudio({ commit }, postId) {
    try {
      const snapshot = await get(databaseRef(database, `posts/${postId}/audio`));
      const audioFiles = snapshot.val() || [];
      commit('SET_POST_AUDIO', { postId, audio: audioFiles });
      return audioFiles;
    } catch (error) {
      console.error('Ошибка при получении аудио поста:', error);
      throw error;
    }
  },

  async removePostAudio({ commit, state }, { postId, audioUrl }) {
    try {
      const audioFiles = state.postAudio[postId] || [];
      const updatedAudioFiles = audioFiles.filter(url => url !== audioUrl);
      
      await set(databaseRef(database, `posts/${postId}/audio`), updatedAudioFiles);
      commit('SET_POST_AUDIO', { postId, audio: updatedAudioFiles });
      
      return updatedAudioFiles;
    } catch (error) {
      console.error('Ошибка при удалении аудио из поста:', error);
      throw error;
    }
  },

  async removeAudio({ commit, state }, index) {
    try {
      const audioToRemove = state.uploadedAudio[index];
      if (!audioToRemove) {
        throw new Error('Аудио файл не найден');
      }

      console.log('🗑️ Удаление аудио:', {
        index,
        audioFile: audioToRemove
      });

      // Удаляем из state
      commit('REMOVE_AUDIO', index);

      return { success: true, message: '✅ Аудио файл успешно удален' };
    } catch (error) {
      console.error('❌ Ошибка при удалении аудио:', error);
      return {
        success: false,
        message: error.message || 'Произошла ошибка при удалении аудио'
      };
    }
  },

  clearAudio({ commit }) {
    commit('CLEAR_AUDIO');
  }
};

async function compressAudio(file) {
  console.log('🎵 Начало сжатия аудио:', file.name);
  
  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channels = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
      }
      
      const mp3encoder = new lamejs.Mp3Encoder(
        audioBuffer.numberOfChannels,
        audioBuffer.sampleRate,
        320
      );
      
      const samples = new Int16Array(channels[0].length * channels.length);
      for (let i = 0; i < channels[0].length; i++) {
        for (let channel = 0; channel < channels.length; channel++) {
          const sample = channels[channel][i];
          const index = i * channels.length + channel;
          samples[index] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
      }
      
      const mp3Data = [];
      const sampleBlockSize = 1152;
      for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }
      
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
      
      const blob = new Blob(mp3Data, { type: 'audio/mp3' });
      const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.mp3'), {
        type: 'audio/mp3',
        lastModified: Date.now()
      });
      
      console.log('✅ Сжатие аудио завершено:', {
        исходныйРазмер: file.size,
        сжатыйРазмер: compressedFile.size,
        коэффициентСжатия: (file.size / compressedFile.size).toFixed(2)
      });
      
      resolve(compressedFile);
    } catch (error) {
      console.error('❌ Ошибка при сжатии аудио:', error);
      reject(error);
    }
  });
}

const getters = {
  getPostAudio: (state) => (postId) => {
    return state.postAudio[postId] || [];
  },
  getUploadProgress: (state) => (fileName) => {
    return state.uploadProgress[fileName] || 0;
  },
  getAudioFiles: (state) => {
    return state.uploadedAudio;
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};