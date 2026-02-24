import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedOfflineData } from "./lib/offline-seed";

// Offlayn rejimda boshlang'ich ma'lumotlarni yaratish
seedOfflineData();

createRoot(document.getElementById("root")!).render(<App />);
