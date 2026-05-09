import type { AppProps } from "next/app";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import "@mysten/dapp-kit/dist/index.css";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SuiClientProvider networks={{ testnet: client }} defaultNetwork="testnet">
      <WalletProvider autoConnect>
        <Component {...pageProps} />
      </WalletProvider>
    </SuiClientProvider>
  );
}
