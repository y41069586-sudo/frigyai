import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
    <App />
  </MotionConfig>,
);
