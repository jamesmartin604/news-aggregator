import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.css";
import App from "./App.tsx";
import SignUp from './SignUp.tsx'; // Import signup page

const titles = [
  "title 1",
  "title 2",
  "title 3",
  "title 4",
  "title 5",
  "title 6",
];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App titles={titles} />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  </StrictMode>
 );
 

//cd react-app
//npm run dev
