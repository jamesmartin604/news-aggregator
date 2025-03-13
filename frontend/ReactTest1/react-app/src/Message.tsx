//tsx files are react components
//react is expected to use PascalCasing
//babeljs.io
function Message() {
  // JavaScript XML - JSX
  const name = "Microsoft Project 2025";
  return <h1>{name}</h1>; //anything that returns a value can be put in the {} brackets
}

export default Message; //exports as a React module

//cd react-app
//npm run dev
