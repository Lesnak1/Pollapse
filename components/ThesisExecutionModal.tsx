'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useTrade } from '@/hooks/useTrade';
import { Side } from '@polymarket/clob-client-v2';
import { Shield, Play, RefreshCw, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ThesisLeg {
  id: string | number;
  question: string;
  prediction: 'YES' | 'NO';
  price: number;
  weight: number;
  tokens?: any[];
  clobTokenIds?: any;
}

interface ThesisExecutionModalProps {
  thesisItems: ThesisLeg[];
  thesisName: string;
  onClose: () => void;
}

interface LegStatus {
  id: string | number;
  question: string;
  status: 'idle' | 'signing' | 'success' | 'failed';
  orderId?: string;
  error?: string;
}

export default function ThesisExecutionModal({
  thesisItems,
  thesisName,
  onClose
}: ThesisExecutionModalProps) {
  const { authenticated, login } = useWallet();
  const { loading, safeAddress, isDeployed, approvalsDone, l2Creds, deriveWallet, deployWallet, executeApprovals, setupTradingSession, submitOrder, logs } = useTrade();

  const [statusList, setStatusList] = useState<LegStatus[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [onboardLoading, setOnboardLoading] = useState<boolean>(false);

  useEffect(() => {
    setStatusList(
      thesisItems.map(item => ({
        id: item.id,
        question: item.question,
        status: 'idle'
      }))
    );
  }, [thesisItems]);

  const getOutcomeTokenId = (item: ThesisLeg) => {
    const targetOutcome = item.prediction;
    let tokenId = null;
    if (item.tokens && item.tokens.length > 0) {
      const tok = item.tokens.find(t => t.outcome.toLowerCase() === targetOutcome.toLowerCase());
      tokenId = tok ? tok.token_id : null;
    }
    if (!tokenId && item.clobTokenIds) {
      try {
        const ids = typeof item.clobTokenIds === 'string' ? JSON.parse(item.clobTokenIds) : item.clobTokenIds;
        tokenId = targetOutcome === 'YES' ? ids?.[0] : ids?.[1];
      } catch {}
    }
    return tokenId;
  };

  const handleQuickOnboard = async () => {
    setOnboardLoading(true);
    try {
      if (!safeAddress) {
        const derived = await deriveWallet();
        if (derived) {
          const deployed = await deployWallet();
          if (deployed) {
            await executeApprovals();
          }
        }
      } else if (!isDeployed) {
        const deployed = await deployWallet();
        if (deployed) {
          await executeApprovals();
        }
      } else if (!approvalsDone) {
        await executeApprovals();
      }
      await setupTradingSession();
    } catch (e) {
      console.error(e);
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleStartExecution = async () => {
    if (!l2Creds) return;
    setRunning(true);
    const results = [...statusList];

    for (let i = 0; i < thesisItems.length; i++) {
      const item = thesisItems[i];
      results[i].status = 'signing';
      setStatusList([...results]);

      try {
        const tokenId = getOutcomeTokenId(item);
        if (!tokenId) {
          throw new Error('Outcome Token ID could not be resolved');
        }

        const size = item.weight * 5; // Weight-scaled sizes
        const priceLimit = item.prediction === 'YES' ? item.price : 1 - item.price;

        const response = await submitOrder({
          tokenId,
          side: Side.BUY,
          orderType: 'limit',
          size,
          price: Number(priceLimit.toFixed(3))
        });

        results[i].status = 'success';
        results[i].orderId = response?.orderID || 'Submitted';
      } catch (err: any) {
        results[i].status = 'failed';
        results[i].error = err.message || 'Execution error';
      }
      setStatusList([...results]);
      await new Promise(r => setTimeout(r, 800)); // Pause between legs
    }
    setRunning(false);
  };

  const allDone = statusList.length > 0 && statusList.every(s => s.status === 'success' || s.status === 'failed');

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
        maxWidth: 550,
        background: '#090d16',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
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
          background: 'rgba(139, 92, 246, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Execute Thesis: {thesisName}
            </span>
          </div>
          <button onClick={onClose} disabled={running} style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: 4
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto' }}>
          
          {/* Onboarding block if not ready */}
          {!authenticated ? (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Please login with Privy to setup your gasless safe for auto-execution.
              </p>
              <button onClick={login} className="btn btn-primary">Connect Wallet</button>
            </div>
          ) : (!l2Creds) ? (
            <div style={{
              padding: 16,
              background: 'rgba(245, 158, 11, 0.04)',
              border: '1px dashed rgba(245, 158, 11, 0.25)',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>Onchain Setup Required</div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Pollapse will automatically deploy your gas-free smart wallet, batch spender approvals, and load credentials.
              </p>
              <button 
                disabled={onboardLoading}
                onClick={handleQuickOnboard} 
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {onboardLoading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />} 
                Run Autopilot Setup
              </button>
            </div>
          ) : (
            /* Ready to execute legs */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Constituent Legs ({thesisItems.length})
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {statusList.map((leg, idx) => {
                  const orig = thesisItems[idx];
                  return (
                    <div 
                      key={leg.id}
                      style={{
                        padding: 12,
                        background: 'var(--bg-layer-2)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12
                      }}
                    >
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{leg.question}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.7rem', alignItems: 'center' }}>
                          <span style={{ 
                            padding: '1px 6px', 
                            borderRadius: 4, 
                            background: orig.prediction === 'YES' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: orig.prediction === 'YES' ? 'var(--success)' : 'var(--danger)',
                            fontWeight: 700
                          }}>
                            {orig.prediction}
                          </span>
                          <span style={{ color: 'var(--text-dim)' }}>Weight: {orig.weight}x</span>
                          <span style={{ color: 'var(--text-dim)' }}>Price: {formatPercent(orig.prediction === 'YES' ? orig.price : 1 - orig.price)}</span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {leg.status === 'idle' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Pending</span>
                        )}
                        {leg.status === 'signing' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--accent-purple)' }}>
                            <Loader2 size={12} className="animate-spin" /> Signing
                          </div>
                        )}
                        {leg.status === 'success' && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <CheckCircle size={12} /> Filled
                            </span>
                            {leg.orderId && <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>ID: {leg.orderId.slice(0, 8)}...</span>}
                          </div>
                        )}
                        {leg.status === 'failed' && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <XCircle size={12} /> Failed
                            </span>
                            {leg.error && <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }} title={leg.error}>{leg.error.slice(0, 15)}...</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              {!running && !allDone && (
                <button onClick={handleStartExecution} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  ⚡ Deploy Multi-Leg Thesis
                </button>
              )}

              {running && (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Loader2 size={16} className="animate-spin" /> Signing and routing leg {statusList.findIndex(s => s.status === 'signing') + 1} of {statusList.length}...
                </div>
              )}

              {allDone && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <div style={{
                    padding: 12,
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 8,
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--success)'
                  }}>
                    🎉 Multi-leg dispatch completed! Fills details listed above.
                  </div>
                  <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>Close Sandbox</button>
                </div>
              )}
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              background: '#020617',
              padding: 10,
              borderRadius: 8,
              maxHeight: 100,
              overflowY: 'auto'
            }}>
              {logs.slice(-3).map((log, index) => (
                <div key={index} style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{log}</div>
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
              <strong>Non-Custodial execution:</strong> Every leg in your thesis is individually signed by your Privy embedded wallet and dispatched sequentially via Gnosis Safe. Pollapse never holds your funds.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatPercent(val: any): string {
  if (val === undefined || val === null) return '0%';
  const num = typeof val === 'number' ? val : parseFloat(val);
  return `${Math.round(num * 100)}%`;
}
