'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useTrade } from '@/hooks/useTrade';
import { Side } from '@polymarket/clob-client-v2';
import { Shield, Info, RefreshCw, X, Play, LogIn, Award } from 'lucide-react';

interface OrderTicketProps {
  tokenId: string;
  initialSide?: Side;
  initialSize?: number;
  initialPrice?: number;
  marketQuestion?: string;
  onClose?: () => void;
}

export default function OrderTicket({
  tokenId,
  initialSide = Side.BUY,
  initialSize = 10,
  initialPrice = 0.50,
  marketQuestion = 'Outcome Token Position',
  onClose
}: OrderTicketProps) {
  const { authenticated, login } = useWallet();
  const trade = useTrade();

  // Inputs
  const [side, setSide] = useState<Side>(initialSide);
  const [price, setPrice] = useState<number>(initialPrice);
  const [size, setSize] = useState<number>(initialSize);
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');

  // Fee preview
  const [feeRate, setFeeRate] = useState<string>('0.00%');
  const [feeLoading, setFeeLoading] = useState<boolean>(false);

  useEffect(() => {
    setSide(initialSide);
  }, [initialSide]);

  useEffect(() => {
    setPrice(initialPrice);
  }, [initialPrice]);

  useEffect(() => {
    setSize(initialSize);
  }, [initialSize]);

  // Load fee preview from GET /api/orders
  useEffect(() => {
    let active = true;
    const loadFeePreview = async () => {
      if (!tokenId) return;
      setFeeLoading(true);
      try {
        const res = await fetch(`/api/orders?tokenID=${tokenId}`);
        if (!res.ok) throw new Error('Failed to fetch fee parameters');
        const data = await res.json();
        if (active && data.success && data.marketInfo) {
          const rateBps = data.marketInfo.fee_rate_bps || 0;
          setFeeRate(`${(rateBps / 100).toFixed(2)}%`);
        }
      } catch (e) {
        if (active) setFeeRate('0.00% (No maker fee)');
      } finally {
        if (active) setFeeLoading(false);
      }
    };

    loadFeePreview();
    return () => {
      active = false;
    };
  }, [tokenId]);

  const handleQuickOnboard = async () => {
    if (!trade.safeAddress) {
      const derived = await trade.deriveWallet();
      if (derived) {
        const deployed = await trade.deployWallet();
        if (deployed) {
          await trade.executeApprovals();
        }
      }
    } else if (!trade.isDeployed) {
      const deployed = await trade.deployWallet();
      if (deployed) {
        await trade.executeApprovals();
      }
    } else if (!trade.approvalsDone) {
      await trade.executeApprovals();
    }
    
    await trade.setupTradingSession();
  };

  const handlePlaceTrade = async () => {
    try {
      await trade.submitOrder({
        tokenId,
        side,
        orderType,
        size,
        price
      });
    } catch {
      // Error is logged in trade.logs
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(2, 6, 23, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div className="card animate-scale-in" style={{
        width: '100%',
        maxWidth: 500,
        background: '#090d16',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(59, 130, 246, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              CLOB Attributed Ticket
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} className="hover-glow">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body Scroll */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Question context */}
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>Target Position</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{marketQuestion}</div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 4, wordBreak: 'break-all' }}>ID: {tokenId}</div>
          </div>

          {/* Privy Login Block */}
          {!authenticated ? (
            <div style={{
              padding: 16,
              background: 'rgba(59, 130, 246, 0.04)',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              borderRadius: 10,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Please sign in with Privy to retrieve your EOA and safe wallet parameters.
              </p>
              <button onClick={login} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <LogIn size={16} /> Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Onboarding Wizard Checklist */}
              {(!trade.safeAddress || !trade.isDeployed || !trade.approvalsDone || !trade.l2Creds) && (
                <div style={{
                  padding: 14,
                  background: 'rgba(245, 158, 11, 0.03)',
                  border: '1px dashed rgba(245, 158, 11, 0.25)',
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <Shield size={14} /> Safe Wallet Setup Required
                  </div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    Deploy your gasless wallet and batch approvals to enable one-click trading.
                  </p>
                  <button 
                    disabled={trade.loading}
                    onClick={handleQuickOnboard} 
                    className="btn btn-secondary btn-sm" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {trade.loading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />} 
                    ⚡ Run Autopilot Setup
                  </button>
                </div>
              )}

              {/* Order fields */}
              {trade.l2Creds && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Side selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Side</label>
                      <select 
                        value={side} 
                        onChange={e => setSide(e.target.value as Side)}
                        style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value={Side.BUY}>BUY (YES/NO)</option>
                        <option value={Side.SELL}>SELL (YES/NO)</option>
                      </select>
                    </div>

                    {/* Order Type */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Type</label>
                      <select 
                        value={orderType} 
                        onChange={e => setOrderType(e.target.value as any)}
                        style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        <option value="limit">LIMIT (GTC)</option>
                        <option value="market">MARKET (FOK)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Size */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {orderType === 'limit' ? 'Size (Shares)' : 'Budget (USDC)'}
                      </label>
                      <input 
                        type="number" 
                        value={size} 
                        onChange={e => setSize(Math.max(1, Number(e.target.value)))}
                        style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>

                    {/* Price */}
                    {orderType === 'limit' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Limit Price</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={price} 
                          onChange={e => setPrice(Math.max(0.01, Number(e.target.value)))}
                          style={{ padding: '8px 12px', background: 'var(--bg-layer-2)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-primary)', outline: 'none' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Fee Preview Box */}
                  <div style={{
                    padding: 10,
                    background: 'var(--bg-layer-2)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Info size={12} /> Fee Rate (Platform/Builder):
                    </span>
                    <strong>{feeLoading ? 'Loading...' : feeRate}</strong>
                  </div>

                  <button 
                    disabled={trade.loading}
                    onClick={handlePlaceTrade} 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    {trade.loading ? <RefreshCw size={14} className="animate-spin" style={{ marginRight: 6 }} /> : <Play size={14} style={{ marginRight: 6 }} />} 
                    ⚡ Execute Safe Order
                  </button>
                </div>
              )}
            </>
          )}

          {/* Console logs */}
          {trade.logs.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: '#020617',
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(56, 189, 248, 0.15)',
              maxHeight: 120,
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                <span>Log Output</span>
                <button onClick={trade.clearLogs} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.6rem', cursor: 'pointer' }}>Clear</button>
              </div>
              {trade.logs.map((log, index) => (
                <div key={index} style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#38bdf8', lineBreak: 'anywhere' }}>{log}</div>
              ))}
            </div>
          )}

          {/* Non-Custodial Disclaimer */}
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--text-dim)',
            lineHeight: 1.4,
            padding: '10px 12px',
            background: 'var(--bg-layer-2)',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            display: 'flex',
            gap: 8
          }}>
            <Shield size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span>
              <strong>Non-Custodial execution:</strong> All transactions are signed by your Privy embedded EOA and routed gaslessly. Pollapse does not hold or control your private keys or deposits.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
