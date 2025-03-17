import Squares from "./components/squares"; // Make sure the import path is correct!
import React, { useEffect, useState } from 'react';
import "./App.css";

function App() {
  const [backendData, setBackendData] = useState<{ title: string }[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/articles")
      .then(response => response.json())
      .then(data => {
        setBackendData(data); // Set the fetched data to backendData
      })
      .catch(error => {
        console.log('Error fetching data:', error);
      });
  }, []);

  // Extract titles from backendData
  const titles = backendData.map(article => article.title);

  return (
    <div>
      <p>Article: {backendData[0]?.title || 'Loading...'}</p>
      <Squares titles={titles} />
    </div>
  );
}

export default App;