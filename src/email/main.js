import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/store'
import { auth } from './plugins/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import '../src/assets/main.css'

// Создаем приложение
const app = createApp(App)

// Ждем инициализацию Firebase Auth
let appInitialized = false
onAuthStateChanged(auth, (user) => {
  if (!appInitialized) {
    app.use(router)
    app.use(store)
    app.mount('#app')
    appInitialized = true
  }
  
  if (user) {
    store.commit('user/setUser', {
      email: user.email,
      emailVerified: user.emailVerified,
      uid: user.uid
    })
  } else {
    store.commit('user/setUser', null)
  }
})