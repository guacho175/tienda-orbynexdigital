import { useRouterState } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import {
  Braces,
  Cpu,
  Database,
  Globe,
  Server,
  Sparkles,
  SquareTerminal,
  Zap,
  type LucideIcon,
} from "lucide-react";

type FloaterConfig = {
  icon: LucideIcon;
  left: string;
  top: string;
  size: string;
  delay: string;
  duration: string;
  rotate?: string;
};

type RainConfig = {
  icon: LucideIcon;
  left: string;
  size: string;
  delay: string;
  duration: string;
  scale: number;
};

const pageFloaters: FloaterConfig[] = [
  { icon: Braces, left: "5vw", top: "18vh", size: "3rem", delay: "-2s", duration: "18s" },
  { icon: Cpu, left: "8vw", top: "56vh", size: "2.6rem", delay: "-9s", duration: "20s" },
  { icon: Zap, left: "90vw", top: "24vh", size: "2.9rem", delay: "-5s", duration: "19s" },
  {
    icon: Database,
    left: "88vw",
    top: "68vh",
    size: "3.1rem",
    delay: "-12s",
    duration: "21s",
  },
];

const heroFloaters: FloaterConfig[] = [
  {
    icon: Sparkles,
    left: "8%",
    top: "10%",
    size: "2.5rem",
    delay: "-1s",
    duration: "12s",
    rotate: "-8deg",
  },
  {
    icon: Globe,
    left: "84%",
    top: "14%",
    size: "3rem",
    delay: "-7s",
    duration: "16s",
    rotate: "10deg",
  },
  {
    icon: SquareTerminal,
    left: "74%",
    top: "58%",
    size: "2.6rem",
    delay: "-4s",
    duration: "14s",
    rotate: "-6deg",
  },
  {
    icon: Server,
    left: "12%",
    top: "68%",
    size: "2.8rem",
    delay: "-11s",
    duration: "18s",
    rotate: "7deg",
  },
];

const footerRainDrops: RainConfig[] = [
  { icon: Braces, left: "5%", size: "1.1rem", delay: "-12s", duration: "16s", scale: 0.85 },
  { icon: Cpu, left: "11%", size: "1.4rem", delay: "-3s", duration: "13s", scale: 1.05 },
  {
    icon: Database,
    left: "18%",
    size: "1.25rem",
    delay: "-8s",
    duration: "18s",
    scale: 0.95,
  },
  { icon: Globe, left: "26%", size: "1rem", delay: "-2s", duration: "15s", scale: 0.8 },
  { icon: Server, left: "33%", size: "1.35rem", delay: "-10s", duration: "17s", scale: 1 },
  { icon: Sparkles, left: "41%", size: "0.9rem", delay: "-6s", duration: "14s", scale: 0.75 },
  {
    icon: SquareTerminal,
    left: "48%",
    size: "1.3rem",
    delay: "-1s",
    duration: "16s",
    scale: 0.92,
  },
  { icon: Zap, left: "55%", size: "1.1rem", delay: "-11s", duration: "12s", scale: 0.88 },
  { icon: Cpu, left: "62%", size: "1.45rem", delay: "-5s", duration: "19s", scale: 1.08 },
  { icon: Globe, left: "68%", size: "1rem", delay: "-7s", duration: "13s", scale: 0.78 },
  { icon: Database, left: "76%", size: "1.15rem", delay: "-4s", duration: "15s", scale: 0.9 },
  { icon: Server, left: "82%", size: "1.3rem", delay: "-9s", duration: "18s", scale: 1.02 },
  { icon: Sparkles, left: "89%", size: "0.95rem", delay: "-13s", duration: "14s", scale: 0.82 },
  {
    icon: SquareTerminal,
    left: "95%",
    size: "1.2rem",
    delay: "-6s",
    duration: "17s",
    scale: 0.96,
  },
];

function getMotionPreferences() {
  return {
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    finePointer: window.matchMedia("(pointer: fine)").matches,
  };
}

