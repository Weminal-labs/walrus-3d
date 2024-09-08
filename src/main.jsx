import ReactDOM from "react-dom/client";
import "./index.css";
import MyRouter from "./router/MyRouter";
import { CollectionProvider } from "./context/CollectionProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
    <CollectionProvider>
        <MyRouter />
    </CollectionProvider>
);
