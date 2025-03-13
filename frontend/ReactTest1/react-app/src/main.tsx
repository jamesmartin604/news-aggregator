import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import App from "./App.tsx";

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
    <App titles={titles} />
  </StrictMode>
);

//cd react-app
//npm run dev
