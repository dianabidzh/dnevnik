import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@fontsource/lora/cyrillic-400.css";
import "@fontsource/lora/latin-400.css";
import "@fontsource/lora/cyrillic-500.css";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/cyrillic-400-italic.css";
import "@fontsource/lora/latin-400-italic.css";
import "@fontsource/marck-script/cyrillic-400.css";
import "@fontsource/marck-script/latin-400.css";
import "./styles/global.css";
import App from "./App";
import { getDB, requestPersistentStorage } from "./db/db";

registerSW({ immediate: true });
getDB().then(() => requestPersistentStorage());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
