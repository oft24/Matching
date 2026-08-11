import { useEffect, useRef } from 'react';

const PEOPLE = [
  { name: 'Sofía', tag: 'Support · Gold' },
  { name: 'Marco', tag: 'Mid · Platinum' },
  { name: 'Ana', tag: 'Duelista · Oro' },
  { name: 'Diego', tag: 'Jungla · Gold' },
  { name: 'Lucía', tag: 'Top · Platinum' },
  { name: 'Iván', tag: 'ADC · Gold' },
  { name: 'Pau', tag: 'Centinela · Oro' },
  { name: 'Nico', tag: 'Soporte · Plata' },
  { name: 'Rita', tag: 'Flex · Gold' },
  { name: 'Bruno', tag: 'Tanque · Oro' },
];

const PCTS = [94, 88, 96, 91, 87, 92];
/** Fases del ciclo, en ms. La deriva ocupa lo que sobra del intervalo. */
const D = { converge: 1200, lock: 1700, release: 800 };
const SVG_NS = 'http://www.w3.org/2000/svg';

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const initials = (n: string) => n.slice(0, 2).toUpperCase();

interface Node {
  el: HTMLDivElement;
  person: { name: string; tag: string };
  ring: number;
  a: number;
  sp: number;
}

interface MatchingStageProps {
  /** Duración de un ciclo completo. Por debajo de 3.7 s la deriva desaparece. */
  seconds?: number;
  profiles?: number;
}

/**
 * Escenario del emparejamiento: perfiles orbitando en dos anillos; cada ciclo
 * elige dos, los acerca al centro, traza el enlace y cuenta la compatibilidad.
 * Se dibuja imperativamente sobre un ref para no re-renderizar React por frame.
 */
