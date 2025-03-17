import Square from "./square";

interface Props {
  titles: string[];
}

function Squares({ titles }: Props) {
  return (
    <div className="squares-container">
      {/* Top One-Third (empty space or header if needed) */}
      <div className="squares-header">
        <h1>AFFaiRs</h1>
      </div>

      {/* Bottom Two-Thirds (with squares) */}
      <div className="squares-content">
        {/* First Row of Squares */}
        <div className="squares-row">
          {titles.slice(0, 3).map((title) => (
            <Square key={title} label={title} grow />
          ))}
        </div>

        {/* Second Row of Squares */}
        <div className="squares-row">
          {titles.slice(3, 6).map((title) => (
            <Square key={title} label={title} grow />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Squares;