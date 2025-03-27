import Squares from "./components/squares"; // Make sure the import path is correct!
import React, { useEffect, useState } from "react";
import "./App.css";

//creates a new interface for both title and images
interface Article {
  title: string;
  image: string;
}

function App() {
  const [backendData, setBackendData] = useState<Article[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/articles")
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data); // Set the fetched data to backendData
      })
      .catch((error) => {
        console.log("Error fetching data:", error);
      });
  }, []);
  

  //removed 'const titles..' its no longer needed

  return (
    <div>
      <Squares articles={backendData} />
    </div>
  );
}

export default App;
