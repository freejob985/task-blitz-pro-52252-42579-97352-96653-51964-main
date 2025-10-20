import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initDB } from "./lib/db";

// Initialize Firebase database
initDB().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
