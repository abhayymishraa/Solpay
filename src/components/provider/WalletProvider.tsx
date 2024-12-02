import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";
import { MAINNET_URL } from "../../lib/config";

export default function WalletProvide({
  children,
}: {
  children: React.ReactNode;
}) {
  const customUrl = MAINNET_URL;
  const endPoint = useMemo(() => customUrl, [customUrl]);
  return (
    <ConnectionProvider endpoint={endPoint}>
      {/* endPoint == Rpc endPoint */}
      <WalletProvider wallets={[]} autoConnect>
        {/* wallet is used in this in some case wallets are not used */}
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
