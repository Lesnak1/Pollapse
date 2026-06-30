'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { getContractConfig, Side, OrderType } from '@polymarket/clob-client-v2';
import { getClientClobClient } from '@/lib/trading/clobClientHelper';
import { encodeFunctionData, parseAbi } from 'viem';

export interface TradeState {
  loading: boolean;
  logs: string[];
  safeAddress: string | null;
  isDeployed: boolean;
  approvalsDone: boolean;
  l2Creds: { key: string; secret: string; passphrase: string } | null;
  deriveWallet: () => Promise<string | null>;
  deployWallet: () => Promise<boolean>;
  executeApprovals: () => Promise<boolean>;
  setupTradingSession: () => Promise<boolean>;
  submitOrder: (params: {
    tokenId: string;
    side: Side;
    orderType: 'limit' | 'market';
    size: number;
    price?: number;
  }) => Promise<any>;
  clearLogs: () => void;
}

export function useTrade(): TradeState {
  const { address, getSigner } = useWallet();
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [approvalsDone, setApprovalsDone] = useState<boolean>(false);
  const [l2Creds, setL2Creds] = useState<{ key: string; secret: string; passphrase: string } | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const deriveWallet = async (): Promise<string | null> => {
    setLoading(true);
    addLog('Deriving Gnosis Safe/Deposit Wallet address...');
    try {
      const signer = await getSigner();
      if (!signer) {
        addLog('❌ Error: Wallet signer not available.');
        setLoading(false);
        return null;
      }
      const relayClient = new RelayClient(
        'https://relayer-v2.polymarket.com/',
        137,
        signer as any
      );
      const derived = await relayClient.deriveDepositWalletAddress();
      setSafeAddress(derived);
      addLog(`Wallet derived: ${derived}`);

      const deployed = await relayClient.getDeployed(derived, 'WALLET');
      setIsDeployed(deployed);
      addLog(`Wallet deployment status: ${deployed ? '🟢 DEPLOYED' : '🔴 NOT DEPLOYED'}`);
      return derived;
    } catch (e: any) {
      addLog(`❌ Error deriving wallet: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deployWallet = async (): Promise<boolean> => {
    setLoading(true);
    addLog('Initiating gasless deployment of Deposit Wallet...');
    try {
      const signer = await getSigner();
      if (!signer) {
        addLog('❌ Error: Wallet signer not available.');
        setLoading(false);
        return false;
      }
      const relayClient = new RelayClient(
        'https://relayer-v2.polymarket.com/',
        137,
        signer as any
      );
      const tx = await relayClient.deployDepositWallet();
      addLog(`Deployment transaction submitted. ID: ${tx.transactionID}`);
      addLog('Polling relayer for transaction mining...');
      
      const mined = await relayClient.pollUntilState(tx.transactionID, ['STATE_MINED', 'STATE_CONFIRMED']);
      if (mined) {
        setIsDeployed(true);
        addLog(`🟢 Wallet successfully deployed! Hash: ${mined.transactionHash}`);
        return true;
      } else {
        addLog('❌ Transaction deployment failed or timed out.');
        return false;
      }
    } catch (e: any) {
      addLog(`❌ Error deploying wallet: ${e.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const executeApprovals = async (): Promise<boolean> => {
    setLoading(true);
    addLog('Constructing batch approval transaction...');
    try {
      const signer = await getSigner();
      if (!signer || !safeAddress) {
        addLog('❌ Error: Signer or Safe Address not derived.');
        setLoading(false);
        return false;
      }

      const contracts = getContractConfig(137);
      const spenders = [
        contracts.exchange,
        contracts.negRiskExchange,
        contracts.exchangeV2,
        contracts.negRiskExchangeV2,
        contracts.negRiskAdapter
      ];

      // Sanity check config spenders
      spenders.forEach((spender, i) => {
        if (!spender) {
          console.warn(`Spender config at index ${i} is undefined. Check contractConfig mappings!`);
          addLog(`⚠️ Warning: Spender config at index ${i} is undefined.`);
        }
      });

      const validSpenders = spenders.filter(Boolean);

      const calls: any[] = [];
      const erc20Abi = parseAbi([
        'function approve(address spender, uint256 amount) public returns (bool)'
      ]);
      const erc1155Abi = parseAbi([
        'function setApprovalForAll(address operator, bool approved) public'
      ]);

      const maxUint = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

      for (const spender of validSpenders) {
        if (contracts.collateral) {
          calls.push({
            target: contracts.collateral,
            value: '0',
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [spender as `0x${string}`, maxUint],
            }),
          });
        }
        if (contracts.conditionalTokens) {
          calls.push({
            target: contracts.conditionalTokens,
            value: '0',
            data: encodeFunctionData({
              abi: erc1155Abi,
              functionName: 'setApprovalForAll',
              args: [spender as `0x${string}`, true],
            }),
          });
        }
      }

      addLog(`Submitting batch approvals for ${spenders.length} spender contracts...`);
      const relayClient = new RelayClient(
        'https://relayer-v2.polymarket.com/',
        137,
        signer as any
      );
      
      const deadline = Math.floor(Date.now() / 1000 + 3600).toString();
      const tx = await relayClient.executeDepositWalletBatch(calls, safeAddress, deadline);
      
      addLog(`Batch approval payload sent. ID: ${tx.transactionID}`);
      addLog('Polling for approval mining confirmation...');
      
      const mined = await relayClient.pollUntilState(tx.transactionID, ['STATE_MINED', 'STATE_CONFIRMED']);
      if (mined) {
        setApprovalsDone(true);
        addLog(`🟢 Approvals confirmed! Spenders authorized.`);
        return true;
      } else {
        addLog('❌ Approvals failed or timed out.');
        return false;
      }
    } catch (e: any) {
      addLog(`❌ Error in batch approvals: ${e.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setupTradingSession = async (): Promise<boolean> => {
    setLoading(true);
    addLog('Deriving user CLOB L2 Credentials...');
    try {
      const signer = await getSigner();
      if (!signer) {
        addLog('❌ Error: Wallet signer not available.');
        setLoading(false);
        return false;
      }
      
      const tempClient = getClientClobClient(signer, { key: '', secret: '', passphrase: '' });
      const creds = await tempClient.createOrDeriveApiKey();
      
      setL2Creds(creds);
      addLog('🟢 L2 API Credentials successfully derived and loaded in-memory.');
      return true;
    } catch (e: any) {
      addLog(`❌ Error deriving API credentials: ${e.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (params: {
    tokenId: string;
    side: Side;
    orderType: 'limit' | 'market';
    size: number;
    price?: number;
  }): Promise<any> => {
    setLoading(true);
    addLog(`Building trade order payload for ${params.tokenId}...`);
    try {
      const signer = await getSigner();
      if (!signer || !l2Creds) {
        addLog('❌ Error: Wallet signer or L2 Credentials not derived.');
        setLoading(false);
        return null;
      }

      const client = getClientClobClient(signer, l2Creds);
      
      addLog('Resolving market metadata (tick size & neg risk)...');
      const tickSize = (await client.getTickSize(params.tokenId)) as any;
      const negRisk = await client.getNegRisk(params.tokenId);
      addLog(`Resolved: tickSize=${tickSize}, negRisk=${negRisk}`);
      
      let response;
      if (params.orderType === 'limit') {
        addLog(`Signing & Posting Limit ${params.side} order: ${params.size} contracts at $${params.price}...`);
        response = await client.createAndPostOrder(
          {
            tokenID: params.tokenId,
            price: Number(params.price),
            size: Number(params.size),
            side: params.side,
            expiration: Math.floor(Date.now() / 1000) + 3600,
          },
          { tickSize, negRisk },
          OrderType.GTC
        );
      } else {
        addLog(`Signing & Posting Market ${params.side} order: spend $${params.size}...`);
        response = await client.createAndPostMarketOrder(
          {
            tokenID: params.tokenId,
            side: params.side,
            amount: Number(params.size),
          } as any,
          { tickSize, negRisk },
          OrderType.FOK
        );
      }

      addLog(`✅ Order successfully matched! Response: ${JSON.stringify(response)}`);
      return response;
    } catch (e: any) {
      addLog(`❌ Order execution failed: ${e.message}`);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    logs,
    safeAddress,
    isDeployed,
    approvalsDone,
    l2Creds,
    deriveWallet,
    deployWallet,
    executeApprovals,
    setupTradingSession,
    submitOrder,
    clearLogs,
  };
}
