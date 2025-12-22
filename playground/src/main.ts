import { createApp, h, Suspense } from "vue";
import "./style.css";
import App from "./App.vue";

createApp({
  render() {
    return h(Suspense, undefined, { default: () => h(App) });
  },
}).mount("#app");
