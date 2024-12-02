import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import WalletProvide from "./components/provider/WalletProvider.tsx";
import { Toaster } from "./components/ui/toaster.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvide>
      <App />
      <Toaster />
    </WalletProvide>
  </StrictMode>
);
