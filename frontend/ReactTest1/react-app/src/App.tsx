import Squares from "./components/squares"; // Make sure the import path is correct!

interface Props {
  titles: string[];
}

function App({ titles }: Props) {
  return (
    <div>
      <Squares titles={titles} />
    </div>
  );
}

export default App;

//test
