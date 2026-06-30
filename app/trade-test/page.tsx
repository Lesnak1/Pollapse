import Link from 'next/link';
import MinimalTradeComponent from '@/components/MinimalTradeComponent';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Polymarket CLOB V2 Trade Sandbox — Pollapse',
  description: 'Test gasless wallet deployments, token approvals, L2 session credential derivations, and builder-attributed orders.',
};

export default function TradeTestPage() {
  return (
    <div className="container page-content animate-fade-in" style={{ paddingBottom: 60 }}>
      {/* Back link */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="section-header" style={{ marginBottom: 30 }}>
        <div>
          <span className="badge badge-purple">
            <Shield size={12} style={{ marginRight: 4 }} /> WEB3 INTEGRATION
          </span>
          <h1 className="hero-title" style={{ fontSize: '2.4rem', marginTop: 12, marginBottom: 8 }}>
            CLOB V2 <span className="highlight">Trade Sandbox</span>
          </h1>
          <p className="section-subtitle">
            Configure your gasless deposit wallet, approve spenders, and place real attributed orders.
          </p>
        </div>
      </div>

      {/* Render the Onboarding & Trade Panel */}
      <MinimalTradeComponent />

      {/* Security Disclaimer Box */}
      <div className="card" style={{
        marginTop: 32,
        padding: '16px 20px',
        background: 'rgba(239, 68, 68, 0.04)',
        border: '1px dashed rgba(239, 68, 68, 0.25)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--error)', fontWeight: 700 }}>
          ⚠️ Real Financial Value WARNING
        </h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Placing limit/market orders in this sandbox sends live payloads to the Polymarket production matching engine (Chain 137 - Polygon Mainnet). Trade execution involves real USDC capital and outcome token contracts. Ensure your Safe/Deposit Wallet is properly funded and verify all outcome parameters before clicking "Place Order".
        </p>
      </div>
    </div>
  );
}
