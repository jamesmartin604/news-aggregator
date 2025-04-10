import React from "react";

interface Article { 
    title: string;
    image: string;
    description: string,
    url: string,
    source: string;
    published_at: Date | string ; //published_at can be treated as a date or string
  }

  const formatDate = (date: Date | string ): string => { //this makes the Date into a more readable String
    const oldDate = new Date(date); //if date is being read as a string, make it a Date
   let hours = oldDate.getHours();
   let minutes = oldDate.getMinutes();
   let ampm = hours >= 12 ? "pm" : "am"; //using 12-hour format AM PM

   hours = hours % 12; //convert hours to 12-hour format
   if (hours === 0) { //if hours=0, then make it 12 
       hours = 12; 
   }

   let newMinutes= minutes < 10 ? `0${minutes}` : minutes; //adds a 0 in front of a single digit minute

   let month = oldDate.getMonth() + 1; // months are 0 indexed, so we add 1
   let day = oldDate.getDate();
   let year = oldDate.getFullYear(); 

   // should look like for example 2:30pm 2/3/2025   
   return `${hours}:${newMinutes}${ampm} ${month}/${day}/${year}`;
};

interface LargeSquareProps {
  article: Article;
  onClose: () => void; //=> void means it returns nothing
}

const LargeSquare: React.FC<LargeSquareProps> = ({ article, onClose }) => {
  return (
    <div className={`largeSquare`}>
        <button onClick={onClose} className="largeSquareButton">
<span
    style={{ //for some reason x is off-center without this style
      position: "relative",
      top: "-2px",
    }}
  >
    ×
  </span>
</button>
<div style={{height: "10px"} } /> {/*this makes it so that the title text is less likely to be covered by the X close button */}
        <h5>{article.title}</h5>
        <br></br>
       <p>{article.description}</p>
       <br></br>
       <p>Read more: <a href={article.url}>{article.source}</a></p>
       <p className="largeSquareDate">Published: {formatDate(article.published_at)}</p>
      
    </div>
  );
};

export default LargeSquare;
