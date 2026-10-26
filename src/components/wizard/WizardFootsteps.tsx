'use client';

import { useEffect, useRef } from 'react';

const PRINTS_PER_PERSON = 10;
const STRIDE = 17;
const TRAIL_DURATION = 6200;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function WizardFootsteps({ active, brideName, groomName }: { active: boolean; brideName: string; groomName: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = root.current;
    if (!layer || !active) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const walkers = Array.from(layer.querySelectorAll<HTMLElement>('.wizard-walker')).map((node, index) => ({
      prints: Array.from(node.querySelectorAll<HTMLElement>('.wizard-footprint')),
      name: node.querySelector<HTMLElement>('.wizard-walker-name')!,
      x: 0, y: 0, targetX: 0, targetY: 0,
      heading: index === 0 ? -Math.PI / 2 : Math.PI / 2,
      steps: 0,
      cadence: index === 0 ? 470 : 520,
      timer: 0,
    }));
    let width = 0;
    let height = 0;
    let running = false;

    function positionName(walker: typeof walkers[number]) {
      const halfWidth = walker.name.offsetWidth / 2;
      const x = clamp(walker.x, halfWidth + 8, width - halfWidth - 8);
      const y = Math.min(walker.y + 16, height - walker.name.offsetHeight - 8);
      walker.name.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function chooseTarget(walker: typeof walkers[number]) {
      // Keep both sides of each stride inside the reading area.
      const marginX = Math.min(32, width / 3);
      const marginY = Math.min(32, height / 3);
      for (let attempt = 0; attempt < 8; attempt++) {
        walker.targetX = marginX + Math.random() * (width - marginX * 2);
        walker.targetY = marginY + Math.random() * (height - marginY * 2);
        if (Math.hypot(walker.targetX - walker.x, walker.targetY - walker.y) > 80) break;
      }
    }

    function step(walker: typeof walkers[number]) {
      if (!running) return;
      const distance = Math.hypot(walker.targetX - walker.x, walker.targetY - walker.y);
      if (distance < STRIDE * 1.5) chooseTarget(walker);
      const desired = Math.atan2(walker.targetY - walker.y, walker.targetX - walker.x);
      const turn = Math.atan2(Math.sin(desired - walker.heading), Math.cos(desired - walker.heading));
      walker.heading += clamp(turn, -.42, .42);
      walker.x = clamp(walker.x + Math.cos(walker.heading) * STRIDE, 24, width - 24);
      walker.y = clamp(walker.y + Math.sin(walker.heading) * STRIDE, 24, height - 24);
      positionName(walker);

      const side = walker.steps % 2 === 0 ? -1 : 1;
      const x = walker.x - Math.sin(walker.heading) * side * 6;
      const y = walker.y + Math.cos(walker.heading) * side * 6;
      const print = walker.prints[walker.steps % PRINTS_PER_PERSON];
      print.dataset.foot = side === -1 ? 'left' : 'right';
      print.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${walker.heading + Math.PI / 2 + side * .09}rad)`;
      print.getAnimations().forEach((animation) => animation.cancel());
      print.animate([
        { opacity: 0 },
        { opacity: .18, offset: .09 },
        { opacity: .1, offset: .4 },
        { opacity: 0 },
      ], { duration: TRAIL_DURATION, easing: 'ease-out' });
      walker.steps++;
      walker.timer = window.setTimeout(() => step(walker), walker.cadence);
    }

    function stop() {
      running = false;
      layer!.dataset.running = 'false';
      walkers.forEach((walker) => {
        window.clearTimeout(walker.timer);
        walker.prints.forEach((print) => print.getAnimations().forEach((animation) => animation.cancel()));
      });
    }

    function sync() {
      stop();
      if (preference.matches || document.hidden || width < 140 || height < 140) return;
      running = true;
      walkers.forEach((walker, index) => {
        walker.x = clamp(walker.x || width * (index === 0 ? .28 : .72), 32, width - 32);
        walker.y = clamp(walker.y || height * (index === 0 ? .68 : .34), 32, height - 32);
        positionName(walker);
        chooseTarget(walker);
        walker.timer = window.setTimeout(() => step(walker), index * 320 + 120);
      });
      layer!.dataset.running = 'true';
    }

    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      sync();
    });
    resize.observe(layer);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      stop();
      resize.disconnect();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [active]);

  return <div ref={root} className="wizard-footsteps" aria-hidden="true" data-active={active}>
    {[{ id: 'bride', name: brideName }, { id: 'groom', name: groomName }].map(({ id, name }) => <div className={`wizard-walker wizard-walker-${id}`} key={id}>
      {Array.from({ length: PRINTS_PER_PERSON }, (_, index) => <span className="wizard-footprint" key={index} />)}
      <span className="wizard-walker-name">{name}</span>
    </div>)}
  </div>;
}
