'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface StarfieldProps {
  starCount?: number;
  depth?: number;
  mouseInfluence?: number;
  className?: string;
}

export function Starfield({
  starCount = 200,
  depth = 1000,
  mouseInfluence = 0.3,
  className = ''
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animationRef = useRef<number>(0);

  // Calming star colors - soft whites, blues, and occasional warm tones
  const starColors = [
    '#ffffff', // Pure white
    '#f0f4ff', // Soft blue-white
    '#e8f0ff', // Light blue
    '#fff8e7', // Warm white
    '#d4e5ff', // Pale blue
    '#ffeedd', // Soft peach
  ];

  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * depth + 1,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
    // Sort by z for proper layering
    stars.sort((a, b) => a.z - b.z);
    starsRef.current = stars;
  }, [starCount, depth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseRef.current.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.targetX = ((e.touches[0].clientX - rect.left) / rect.width - 0.5) * 2;
    mouseRef.current.targetY = ((e.touches[0].clientY - rect.top) / rect.height - 0.5) * 2;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        initStars(rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.016;
      
      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear with a deep space gradient
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(width, height)
      );
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#050510');
      gradient.addColorStop(1, '#020208');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      starsRef.current.forEach((star, index) => {
        // Calculate position with parallax based on mouse
        const parallaxX = star.x + (mouseRef.current.x * mouseInfluence * star.z);
        const parallaxY = star.y + (mouseRef.current.y * mouseInfluence * star.z);
        
        // Project to screen space
        const scale = depth / (depth + star.z);
        const screenX = centerX + parallaxX * scale;
        const screenY = centerY + parallaxY * scale;

        // Skip if outside canvas
        if (screenX < 0 || screenX > width || screenY < 0 || screenY > height) {
          return;
        }

        // Calculate twinkle effect
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase);
        const alpha = star.brightness * (0.7 + 0.3 * twinkle);

        // Draw star glow
        const glowSize = star.size * scale * 3;
        const glowGradient = ctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, glowSize
        );
        glowGradient.addColorStop(0, star.color);
        glowGradient.addColorStop(0.5, star.color + '40');
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.fillStyle = glowGradient;
        ctx.globalAlpha = alpha * 0.3;
        ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw star core
        ctx.beginPath();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.arc(screenX, screenY, star.size * scale, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle lens flare for brighter stars
        if (star.brightness > 0.8 && star.size > 1) {
          ctx.beginPath();
          ctx.globalAlpha = alpha * 0.2;
          const flareX = screenX - mouseRef.current.x * 5;
          const flareY = screenY - mouseRef.current.y * 5;
          const flareGradient = ctx.createRadialGradient(
            flareX, flareY, 0,
            flareX, flareY, star.size * scale * 4
          );
          flareGradient.addColorStop(0, star.color);
          flareGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = flareGradient;
          ctx.arc(flareX, flareY, star.size * scale * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initStars, handleMouseMove, handleTouchMove, depth, mouseInfluence]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
}

export default Starfield;
