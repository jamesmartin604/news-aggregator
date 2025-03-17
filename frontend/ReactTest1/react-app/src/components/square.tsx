import React from "react";

interface SquareProps {
  label: number | string;
  grow?: boolean;
}

const Square: React.FC<SquareProps> = ({ label, grow }) => {
  return (
    <div className={`square ${grow ? "grow" : ""}`}>
      {label}
    </div>
  );
};

export default Square;