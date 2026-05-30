'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function TelegramFloatingWidget() {
  const [hovered, setHovered] = useState(false);

  return (
    <a 
      href="https://t.me/PollapseBot" 
      target="_blank" 
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: 100, // Sits elegantly in the right-side gutter just below the Navbar header
        right: 28,
        zIndex: 9999,
        background: hovered 
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.28) 0%, rgba(139, 92, 246, 0.28) 100%)' 
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: hovered 
          ? '1px solid rgba(139, 92, 246, 0.6)' 
          : '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 35,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', // Guarantees pixel-perfect horizontal centering
        gap: 8,
        color: 'var(--text-primary)',
        textDecoration: 'none',
        boxShadow: hovered 
          ? '0 10px 35px rgba(139, 92, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.25)' 
          : '0 6px 24px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: hovered ? 265 : 130, // Using fixed width with transition for clean centering transitions
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ 
        fontSize: '0.82rem', 
        fontWeight: 700, 
        fontFamily: 'var(--font-body)',
        letterSpacing: 0.5,
        color: 'var(--text-primary)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6
      }}>
        {hovered ? '🤖 Get Free Alerts on Telegram' : '🤖 LP Alerts'}
      </span>

      {hovered && (
        <ArrowUpRight 
          size={14} 
          style={{ 
            color: 'var(--primary)', 
            flexShrink: 0,
            opacity: 0.9,
            animation: 'animate-pulse 2s infinite'
          }} 
        />
      )}
    </a>
  );
}
