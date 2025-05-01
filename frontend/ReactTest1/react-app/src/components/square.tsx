import React from "react";

interface SquareProps {
  title: string;
  imageUrl: string;
  grow?: boolean;
}

const truncateText = (text: string, maxLength: number) => {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
};

const Square: React.FC<SquareProps> = ({ title, imageUrl, grow }) => {
  const truncatedTitle = truncateText(title, 80); // Adjust length as needed

  return (
    <div className={`square ${grow ? "grow" : ""}`}>
      <div className="square-content">
        <div className="square-content-image">
          <img src={imageUrl} alt={title} className="square-image" />
        </div>
        <div className="square-title">{truncatedTitle}</div>
      </div>
    </div>
  );
};

export default Square;
