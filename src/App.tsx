import { useState } from "react";
import "./App.css";
import FileHasherWorker from "./FileHasherWorker";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <FileHasherWorker />
    </div>
  );
}

export default App;