function Floater({ icon: Icon, left, top, size, delay, duration, rotate }: FloaterConfig) {
  const style = {
    left,
    top,
    width: size,
    height: size,
    "--float-delay": delay,
    "--float-duration": duration,
    "--float-rotate": rotate ?? "0deg",
  } as CSSProperties;

  return (
    <span className="tech-floater" style={style}>
      <Icon />
    </span>
  );
}

export function GlobalBrandEffects() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    const { reduceMotion } = getMotionPreferences();
    const body = document.body;
    const initialX = window.innerWidth * 0.5;
    const initialY = window.innerHeight * 0.2;
    let currentX = initialX;
    let currentY = initialY;
    let targetX = initialX;
    let targetY = initialY;
    let frameId = 0;

    body.style.setProperty("--glow-x", `${initialX}px`);
    body.style.setProperty("--glow-y", `${initialY}px`);

    if (reduceMotion) {
      return;
    }

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      body.style.setProperty("--glow-x", `${currentX}px`);
      body.style.setProperty("--glow-y", `${currentY}px`);
      frameId = window.requestAnimationFrame(animate);
    };

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const handleLeave = () => {
      targetX = window.innerWidth * 0.5;
      targetY = window.innerHeight * 0.2;
    };

    frameId = window.requestAnimationFrame(animate);
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerleave", handleLeave);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  useEffect(() => {
    const { reduceMotion, finePointer } = getMotionPreferences();
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-interactive-card]"));
    const cleanups = cards.map((card) => {
      const handlePointerMove = (event: PointerEvent) => {
        const bounds = card.getBoundingClientRect();
        const mouseX = event.clientX - bounds.left;
        const mouseY = event.clientY - bounds.top;

        card.style.setProperty("--mouse-x", `${mouseX}px`);
        card.style.setProperty("--mouse-y", `${mouseY}px`);
        card.classList.add("active");

        if (!reduceMotion && finePointer && card.dataset.cardTilt === "true") {
          const rotateY = (mouseX / bounds.width - 0.5) * 10;
          const rotateX = (0.5 - mouseY / bounds.height) * 9;
          card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
          card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
        }
      };

      const handlePointerEnter = () => {
        card.classList.add("active");
      };

      const handlePointerLeave = () => {
        card.classList.remove("active");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      };

      card.addEventListener("pointermove", handlePointerMove);
      card.addEventListener("pointerenter", handlePointerEnter);
      card.addEventListener("pointerleave", handlePointerLeave);

      return () => {
        card.removeEventListener("pointermove", handlePointerMove);
        card.removeEventListener("pointerenter", handlePointerEnter);
        card.removeEventListener("pointerleave", handlePointerLeave);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const trigger = target.closest<HTMLElement>(".btn-hero, [data-ripple='true']");
      if (!trigger || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const bounds = trigger.getBoundingClientRect();
      const size = Math.max(bounds.width, bounds.height) * 1.15;
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - bounds.left - size / 2}px`;
      ripple.style.top = `${event.clientY - bounds.top - size / 2}px`;
      trigger.appendChild(ripple);

      window.setTimeout(() => {
        ripple.remove();
      }, 650);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <div className="bg-grid" aria-hidden="true" />
      <div className="page-floaters" aria-hidden="true">
        {pageFloaters.map((floater, index) => (
          <Floater key={`${floater.left}-${index}`} {...floater} />
        ))}
      </div>
    </>
  );
}

export function HeroFloaters() {
  return (
    <div className="hero-floaters" aria-hidden="true">
      {heroFloaters.map((floater, index) => (
        <Floater key={`${floater.left}-${index}`} {...floater} />
      ))}
    </div>
  );
}

export function FooterRain() {
  return (
    <div className="footer-rain" aria-hidden="true">
      {footerRainDrops.map((drop, index) => {
        const Icon = drop.icon;
        const style = {
          left: drop.left,
          width: drop.size,
          height: drop.size,
          "--dur": drop.duration,
          "--del": drop.delay,
          "--scale": String(drop.scale),
        } as CSSProperties;

        return (
          <span key={`${drop.left}-${index}`} className="rain-drop" style={style}>
            <Icon />
          </span>
        );
      })}
    </div>
  );
}
