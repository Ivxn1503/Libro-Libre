
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import "./index.css";

// Registrar el Service Worker de LibroLibre.
// Solo se activará en la compilación de producción.
registerSW({
  immediate: true,

  onNeedRefresh() {
    console.info(
      "Hay una nueva versión de LibroLibre disponible. Recarga la página para actualizar.",
    );
  },

  onOfflineReady() {
    console.info(
      "LibroLibre está preparado para utilizar sus recursos estáticos sin conexión.",
    );
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
