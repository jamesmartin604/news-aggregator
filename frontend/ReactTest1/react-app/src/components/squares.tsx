import Square from "./square";

interface Article {
  title: string;
  image: string;
}

interface Props {
  articles: Article[];
}

function Squares({ articles }: Props) {
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
            <a href="default.asp">Home</a>
          </li>
          <li>
            <a href="Sports.asp">Sports</a>
          </li>
          <li>
            <a href="Politics.asp">Politics</a>
          </li>
          <li>
            <a href="Entertainment.asp">Entertainment</a>
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
            grow />
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
