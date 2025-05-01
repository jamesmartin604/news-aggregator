import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.css";
import App from "./App.tsx";
import SignUp from './SignUp.tsx'; // Import signup page




createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
      <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
</StrictMode>
 );
 

//cd react-app
//npm run dev
