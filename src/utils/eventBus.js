import { ref } from 'vue'

export const avatarBus = ref('')

export function updateGlobalAvatar(url) {
  avatarBus.value = url
  // Также обновляем localStorage для персистентности
  if (url) {
    localStorage.setItem('userAvatarUrl', url)
  }
}
