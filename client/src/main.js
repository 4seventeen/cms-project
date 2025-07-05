import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router/index.js";

// v-calendar imports
import VCalendar from 'v-calendar';
import 'v-calendar/style.css';

const app = createApp(App)
app.use(router)
app.use(VCalendar, {}) // Registers v-calendar globally
app.mount('#app')
