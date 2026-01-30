import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/styles.css";
import "./styles/animations.css";
import "./styles/highContrast.css";
import { BrowserRouter } from "react-router-dom";

import { Buffer } from "buffer";
window.Buffer = Buffer;

// Gestione viewport per notch/safe areas
if (window.visualViewport) {
  const viewport = window.visualViewport;
  const updateViewport = () => {
    document.documentElement.style.setProperty("--viewport-height", `${viewport.height}px`);
  };
  viewport.addEventListener("resize", updateViewport);
  updateViewport();
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
