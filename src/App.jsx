import Canvas from "./canvas";

import Customizer from "./pages/Customizer";
import Home from "./pages/Home";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCollection } from "./context/CollectionProvider";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [decalImageURL, setDecalImageURL] = useState(null);

  let { id } = useParams();
  const { collection } = useCollection();
  const collectionFound = collection.find((item) => {
    return item.id == id;
  });
  console.log(collectionFound);

  const showToast = (message) => {
    toast(message);
  };

  return (
    <>
      <main className="app transition-all ease-in">
        <Home />
        <Canvas
          collectionFound={collectionFound}
          decalImageURL={decalImageURL}
        />
        <Customizer
          decalImageURL={decalImageURL}
          setDecalImageURL={setDecalImageURL}
          showToast={showToast}
        />
      </main>
      <ToastContainer
        position="bottom-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={false}
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
