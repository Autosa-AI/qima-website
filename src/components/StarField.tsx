"use client";
import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let mouse = { x: 0, y: 0 };
    const stars: Star[] = [];
    const shootingStars: ShootingStar[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
    };
    window.addEventListener("mousemove", onMouseMove);

    // Create stars in 3 layers
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        size: Math.random() * 1.8 + 0.2,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * 3),
      });
    }

    // Spawn shooting star
    const spawnShootingStar = () => {
      const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25 + Math.PI * 0.25;
      const speed = Math.random() * 8 + 5;
      shootingStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 80 + 60,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    };

    let lastShoot = 0;
    const shootInterval = 3000;

    const draw = (timestamp: number) => {
      time += 0.008;

      if (timestamp - lastShoot > shootInterval + Math.random() * 2000) {
        spawnShootingStar();
        lastShoot = timestamp;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      for (const star of stars) {
        const parallax = (star.layer + 1) * 0.015;
        const px = (star.x + mouse.x * parallax) * canvas.width;
        const py = (star.y + mouse.y * parallax) * canvas.height;
        const twinkle = Math.sin(time * (star.twinkleSpeed * 80) + star.twinkleOffset);
        const alpha = star.opacity * (0.6 + 0.4 * twinkle);
        const sz = star.size * (0.8 + 0.2 * twinkle);

        // Glow for bigger stars
        if (star.size > 1.2) {
          const grd = ctx.createRadialGradient(px, py, 0, px, py, sz * 4);
          grd.addColorStop(0, `rgba(200,168,76,${alpha * 0.3})`);
          grd.addColorStop(1, "rgba(200,168,76,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(px, py, sz * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, sz, 0, Math.PI * 2);
        const brightness = star.size > 1.4 ? `rgba(220,200,160,${alpha})` : `rgba(255,255,255,${alpha})`;
        ctx.fillStyle = brightness;
        ctx.fill();
      }

      // Draw shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const progress = ss.life / ss.maxLife;
        ss.opacity = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;

        const tailX = ss.x - ss.vx * (ss.length / Math.sqrt(ss.vx ** 2 + ss.vy ** 2));
        const tailY = ss.y - ss.vy * (ss.length / Math.sqrt(ss.vx ** 2 + ss.vy ** 2));

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.8, `rgba(220,200,160,${ss.opacity * 0.6})`);
        grad.addColorStop(1, `rgba(255,255,255,${ss.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tip glow
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${ss.opacity})`;
        ctx.fill();

        if (ss.life >= ss.maxLife) shootingStars.splice(i, 1);
      }

      // Subtle nebula clouds (very slow drift)
      const nebulaPositions = [
        { cx: 0.2, cy: 0.3, r: 0.15, color: "rgba(100,60,180," },
        { cx: 0.8, cy: 0.6, r: 0.18, color: "rgba(60,100,180," },
        { cx: 0.5, cy: 0.85, r: 0.12, color: "rgba(180,80,60," },
      ];
      for (const nb of nebulaPositions) {
        const nx = (nb.cx + Math.sin(time * 0.05) * 0.01) * canvas.width;
        const ny = (nb.cy + Math.cos(time * 0.04) * 0.01) * canvas.height;
        const nr = nb.r * Math.min(canvas.width, canvas.height);
        const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        grd.addColorStop(0, nb.color + "0.03)");
        grd.addColorStop(1, nb.color + "0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(nx, ny, nr, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
