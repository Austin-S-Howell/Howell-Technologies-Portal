import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "primeicons/primeicons.css";
import "./styles.css";
import "./styles.mobile.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
