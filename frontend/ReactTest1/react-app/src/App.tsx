import Squares from "./components/squares"; // Make sure the import path is correct!

const titles = [
  "title 1",
  "title 2",
  "title 3",
  "title 4",
  "title 5",
  "title 6",
];

function App() {
  return (
    <div>
      <Squares titles={titles} />
    </div>
  );
}

export default App;
