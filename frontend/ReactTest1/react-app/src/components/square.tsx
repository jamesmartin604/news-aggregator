import React from "react";

interface SquareProps {
  label: number | string;
  grow?: boolean;
}

const Square: React.FC<SquareProps> = ({ label, grow }) => {
  return (
    <div
      className={`d-flex align-items-center justify-content-center bg-success text-white rounded m-2 ${
        grow ? "flex-fill" : ""
      }`}
      style={{
        height: "100%",
        maxHeight: "200px", // Max height to keep them from growing too tall
        minHeight: "100px",
        maxWidth: "200px",
        minWidth: "100px",
        aspectRatio: "1 / 1", // Keeps it square
      }}
    >
      {label}
    </div>
  );
};

export default Square;
