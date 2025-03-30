import Squares from "./components/squares"; // Make sure the import path is correct!
import React, { useEffect, useState } from "react";
import "./App.css";
import Loader from "./components/Loader.tsx";

//creates a new interface for both title and images
interface Article {
  title: string;
  image: string;
}

//Loading animation function
const useLoading = () => { 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      setLoading(true); // Start loading when page starts

      const timer = setTimeout(() => {
          setLoading(false); // Stop loading once the page is ready
      }, 1000); // wait 1 second to be sure page is loaded (can be deleted if delay is annoying)

      return () => clearTimeout(timer); // Cleanup on unmount
  }, []); // [] means it only runs once per refresh

  return loading;
};


function App() {
  const [backendData, setBackendData] = useState<Article[]>([]);
  const [category, setCategory] = useState<string>('technology'); // state for selected category
  const loading = useLoading(); //for loading animation

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
    {loading ? ( //if page is loading, show loading animation
                
                <div className="flexbox_center"  style={{ marginTop: "20%" }}>
                    <Loader />
                </div>
                
            ) : ( //once page has loaded
      <Squares articles={backendData} handleCategoryChange={handleCategoryChange} />
    )}
    </div>
  );
}

export default App;