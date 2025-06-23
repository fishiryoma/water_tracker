import './assets/main.css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { database } from './firebase'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(createPinia())

app.mount('#app')
