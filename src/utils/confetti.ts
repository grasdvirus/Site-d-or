import confetti from "canvas-confetti";

export function triggerOrderCelebration() {
  // 1. Initial central burst of colorful confetti
  confetti({
    particleCount: 80,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#2d4a22', '#84a98c', '#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']
  });

  // 2. Fireworks rockets from left and right edges for 3 seconds
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 40 * (timeLeft / duration);

    // Left fireworks rocket
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
      colors: ['#2d4a22', '#34d399', '#f59e0b', '#60a5fa']
    });

    // Right fireworks rocket
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
      colors: ['#10b981', '#fbbf24', '#a855f7', '#f43f5e']
    });
  }, 300);
}
