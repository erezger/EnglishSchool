'use client';

import { useEffect, useRef } from 'react';
import { useGame } from './GameContext';

/** Toast at the bottom, floating "+N 🪙" near the wallet, and confetti (same look as the original). */
export function Effects() {
  const { toasts, coinPops, confettiKey } = useGame();
  return (
    <>
      <Confetti trigger={confettiKey} />
      <div
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${toasts.length ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div key={t.id} className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm sm:text-base flex items-center gap-2 border border-slate-700">
            <span>{t.icon}</span>
            <span data-testid="toast">{t.text}</span>
          </div>
        ))}
      </div>
      {coinPops.map((p) => (
        <CoinPopup key={p.id} amount={p.amount} />
      ))}
    </>
  );
}

function CoinPopup({ amount }: { amount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wallet = document.getElementById('wallet-pill');
    const el = ref.current;
    if (!el) return;
    if (wallet) {
      const r = wallet.getBoundingClientRect();
      el.style.left = `${Math.max(16, r.left + r.width / 2 - 42)}px`;
      el.style.top = `${Math.max(16, r.top)}px`;
    } else {
      el.style.left = '50%';
      el.style.top = '80px';
    }
  }, []);
  return (
    <div ref={ref} className="floating-coin">
      +{amount} 🪙
    </div>
  );
}

type Particle = { x: number; y: number; w: number; h: number; color: string; vx: number; vy: number; rot: number; vRot: number; alpha: number };

function Confetti({ trigger }: { trigger: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const running = useRef(false);

  useEffect(() => {
    if (!trigger || !canvas.current) return;
    const cv = canvas.current;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#a855f7', '#22c55e'];
    for (let i = 0; i < 90; i++) {
      particles.current.push({
        x: Math.random() * cv.width,
        y: -20 - Math.random() * 140,
        w: 7 + Math.random() * 6,
        h: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 5,
        vy: 3 + Math.random() * 5,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
      });
    }
    if (running.current) return;
    running.current = true;
    const frame = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rot += p.vRot;
        if (p.y > cv.height * 0.78) p.alpha -= 0.025;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      particles.current = particles.current.filter((p) => p.alpha > 0 && p.y < cv.height + 40);
      if (particles.current.length) requestAnimationFrame(frame);
      else {
        running.current = false;
        ctx.clearRect(0, 0, cv.width, cv.height);
      }
    };
    requestAnimationFrame(frame);
  }, [trigger]);

  return <canvas ref={canvas} id="confetti-canvas" aria-hidden />;
}
