import Square from "./square";
import {useState} from "react";
import LargeSquare from "./LargeSquare";//import large square for showing summary

interface Article {
  title: string;
  image: string;
  description: string;
  url: string;
  source: string;
  published_at: Date;
}

interface Props {
  articles: Article[];
  handleCategoryChange: (category: string) => void; // Add handleCategoryChange prop
  currentCategory: string; // Add currentCategory prop
}

function Squares({ articles, handleCategoryChange, currentCategory }: Props) {
  const[activeSquare, setActiveSquare] = useState<Article | null>(null); //state to cheep track of what square is clicked or not

   const squareClicked = (article: Article) =>{//when square is clicked, open large square
  setActiveSquare((prev) => ( prev && prev.title === article.title ? null: article)); 
  }

  return (
    <div className="squares-container"
      onClick={() => setActiveSquare(null)} //click anywhere not in large square when its active to close large square
      >

      {/* Top One-Third*/}
      <div className="squares-header">
        <h1>
          <span className="highlight">AI</span>RS
        </h1>
      </div>

      {/* Bottom Two-Thirds (with squares and navbar) */}
      <div className="navbar">
        <ul className="navlinks">
          <li>
            <a href="#" onClick={() => handleCategoryChange("general")} className={currentCategory === "general" ? "active" : ""}>
              General
            </a>
          </li>
          <li>
            <a href="#" onClick={() => handleCategoryChange("sports")} className={currentCategory === "sports" ? "active" : ""}>
              Sports
            </a>
          </li>
          <li>
            <a href="#" onClick={() => handleCategoryChange("technology")} className={currentCategory === "technology" ? "active" : ""}>
              Technology
            </a>
          </li>
          <li>
            <a href="#" onClick={() => handleCategoryChange("entertainment")} className={currentCategory === "entertainment" ? "active" : ""}>
              Entertainment
            </a>
          </li>
        </ul>
      </div>
      <div className="squares-content">
        {/* First Row of Squares */}
        <div className="squares-row">
          {articles.slice(0, 4).map((article) => (
              <div key={article.title} onClick={(e) => { 
                e.stopPropagation();
                squareClicked(article); //if square is clicked, open function squareClicked
              }} >
            <Square
              key={article.title}
              title={article.title}
              imageUrl={article.image}
              grow
            />
            </div>
          ))}
        </div>

        {/* Second Row of Squares */}
        <div className="squares-row">
          {articles.slice(4, 8).map((article) => (
            <div key={article.title} onClick={(e) => {
              e.stopPropagation();
            squareClicked(article); //if square is clicked, open function squareClicked
            }} >
            <Square
              key={article.title}
              title={article.title}
              imageUrl={article.image}
              grow
            />
            </div>
          ))}
        </div>
        {activeSquare &&( //render large square, overlay makes it a popup
        <div className="overlay" onClick={(e) => e.stopPropagation()}> 
        <LargeSquare article={activeSquare} onClose={() => setActiveSquare(null)} />
          </div>
        )}

      </div>
    </div>
  );
}

export default Squares;
