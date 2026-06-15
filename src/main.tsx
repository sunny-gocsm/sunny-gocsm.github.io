import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/gocsm-ds/styles.css";
import "./gocsm-ds-overrides.css";
createRoot(document.getElementById("root")!).render(<App />);