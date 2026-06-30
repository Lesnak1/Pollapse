'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { RelayClient } from '@polymarket/builder-relayer-client';
import { getContractConfig, Side, OrderType } from '@polymarket/clob-client-v2';
import { getClientClobClient } from '@/lib/trading/clobClientHelper';
import { encodeFunctionData, parseAbi } from 'viem';
import { ArrowUpRight, CheckCircle, AlertTriangle, RefreshCw, Lock, Play } from 'lucide-react';

export default function MinimalTradeComponent() {
  const { authenticated, address, login, logout, getSigner } = useWallet();

  // Onboarding States
  const [safeAddress, setSafeAddress] = useState<string | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [deploymentTx, setDeploymentTx] = useState<string | null>(null);
  const [approvalsDone, setApprovalsDone] = useState<boolean>(false);
  const [l2Creds, setL2Creds] = useState<{ key: string; secret: string; passphrase: string } | null>(null);

  // Form States
  const [tokenId, setTokenId] = useState<string>('30499731947464516579580181356221397335865912996104577000510883912653418218808'); // default World Cup Yes token
  const [side, setSide] = useState<Side>(Side.BUY);
  const [orderType, setOrderType] = useState<string>('market');
  const [size, setSize] = useState<number>(2); // ~$2 market buy
  const [price, setPrice] = useState<number>(0.50);

  // Status logs
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleDeriveWallet = async () => {
    setLoading(true);
    addLog('Deriving Gnosis Safe/Deposit Wallet address...');
    try {
      const signer = await getSigner();
      if (!signer) {
        addLog('❌ Error: Wallet signer not available.');
        setLoading(false);
        return;
      }
      const relayClient = new RelayClient(
        'https://relayer-v2.polymarket.com/',
        137,
        signer as any
      );
      const derived = await relayClient.deriveDepositWalletAddress();
      setSafeAddress(derived);
      addLog(`Wallet derived: ${derived}`);

      // Check if deployed
      const deployed = await relayClient.getDeployed(derived, 'WALLET');
      setIsDeployed(deployed);
      addLog(`Wallet deployment status: ${deployed ? '🟢 DEPLOYED' : '🔴 NOT DEPLOYED'}`);
    } catch (e: any) {
      addLog(`❌ Error deriving wallet: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployWallet = async () => {
    setLoading(true);
    addLog('Initiating gasless deployment of Deposit Wallet...');
    try {
      const signer = await getSigner();
      if (!signer) {
        addLog('❌ Error: Wallet signer not available.');
        setLoading(false);
        return;
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
        setDeploymentTx(mined.transactionHash);
        addLog(`🟢 Wallet successfully deployed! Hash: ${mined.transactionHash}`);
      } else {
        addLog('❌ Transaction deployment failed or timed out.');
      }
    } catch (e: any) {
      addLog(`❌ Error deploying wallet: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchApprovals = async () => {
    setLoading(true);
    addLog('Constructing batch approval transaction...');
    try {
      const signer = await getSigner();
      if (!signer || !safeAddress) {
        addLog('❌ Error: Signer or Safe Address not derived.');
        setLoading(false);
        return;
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
      
      const deadline = Math.floor(Date.now() / 1000 + 3600).toString(); // 1 hour deadline
      const tx = await relayClient.executeDepositWalletBatch(calls, safeAddress, deadline);
      
      addLog(`Batch approval payload sent. ID: ${tx.transactionID}`);
      addLog('Polling for approval mining confirmation...');
      
      const mined = await relayClient.pollUntilState(tx.transactionID, ['STATE_MINED', 'STATE_CONFIRMED']);
      if (mined) {
        setApprovalsDone(true);
        addLog(`🟢 Approvals confirmed! Spenders authorized.`);
      } else {
        addLog('❌ Approvals failed or timed out.');
      }
    } catch (e: any) {
      addLog(`❌ Error in batch approvals: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSession = async () => {
    setLoading(true);
    addLog('Deriving user CLOB L2 Credentials...');
    try {
      const signer = await getSigner();
      if (!signer) {
        addLog('❌ Error: Wallet signer not available.');
        setLoading(false);
        return;
      }
      
      // Temporary client to run derivation
      const tempClient = getClientClobClient(signer, { key: '', secret: '', passphrase: '' });
      const creds = await tempClient.createOrDeriveApiKey();
      
      // Store ONLY in react state memory, never in localStorage
      setL2Creds(creds);
      addLog('🟢 L2 API Credentials successfully derived and loaded in-memory.');
    } catch (e: any) {
      addLog(`❌ Error deriving API credentials: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillLimitPrice = async (targetTokenId: string) => {
    addLog('Fetching orderbook to determine marketable limit price...');
    try {
      const res = await fetch(`https://clob.polymarket.com/book?token_id=${targetTokenId}`);
      const data = await res.json();
      const minTick = data?.tick_size ? parseFloat(data.tick_size) : 0.001;
      const asks = data?.asks || [];
      if (asks.length > 0) {
        const bestAskPrice = parseFloat(asks[0].price);
        const marketablePrice = Number((bestAskPrice + minTick).toFixed(4));
        setPrice(marketablePrice);
        addLog(`🟢 Prefilled limit price to marketable price: $${marketablePrice} (Best Ask: $${bestAskPrice} + 1 Tick: $${minTick})`);
      } else {
        const lastPrice = data?.last_trade_price ? parseFloat(data.last_trade_price) : 0.50;
        setPrice(lastPrice);
        addLog(`⚠️ Orderbook ask side is empty. Using last trade price: $${lastPrice}`);
      }
    } catch (e: any) {
      addLog(`⚠️ Failed to fetch orderbook for prefill: ${e.message}. Using default price of $0.50.`);
      setPrice(0.50);
    }
  };

  useEffect(() => {
    if (orderType === 'limit' && tokenId) {
      handlePrefillLimitPrice(tokenId);
    }
  }, [orderType, tokenId]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    addLog('Building trade order payload...');
    try {
      const signer = await getSigner();
      if (!signer || !l2Creds) {
        addLog('❌ Error: Wallet signer or L2 Credentials not derived.');
        setLoading(false);
        return;
      }

      if (orderType === 'limit') {
        const notional = price * size;
        if (notional < 1) {
          addLog('❌ Error: Order notional must be >= $1 (Polymarket minimum). Increase size or price.');
          setLoading(false);
          return;
        }
      }

      const client = getClientClobClient(signer, l2Creds);
      
      addLog('Resolving market metadata (tick size & neg risk)...');
      const tickSize = (await client.getTickSize(tokenId)) as any;
      const negRisk = await client.getNegRisk(tokenId);
      addLog(`Resolved: tickSize=${tickSize}, negRisk=${negRisk}`);
      
      let response;
      if (orderType === 'limit') {
        addLog(`Signing & Posting Limit ${side} order: ${size} contracts at $${price}...`);
        response = await client.createAndPostOrder(
          {
            tokenID: tokenId,
            price: Number(price),
            size: Number(size),
            side,
            expiration: Math.floor(Date.now() / 1000) + 3600, // 1 hour
          },
          { tickSize, negRisk },
          OrderType.GTC
        );
      } else {
        addLog(`Signing & Posting Market ${side} order: spend $${size}...`);
        response = await client.createAndPostMarketOrder(
          {
            tokenID: tokenId,
            side,
            amount: Number(size), // USDC amount to spend
          } as any,
          { tickSize, negRisk },
          OrderType.FOK
        );
      }

      addLog(`✅ Order successfully matched! Response: ${JSON.stringify(response)}`);
    } catch (e: any) {
      addLog(`❌ Order execution failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, margin: '20px 0' }}>
      
      {/* LEFT: Onboarding Console */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            🪪 Safe User Onboarding
          </h3>
          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: authenticated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: authenticated ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>
            {authenticated ? 'LOGGED IN' : 'DISCONNECTED'}
          </span>
        </div>

        {!authenticated ? (
          <div style={{ padding: '24px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Lock size={32} style={{ color: 'var(--text-dim)', marginBottom: 6 }} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Log in with email or social to automatically generate your embedded wallet EOA.
            </p>
            <button onClick={login} className="btn btn-primary" style={{ width: '100%' }}>
              🔑 Connect / Sign In
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 2 }}>Embedded Wallet EOA</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{address}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Step 1: Derive/Deploy Wallet */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button disabled={loading} onClick={handleDeriveWallet} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  🔍 Derive Wallet
                </button>
                {safeAddress && !isDeployed && (
                  <button disabled={loading} onClick={handleDeployWallet} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    ⚡ Deploy Wallet
                  </button>
                )}
              </div>

              {safeAddress && (
                <div style={{ padding: 10, background: 'var(--bg-layer-3)', border: '1px dotted var(--border-color)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Safe Address:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{safeAddress.slice(0, 8)}...{safeAddress.slice(-6)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Deployed:</span>
                    <strong style={{ color: isDeployed ? 'var(--success)' : 'var(--warning)' }}>{isDeployed ? 'YES (🟢)' : 'NO (🔴)'}</strong>
                  </div>
                </div>
              )}

              {/* Step 2: Batch approvals */}
              <button disabled={loading || !isDeployed} onClick={handleBatchApprovals} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                🔐 Batch approvals (pUSD + CTF)
              </button>

              {/* Step 3: Derivation API keys */}
              <button disabled={loading || !isDeployed} onClick={handleSetupSession} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                🔑 Setup L2 Trading Session
              </button>
            </div>

            <button onClick={logout} className="btn btn-ghost btn-sm" style={{ alignSelf: 'center', color: 'var(--error)' }}>
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Trading Ticket */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
          📊 CLOB Order Ticket (V2)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Token ID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>YES/NO Outcome Token ID</label>
            <input 
              type="text" 
              value={tokenId} 
              onChange={e => setTokenId(e.target.value)}
              style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Side</label>
              <select 
                value={side} 
                onChange={e => setSide(e.target.value as Side)}
                style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value={Side.BUY}>BUY</option>
                <option value={Side.SELL}>SELL</option>
              </select>
            </div>

            {/* Type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Order Type</label>
              <select 
                value={orderType} 
                onChange={e => setOrderType(e.target.value)}
                style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="limit">LIMIT (GTC)</option>
                <option value="market">MARKET (FOK)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Size / Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                {orderType === 'limit' ? 'Size (Shares)' : 'Amount (USDC to spend)'}
              </label>
              <input 
                type="number" 
                value={size} 
                onChange={e => setSize(Math.max(1, Number(e.target.value)))}
                style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {/* Price (Only for LIMIT) */}
            {orderType === 'limit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Limit Price</label>
                  <button 
                    type="button" 
                    onClick={() => handlePrefillLimitPrice(tokenId)}
                    style={{ fontSize: '0.6rem', border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                  >
                    ⚡ Auto-fetch
                  </button>
                </div>
                <input 
                  type="number" 
                  step="0.001" 
                  value={price} 
                  onChange={e => setPrice(Math.max(0.001, Number(e.target.value)))}
                  style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            )}
          </div>

          <button 
            disabled={loading || !l2Creds} 
            onClick={handlePlaceOrder} 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 12 }}
          >
            <Play size={14} style={{ marginRight: 6 }} /> Place Attributed Order
          </button>
          
          <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            💡 <strong>Tip:</strong> Market orders fill instantly and are attributed immediately. Limit orders only attribute volume once they MATCH on the orderbook.
          </div>
        </div>
      </div>

      {/* FULL WIDTH: Console Logs */}
      <div className="col-span-2 card" style={{ padding: 18, background: '#090d16', border: '1px solid var(--border-color)', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
            🛰️ Transaction Console Log Output
          </span>
          <button onClick={() => setLogs([])} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.6rem' }}>
            Clear Logs
          </button>
        </div>
        <div style={{ height: 180, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#38bdf8', display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px', background: '#020617', borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.15)' }}>
          {logs.length === 0 ? (
            <span style={{ color: 'var(--text-dim)' }}>No events logged yet. Connect wallet to begin.</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{ lineBreak: 'anywhere' }}>{log}</div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
