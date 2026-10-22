import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { fallbackToOriginalImages } from "./lib/imageUtils";
import { initScrollMotion } from "./lib/scrollMotion";

// eslint-disable-next-line no-console
console.log("App Started");

initScrollMotion();
fallbackToOriginalImages();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

