import Square from "./square";

interface Article {
  title: string;
  image: string;
}

interface Props {
  articles: Article[];
  handleCategoryChange: (category: string) => void; // Add handleCategoryChange prop
}

function Squares({ articles, handleCategoryChange }: Props) {
  return (
    <div className="squares-container">
      {/* Top One-Third*/}
      <div className="squares-header">
        <h1>
          AFF<span className="highlight">AI</span>RS
        </h1>
      </div>

      {/* Bottom Two-Thirds (with squares and navbar) */}
      <div className="navbar">
        <ul className="navlinks">
          <li>
            <a href="#" onClick={() => handleCategoryChange("general")}>
              General
            </a>
          </li>
          <li>
            <a href="#" onClick={() => handleCategoryChange("sports")}>
              Sports
            </a>
          </li>
          <li>
            <a href="#" onClick={() => handleCategoryChange("technology")}>
              Technology
            </a>
          </li>
          <li>
            <a href="#" onClick={() => handleCategoryChange("entertainment")}>
              Entertainment
            </a>
          </li>
        </ul>
      </div>
      <div className="squares-content">
        {/* First Row of Squares */}
        <div className="squares-row">
          {articles.slice(0, 4).map((article) => (
            <Square
              key={article.title}
              title={article.title}
              imageUrl={article.image}
              grow
            />
          ))}
        </div>

        {/* Second Row of Squares */}
        <div className="squares-row">
          {articles.slice(4, 8).map((article) => (
            <Square
              key={article.title}
              title={article.title}
              imageUrl={article.image}
              grow
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Squares;
