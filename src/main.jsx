// --------------------------------------
// main.jsx
// --------------------------------------
// This is the entry point of the React app.
// It renders <App /> inside the "root" div in index.html.
// We also wrap App with:
// - BrowserRouter: enables routes (/login, /dashboard, etc.)
// - AuthProvider: provides login state to the whole app.
// --------------------------------------

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