export default function MatchingStage({ seconds = 4.6, profiles = 10 }: MatchingStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const count = Math.max(6, Math.min(12, profiles));
    const interval = Math.round(seconds * 1000);
    host.textContent = '';

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    Object.assign(svg.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', overflow: 'visible' });

    for (const r of [40, 29, 18]) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', '50');
      c.setAttribute('cy', '50');
      c.setAttribute('r', String(r));
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', r === 18 ? 'var(--color-neutral-900)' : 'var(--color-neutral-800)');
      c.setAttribute('stroke-width', '0.22');
      svg.appendChild(c);
    }

    const sweep = document.createElementNS(SVG_NS, 'circle');
    sweep.setAttribute('cx', '50');
    sweep.setAttribute('cy', '50');
    sweep.setAttribute('r', '40');
    sweep.setAttribute('fill', 'none');
    sweep.setAttribute('stroke', 'var(--color-accent)');
    sweep.setAttribute('stroke-width', '0.5');
    sweep.setAttribute('stroke-linecap', 'round');
    sweep.setAttribute('stroke-dasharray', '16 260');
    sweep.setAttribute('opacity', '0.5');
    sweep.style.transformOrigin = '50% 50%';
    svg.appendChild(sweep);

    const link = document.createElementNS(SVG_NS, 'line');
    link.setAttribute('stroke', 'var(--color-accent)');
    link.setAttribute('stroke-width', '0.4');
    link.setAttribute('stroke-linecap', 'round');
    link.setAttribute('opacity', '0');
    svg.appendChild(link);

    const halo = document.createElementNS(SVG_NS, 'circle');
    halo.setAttribute('cx', '50');
    halo.setAttribute('cy', '50');
    halo.setAttribute('r', '13');
    halo.setAttribute('fill', 'none');
    halo.setAttribute('stroke', 'var(--color-accent)');
    halo.setAttribute('stroke-width', '0.3');
    halo.setAttribute('opacity', '0');
    svg.appendChild(halo);
    host.appendChild(svg);

    const readout = document.createElement('div');
    Object.assign(readout.style, {
      position: 'absolute', left: '50%', top: '33%', transform: 'translate(-50%,-50%)',
      textAlign: 'center', width: 'max-content', pointerEvents: 'none', zIndex: '2',
      padding: '6px 16px', borderRadius: 'var(--radius-md)',
      background: 'color-mix(in srgb, var(--color-bg) 82%, transparent)',
    });
    const pctEl = document.createElement('div');
    Object.assign(pctEl.style, {
      fontFamily: 'var(--font-sans)', fontWeight: '500', fontSize: '30px', lineHeight: '1',
      color: 'var(--color-accent-200)', opacity: '0', fontVariantNumeric: 'tabular-nums',
    });
    const capEl = document.createElement('div');
    Object.assign(capEl.style, {
      marginTop: '6px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'color-mix(in srgb, var(--color-text) 50%, transparent)',
    });
    capEl.textContent = 'Buscando compañeros';
    readout.append(pctEl, capEl);
    host.appendChild(readout);

    const names = document.createElement('div');
    Object.assign(names.style, {
      position: 'absolute', left: '50%', top: '66%', transform: 'translate(-50%,-50%)',
      fontSize: '13px', color: 'color-mix(in srgb, var(--color-text) 72%, transparent)',
      opacity: '0', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: '2',
      padding: '6px 14px', borderRadius: 'var(--radius-md)',
      background: 'var(--color-surface)', boxShadow: 'var(--shadow-md)',
    });
    host.appendChild(names);

    const pulse = document.createElement('span');
    Object.assign(pulse.style, {
      position: 'absolute', left: '50%', top: '50%', width: '6px', height: '6px',
      marginLeft: '-3px', marginTop: '-3px', borderRadius: '999px',
      background: 'var(--color-accent)', animation: 'breathe 2.4s ease-in-out infinite',
    });
    host.appendChild(pulse);

    const nodes: Node[] = [];
    for (let i = 0; i < count; i += 1) {
      const person = PEOPLE[i % PEOPLE.length];
      const chip = document.createElement('div');
      chip.textContent = initials(person.name);
      Object.assign(chip.style, {
        position: 'absolute', left: '0', top: '0', width: '42px', height: '42px',
        display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)',
        fontSize: '12px', fontWeight: '600', letterSpacing: '0.02em',
        color: 'color-mix(in srgb, var(--color-text) 72%, transparent)',
        transition: 'box-shadow 320ms ease, color 320ms ease', willChange: 'transform',
      });
      host.appendChild(chip);
      const ring = i % 2 === 0 ? 40 : 29;
      nodes.push({
        el: chip, person, ring,
        a: (i / count) * Math.PI * 2 + (i % 2 ? 0.35 : 0),
        sp: ring === 40 ? 0.055 : -0.085,
      });
    }

    let pair: [Node, Node] | null = null;
    let pct = PCTS[0];
    let pctIndex = 0;
    let rot = 0;
    let phase: 'drift' | 'converge' | 'lock' | 'release' = 'drift';

    const place = (node: Node, x: number, y: number) => {
      const s = host.clientWidth || 520;
      node.el.style.transform = `translate(${(x / 100) * s - 21}px, ${(y / 100) * s - 21}px)`;
    };
    const base = (node: Node) => ({
      x: 50 + node.ring * Math.cos(node.a),
      y: 50 + node.ring * Math.sin(node.a),
    });

    const paint = (progress: number) => {
      const live: Record<string, { x: number; y: number }> = {};
      for (const n of nodes) {
        const b = base(n);
        if (pair && (n === pair[0] || n === pair[1])) {
          const target = n === pair[0] ? { x: 34, y: 50 } : { x: 66, y: 50 };
          const p = ease(progress);
          const cx = b.x + (target.x - b.x) * p;
          const cy = b.y + (target.y - b.y) * p;
          live[n === pair[0] ? 'a' : 'b'] = { x: cx, y: cy };
          place(n, cx, cy);
          const lit = progress > 0.55;
          n.el.style.boxShadow = lit
            ? '0 0 0 1px var(--color-accent), 0 0 26px color-mix(in srgb, var(--color-accent) 34%, transparent)'
            : 'var(--shadow-sm)';
          n.el.style.color = lit ? 'var(--color-accent-200)' : 'color-mix(in srgb, var(--color-text) 72%, transparent)';
          n.el.style.opacity = '1';
        } else {
          place(n, b.x, b.y);
          n.el.style.boxShadow = 'var(--shadow-sm)';
          n.el.style.color = 'color-mix(in srgb, var(--color-text) 72%, transparent)';
          n.el.style.opacity = String(1 - 0.68 * progress);
        }
      }

      if (pair && progress > 0 && live.a && live.b) {
        const half = (21 / (host.clientWidth || 520)) * 100 + 0.6;
        const dx = live.b.x - live.a.x;
        const dy = live.b.y - live.a.y;
        const len = Math.max(0.001, Math.hypot(dx, dy));
        const ux = dx / len;
        const uy = dy / len;
        const gap = Math.min(half, len / 2 - 0.2);
        link.setAttribute('x1', String(live.a.x + ux * gap));
        link.setAttribute('y1', String(live.a.y + uy * gap));
        link.setAttribute('x2', String(live.b.x - ux * gap));
        link.setAttribute('y2', String(live.b.y - uy * gap));
        link.setAttribute('opacity', String(len > half * 2.1 ? 0.85 * Math.min(1, progress * 1.6) : 0));
        pctEl.style.opacity = String(Math.min(1, progress * 1.8));
        pctEl.textContent = `${Math.round(pct * Math.min(1, progress * 1.25))}%`;
        capEl.textContent = progress > 0.9 ? 'Compatibilidad' : 'Comparando perfiles';
        names.style.opacity = String(Math.max(0, (progress - 0.82) / 0.18));
        names.textContent = `${pair[0].person.name} · ${pair[0].person.tag}   ✦   ${pair[1].person.name} · ${pair[1].person.tag}`;
        halo.setAttribute('opacity', String(0.35 * Math.max(0, (progress - 0.6) / 0.4)));
        halo.setAttribute('r', String(13 + 4 * Math.max(0, progress - 0.6)));
        pulse.style.opacity = '0';
      } else {
        link.setAttribute('opacity', '0');
        halo.setAttribute('opacity', '0');
        pctEl.style.opacity = '0';
        names.style.opacity = '0';
        capEl.textContent = 'Buscando compañeros';
        pulse.style.opacity = '1';
      }
    };

    // Con movimiento reducido se muestra un match fijo y no se arranca el bucle
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      pair = [nodes[0], nodes[1]];
      paint(1);
      return () => { host.textContent = ''; };
    }

    let raf = 0;
    let t0 = performance.now();
    let last = t0;

    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const el = now - t0;

      rot += dt * 42;
      sweep.style.transform = `rotate(${rot}deg)`;
      for (const n of nodes) n.a += n.sp * dt;

      if (phase === 'drift') {
        paint(0);
        if (el > interval - D.converge - D.lock - D.release) {
          const i = Math.floor(Math.random() * nodes.length);
          let j = Math.floor(Math.random() * nodes.length);
          if (j === i) j = (i + 3) % nodes.length;
          pair = [nodes[i], nodes[j]];
          pct = PCTS[pctIndex % PCTS.length];
          pctIndex += 1;
          phase = 'converge';
          t0 = now;
        }
      } else if (phase === 'converge') {
        paint(Math.min(1, el / D.converge));
        if (el >= D.converge) { phase = 'lock'; t0 = now; }
      } else if (phase === 'lock') {
        paint(1);
        if (el >= D.lock) { phase = 'release'; t0 = now; }
      } else {
        paint(Math.max(0, 1 - el / D.release));
        if (el >= D.release) { pair = null; phase = 'drift'; t0 = now; }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      host.textContent = '';
    };
  }, [seconds, profiles]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Animación: perfiles que se buscan y forman un match"
      className="relative aspect-square w-full max-w-[560px]"
    />
  );
}
