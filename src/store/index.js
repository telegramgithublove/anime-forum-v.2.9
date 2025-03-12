import { createStore } from 'vuex'
import categories from './modules/categories'
import picture from './modules/picture'
import file from './modules/file'
import video from './modules/video'
import music from './modules/music'

export default createStore({
  modules: {
    categories,
    picture,
    file,
    video,
    music
  }
})
