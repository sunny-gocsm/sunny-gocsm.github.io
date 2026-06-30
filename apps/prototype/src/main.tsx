import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@gocsm/design-system/styles.css";
import "./app-overrides.css";
import "./onboarding/onb.css";
createRoot(document.getElementById("root")!).render(<App />);