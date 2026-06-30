'use client';

import { usePrivy, useWallets, ConnectedWallet } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface WalletState {
  login: () => void;
  logout: () => Promise<void>;
  authenticated: boolean;
  ready: boolean;
  user: any;
  embeddedWallet: ConnectedWallet | null;
  address: string | null;
  getSigner: () => Promise<JsonRpcSigner | null>;
}

export function useWallet(): WalletState {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();
  const [embeddedWallet, setEmbeddedWallet] = useState<ConnectedWallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      // Find the Privy embedded wallet (or first wallet)
      const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
      if (wallet) {
        setEmbeddedWallet(wallet);
        setAddress(wallet.address);
      }
    } else {
      setEmbeddedWallet(null);
      setAddress(null);
    }
  }, [authenticated, wallets]);

  const getSigner = async (): Promise<JsonRpcSigner | null> => {
    if (!embeddedWallet) return null;
    try {
      const provider = await embeddedWallet.getEthereumProvider();
      // BrowserProvider works for Ethers v6. For v5 it is providers.Web3Provider.
      // Let's support both V5 and V6 by dynamically resolving.
      const ethers = require('ethers');
      if (ethers.BrowserProvider) {
        const browserProvider = new ethers.BrowserProvider(provider);
        return await browserProvider.getSigner();
      } else if (ethers.providers && ethers.providers.Web3Provider) {
        const web3Provider = new ethers.providers.Web3Provider(provider);
        return web3Provider.getSigner();
      }
      return null;
    } catch (e) {
      console.error('Failed to get signer from Privy wallet:', e);
      return null;
    }
  };

  return {
    login,
    logout,
    authenticated,
    ready,
    user,
    embeddedWallet,
    address,
    getSigner,
  };
}
