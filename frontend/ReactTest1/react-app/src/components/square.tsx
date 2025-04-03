import React from "react";

interface SquareProps {
  title: string;
  imageUrl: string;
  grow?: boolean;
}

const Square: React.FC<SquareProps> = ({ title, imageUrl, grow }) => {
  return (
    <div className={`square ${grow ? "grow" : ""}`}>
      <div className="square-content">
        <div className="square-content-image">
          <img src={imageUrl} alt={title} className="square-image" />
        </div>
        <div className="square-title">{title}</div>
      </div>
    </div>
  );
};

export default Square;
