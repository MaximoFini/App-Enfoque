import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { GlobalTimerProvider } from "./components/GlobalTimerProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GlobalTimerProvider>
        <App />
      </GlobalTimerProvider>
    </BrowserRouter>
  </StrictMode>,
);
