import Squares from "./components/squares"; // Make sure the import path is correct!
import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import SignUp from "./SignUp.tsx";
import "./App.css";
import Loader from "./components/Loader.tsx";
import { Link } from "react-router-dom"; // Import Link here

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
  const [category, setCategory] = useState<string>("technology"); // state for selected category
  const loading = useLoading(); //for loading animation
  const [isDarkMode, setIsDarkMode] = useState(false);

  // makes it so that dark mode covers all of the html page
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode"); //adds .dark-mode to html
    } else {
      document.documentElement.classList.remove("dark-mode"); //removes .dark-mode from html
    }
  }, [isDarkMode]);

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

  const currentDate = new Date().toLocaleDateString();

  return (
    <div className={`app-container ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <hr />
      <div className="date-container">
        <p className="date"> {currentDate}</p>
        <button
          className="darkModeButton"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <div className="langSupport" id="google_translate_element"  ></div> {/*Google Translate Button */}
        <Link to="/signup">
          <img
            className="user-icon"
            src={isDarkMode ? "/userWhite.png" : "/userBlack.png"}
            alt="User Icon"
          />
        </Link>
      </div>
      <hr />

      {loading ? ( //if page is loading, show loading animation
        <div className="flexbox_center" style={{ marginTop: "20%" }}>
          <Loader />
        </div>
      ) : (
        //once page has loaded
        <div>
          <Squares
            articles={backendData}
            handleCategoryChange={handleCategoryChange}
            currentCategory={category} // Pass the current category to Squares component
          />
        </div>
      )}
    </div>
  );
}

export default App;
