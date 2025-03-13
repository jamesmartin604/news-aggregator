import Square from "./square";

interface Props {
  titles: string[];
}
function Squares({ titles }: Props) {
  return (
    <>
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Top One-Third (empty space or header if needed) */}
        <div style={{ flex: 1 }}>
          <h1 className="d-flex justify-content-center">AFFaiRs</h1>
        </div>

        {/* Bottom Two-Thirds (with squares) */}
        <div style={{ flex: 2 }} className="d-flex flex-column">
          {/* First Row of Squares */}
          <div
            className="d-flex justify-content-center align-items-center flex-grow-1"
            style={{ width: "100%" }}
          >
            {titles.slice(0, 3).map((title) => (
              <Square key={title} label={title} grow />
            ))}
          </div>

          {/* Second Row of Squares */}
          <div
            className="d-flex justify-content-center align-items-center flex-grow-1"
            style={{ width: "100%" }}
          >
            {titles.slice(3, 6).map((title) => (
              <Square key={title} label={title} grow />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Squares;
