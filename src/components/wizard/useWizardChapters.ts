'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

// Animate meaningful pieces independently without moving their layout or inputs.
const revealSelector = [
  '.wizard-greeting', '.wizard-body-copy', '.wizard-couple-photo', 'blockquote',
  '.wizard-small-rule', '.wizard-profiles-heading', '.wizard-profiles-rule',
  '.wizard-profiles-separator', '.wizard-profile-portrait',
  '.wizard-profile-copy > *', '.wizard-full-date', '.wizard-event-number',
  '.wizard-event > div > *', '.wizard-event > .wizard-star',
  '.wizard-event-section > .wizard-button', '.wizard-venue > :not(.wizard-venue-art)',
  '.wizard-form fieldset > label', '.wizard-form-note', '.wizard-form-error',
  '.wizard-form fieldset > .wizard-button', '.wizard-rsvp-success > *',
  '.wizard-gift-section > h2', '.wizard-gift-account', '.wizard-gift-feedback',
  '.wizard-footer > img', '.wizard-wishes > h2', '.wizard-wishes-intro',
  '.wizard-wishes-status', '.wizard-wish', '.wizard-wishes-actions',
].join(', ');

export default function useWizardChapters(interior: RefObject<HTMLDivElement | null>, inside: boolean) {
  const [active, setActive] = useState('sampul');
  const [selected, setSelected] = useState('sampul');
  const [exiting, setExiting] = useState(false);
  const current = useRef('sampul');
  const pending = useRef('sampul');
  const exit = useRef<Animation | null>(null);

  function commit(id: string) {
    current.current = id;
    pending.current = id;
    setActive(id);
    setSelected(id);
    setExiting(false);
  }

  function select(id: string, animate = true) {
    const node = interior.current;
    if (!inside || !animate || !node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit(id);
      return;
    }
    pending.current = id;
    setSelected(id);
    // Keep the outgoing panel mounted; rapid clicks update the destination.
    if (exit.current || id === current.current) return;
    setExiting(true);
    const animation = node.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-7px)' },
    ], { duration: 150, easing: 'ease-in', fill: 'forwards' });
    exit.current = animation;
    animation.onfinish = () => commit(pending.current);
  }

  useLayoutEffect(() => {
    if (exiting) return;
    // Keep the faded frame until React has switched the visible chapter.
    // Cancelling in onfinish can paint the outgoing content at full opacity.
    exit.current?.cancel();
    exit.current = null;
  }, [active, exiting]);

  useLayoutEffect(() => {
    const node = interior.current;
    if (!node || !inside) return;
    node.scrollTop = 0;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};

    function setup() {
      dispose();
      if (preference.matches) {
        if (exit.current) commit(pending.current);
        return;
      }
      const tracked = new Set<HTMLElement>();
      const animations = new Set<Animation>();
      const queue = new Set<HTMLElement>();
      let frame = 0;
      const flush = () => {
        frame = 0;
        [...queue].forEach((element, index) => {
          const animation = element.animate([
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ], {
            duration: 560, delay: Math.min(index * 55, 275),
            easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both',
          });
          animations.add(animation);
          element.dataset.chapterReveal = 'revealing';
          animation.onfinish = () => {
            element.dataset.chapterReveal = 'shown';
            animation.cancel();
            animations.delete(animation);
          };
        });
        queue.clear();
      };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          queue.add(target as HTMLElement);
        });
        if (queue.size && !frame) frame = requestAnimationFrame(flush);
      }, { root: node, threshold: 0, rootMargin: '0px 0px -12px 0px' });
      const discover = () => {
        tracked.forEach((element) => {
          if (node!.contains(element)) return;
          observer.unobserve(element);
          queue.delete(element);
          element.getAnimations().forEach((animation) => {
            if (!animations.has(animation)) return;
            animation.onfinish = null;
            animation.cancel();
            animations.delete(animation);
          });
          tracked.delete(element);
        });
        node!.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
          if (tracked.has(element) || element.closest('[hidden]')) return;
          tracked.add(element);
          element.dataset.chapterReveal = 'pending';
          observer.observe(element);
        });
      };
      // Wishes and form feedback can arrive after the initial chapter reveal.
      const mutations = new MutationObserver(discover);
      mutations.observe(node!, { childList: true, subtree: true });
      const focus = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        // Headings receive programmatic focus for screen readers; keep their reveal.
        if (target.tabIndex < 0) return;
        const element = target.closest<HTMLElement>('[data-chapter-reveal]');
        if (!element) return;
        observer.unobserve(element);
        queue.delete(element);
        element.getAnimations().forEach((animation) => animation.finish());
        element.dataset.chapterReveal = 'shown';
      };
      node!.addEventListener('focusin', focus);
      discover();
      dispose = () => {
        observer.disconnect();
        mutations.disconnect();
        node!.removeEventListener('focusin', focus);
        cancelAnimationFrame(frame);
        animations.forEach((animation) => {
          animation.onfinish = null;
          animation.cancel();
        });
        tracked.forEach((element) => { delete element.dataset.chapterReveal; });
      };
    }

    setup();
    preference.addEventListener('change', setup);
    return () => {
      dispose();
      preference.removeEventListener('change', setup);
    };
  }, [active, inside, interior]);

  useLayoutEffect(() => () => { exit.current?.cancel(); }, []);

  return { active, selected, exiting, select };
}
