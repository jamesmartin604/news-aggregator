import Squares from "./components/squares"; // Make sure the import path is correct!
import React, { useEffect, useState } from 'react'

interface Props {
  titles: string[];
}

function App({ titles }: Props) {

  const [backendData, setBackendData] = useState([{}]);

  useEffect(() => {
    fetch("http://localhost:5000/articles")
      .then(response => response.json())
      .then(data => {setBackendData(data)})
  }, []);

  return (
    <div>
      <p>Article: {backendData[0].title}</p>
      <Squares titles={titles} />
    </div>
  );
}

export default App;

//test
