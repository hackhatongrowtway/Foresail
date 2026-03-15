/**
 * components/AnimatedBackground/AnimatedBackground.jsx
 * Layered animated background:
 *   1. Canvas: floating particles connected by subtle lines
 *   2. CSS: large blurred color orbs drifting slowly
 *   3. CSS: moving grid overlay
 *   4. JS: small geometric shapes (hexagons, diamonds, circles)
 *
 * Respects prefers-reduced-motion via CSS.
 */

import React, { useEffect, useRef } from 'react';
import './AnimatedBackground.css';

// Particle system on canvas
function initCanvas(canvas, theme) {
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], raf;

  const COLORS = [
    'rgba(27,77,255,',
    'rgba(0,229,160,',
    'rgba(61,107,255,',
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() { this.reset(); }

  Particle.prototype.reset = function() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.vx = (Math.random() - .5) * .4;
    this.vy = (Math.random() - .5) * .4;
    this.r  = Math.random() * 1.8 + .4;
    this.a  = Math.random() * .5 + .1;
    this.c  = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.life = Math.random() * 200 + 100;
    this.age  = 0;
    this.fi   = 40;
  };

  Particle.prototype.draw = function() {
    const fade = this.age < this.fi
      ? this.age / this.fi
      : this.age > this.life - this.fi
        ? (this.life - this.age) / this.fi
        : 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.c + (this.a * fade) + ')';
    ctx.fill();
  };

  Particle.prototype.update = function() {
    this.x += this.vx; this.y += this.vy; this.age++;
    if (this.age > this.life || this.x < 0 || this.x > W || this.y < 0 || this.y > H)
      this.reset();
  };

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    // Connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(27,77,255,${(1 - d/120) * 0.04})`;
          ctx.lineWidth = .5;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(loop);
  }

  resize();
  particles = Array.from({ length: 55 }, () => new Particle());
  loop();
  window.addEventListener('resize', () => { resize(); particles.forEach(p => p.reset()); });

  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
}

// Inject floating geometric SVG shapes
function spawnGeos(container, theme) {
  container.innerHTML = '';
  const isDark = theme === 'dark';
  const s1 = isDark ? 'rgba(27,77,255,0.18)' : 'rgba(27,77,255,0.12)';
  const s2 = isDark ? 'rgba(0,229,160,0.15)' : 'rgba(0,200,140,0.1)';

  const shapes = [
    { type:'hex',     size:64,  x:'11%', y:'17%', dur:20 },
    { type:'hex',     size:36,  x:'79%', y:'64%', dur:25 },
    { type:'diamond', size:30,  x:'87%', y:'16%', dur:18 },
    { type:'diamond', size:18,  x:'5%',  y:'71%', dur:22 },
    { type:'circle',  size:44,  x:'91%', y:'42%', dur:28 },
    { type:'dashes',  size:80,  x:'4%',  y:'44%', dur:16 },
    { type:'dashes',  size:50,  x:'55%', y:'88%', dur:19 },
  ];

  shapes.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'geo-shape';
    div.style.cssText = `left:${s.x};top:${s.y};animation-delay:${idx * 0.5}s;`;
    const c = idx % 2 === 0 ? s1 : s2;

    let svg = '';
    if (s.type === 'hex') {
      const r = s.size / 2;
      const pts = Array.from({length:6}, (_,i) => {
        const a = (Math.PI/3)*i - Math.PI/6;
        return `${r + r*Math.cos(a)},${r + r*Math.sin(a)}`;
      }).join(' ');
      svg = `<svg width="${s.size}" height="${s.size}" viewBox="0 0 ${s.size} ${s.size}"><polygon points="${pts}" fill="none" stroke="${c}" stroke-width="1"/></svg>`;
    } else if (s.type === 'diamond') {
      svg = `<svg width="${s.size}" height="${s.size}" viewBox="0 0 ${s.size} ${s.size}"><polygon points="${s.size/2},2 ${s.size-2},${s.size/2} ${s.size/2},${s.size-2} 2,${s.size/2}" fill="none" stroke="${c}" stroke-width="1"/></svg>`;
    } else if (s.type === 'circle') {
      svg = `<svg width="${s.size}" height="${s.size}" viewBox="0 0 ${s.size} ${s.size}"><circle cx="${s.size/2}" cy="${s.size/2}" r="${s.size/2-2}" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="4 3"/></svg>`;
    } else {
      svg = `<svg width="${s.size}" height="2" viewBox="0 0 ${s.size} 2"><line x1="0" y1="1" x2="${s.size}" y2="1" stroke="${c}" stroke-width="1" stroke-dasharray="6 4"/></svg>`;
    }

    // Unique drift keyframe per shape
    const kf = `geo${Math.random().toString(36).slice(2,8)}`;
    const dx = (Math.random()-0.5)*60, dy = (Math.random()-0.5)*60, rot = (Math.random()-0.5)*35;
    const style = document.createElement('style');
    style.textContent = `@keyframes ${kf}{0%,100%{transform:translate(0,0) rotate(0deg)}50%{transform:translate(${dx}px,${dy}px) rotate(${rot}deg)}}`;
    document.head.appendChild(style);
    div.innerHTML = svg;
    div.querySelector('svg').style.animation = `${kf} ${s.dur}s ease-in-out infinite`;
    container.appendChild(div);
  });
}

function AnimatedBackground({ theme }) {
  const canvasRef = useRef(null);
  const geosRef   = useRef(null);

  useEffect(() => {
    const cleanup = initCanvas(canvasRef.current, theme);
    return cleanup;
  }, []);

  useEffect(() => {
    if (geosRef.current) spawnGeos(geosRef.current, theme);
  }, [theme]);

  return (
    <div className="anim-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="anim-canvas" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />
      <div ref={geosRef} className="geos-layer" />
    </div>
  );
}

export default AnimatedBackground;
