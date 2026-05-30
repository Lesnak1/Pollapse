'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const cursorActiveRef = useRef(false);

  useEffect(() => {
    // Disable custom cursor on mobile / touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Apply cursor: none to html to hide default browser cursor
    document.documentElement.classList.add('custom-cursor-active');

    // Variables for mouse coordinates and interpolated ring coordinates
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    // Track if mouse is on screen
    let onScreen = false;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!onScreen) {
        onScreen = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    };

    const onMouseLeave = () => {
      onScreen = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    // Fast Animation Loop using requestAnimationFrame for buttery-smooth 60fps performance
    const render = () => {
      if (dot) {
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      if (ring) {
        // Ease/interpolation: ring lags slightly behind dot for physical organic motion
        const ease = 0.15;
        ringX += (mouseX - ringX) * ease;
        ringY += (mouseY - ringY) * ease;
        
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      requestAnimationFrame(render);
    };

    // Track hovered elements for hover interactions (buttons, links, nodes, etc.)
    const onMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') ||
        target.classList.contains('hover-link') ||
        target.closest('.interactive-card') ||
        target.closest('.table-row-hover') ||
        target.closest('.d3-node') ||
        target.getAttribute('role') === 'button';

      if (isInteractive) {
        cursorActiveRef.current = true;
        if (ring) {
          ring.classList.add('cursor-hovering');
        }
        if (dot) {
          dot.classList.add('dot-hovering');
        }
      }
    };

    const onMouseOut = (e) => {
      const target = e.target;
      if (!target) return;

      cursorActiveRef.current = false;
      if (ring) {
        ring.classList.remove('cursor-hovering');
      }
      if (dot) {
        dot.classList.remove('dot-hovering');
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseover', onMouseOver);
    window.addEventListener('mouseout', onMouseOut);

    // Start loop
    const animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(animId);
      document.documentElement.classList.remove('custom-cursor-active');
    };
  }, []);

  return (
    <>
      {/* Tiny precise cursor center dot */}
      <div 
        ref={dotRef} 
        className="custom-cursor-dot"
        style={{
          position: 'fixed',
          top: -2.5,
          left: -2.5,
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.85)',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: 0,
          transition: 'opacity 0.3s ease, background-color 0.2s ease, width 0.2s, height 0.2s, top 0.2s, left 0.2s',
          willChange: 'transform'
        }}
      />
      {/* Outer soft glowing ambient aura (no solid border) */}
      <div 
        ref={ringRef} 
        className="custom-cursor-ring"
        style={{
          position: 'fixed',
          top: -12,
          left: -12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: 'none',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(59, 130, 246, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 99998,
          opacity: 0,
          transition: 'opacity 0.3s ease, background-color 0.2s ease, width 0.2s, height 0.2s, top 0.2s, left 0.2s',
          willChange: 'transform'
        }}
      />
    </>
  );
}
