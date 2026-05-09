import type { AppProps } from "next/app";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: { url: "https://fullnode.testnet.sui.io" },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
      <WalletProvider autoConnect>
        <Component {...pageProps} />
      </WalletProvider>
    </SuiClientProvider>
  );
}
