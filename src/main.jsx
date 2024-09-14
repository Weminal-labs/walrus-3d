import ReactDOM from "react-dom/client";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import MyRouter from "./router/MyRouter";
import { CollectionProvider } from "./context/CollectionProvider";

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
});
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <WalletProvider>
        <CollectionProvider>
          <MyRouter />
        </CollectionProvider>
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>
);
