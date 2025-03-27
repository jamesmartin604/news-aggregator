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
  const [category, setCategory] = useState<string>('technology'); // state for selected category

  useEffect(() => {

    //Clear articles before fetching new ones
    setBackendData([]);

    fetch(`http://localhost:5000/articles?category=${category}`) // fetch articles based on category
      .then((response) => response.json())
      .then((data) => {
        setBackendData(data); // Set the fetched data to backendData
      })
      .catch((error) => {
        console.log("Error fetching data:", error);
      });
  }, [category]); // refreshed data when category is changed

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory); // Update category state
  };

  return (
    <div>
      <Squares articles={backendData} handleCategoryChange={handleCategoryChange} />
    </div>
  );
}

export default App;