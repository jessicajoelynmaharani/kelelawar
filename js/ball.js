/**
 * Ball Physics & Glowing Energy Orb Class
 */
class Ball {
  constructor(x, y, vx = 0, vy = 0, type = 'normal') {
    this.x = x;
    this.y = y;
    this.vx = vx !== 0 ? vx : (Math.random() - 0.5) * 6;
    this.vy = vy !== 0 ? vy : -(5 + Math.random() * 3);
    this.radius = 12;
    this.type = type; // 'normal', 'gold', 'ice', 'plasma'
    
    this.trail = [];
    this.maxTrail = 8;
    this.speed = Math.hypot(this.vx, this.vy);

    // Color maps
    this.colorMap = {
      normal: { core: '#ffffff', glow: '#00f3ff', main: '#00d5ff' },
      gold: { core: '#ffffff', glow: '#ffd700', main: '#ffaa00' },
      ice: { core: '#ffffff', glow: '#a0e0ff', main: '#33b5e5' },
      plasma: { core: '#ffffff', glow: '#ff007f', main: '#d5006d' }
    };

    if (this.type === 'gold') this.radius = 14;
  }

  update(width, height, particleSystem, slowMotionFactor = 1) {
    const stepVx = this.vx * slowMotionFactor;
    const stepVy = this.vy * slowMotionFactor;

    this.x += stepVx;
    this.y += stepVy;

    // Record trail position
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }

    // Add glowing spark trail occasionally
    if (Math.random() < 0.3) {
      const colors = this.colorMap[this.type] || this.colorMap.normal;
      particleSystem.addSpark(this.x, this.y, colors.glow, 1);
    }

    // Wall Bounce - Left & Right
    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
      particleSystem.addSpark(this.x, this.y, '#00f3ff', 5);
      return 'bounce_wall';
    } else if (this.x + this.radius >= width) {
      this.x = width - this.radius;
      this.vx = -Math.abs(this.vx);
      particleSystem.addSpark(this.x, this.y, '#00f3ff', 5);
      return 'bounce_wall';
    }

    // Wall Bounce - Ceiling Top
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
      particleSystem.addSpark(this.x, this.y, '#00f3ff', 5);
      return 'bounce_wall';
    }

    return null;
  }

  checkBatCollision(bat, particleSystem, soundEngine) {
    const bounds = bat.getBounds();
    
    // Check if ball overlaps with bat
    if (
      this.x + this.radius >= bounds.left &&
      this.x - this.radius <= bounds.right &&
      this.y + this.radius >= bounds.top &&
      this.y - this.radius <= bounds.bottom &&
      this.vy > 0 // Moving downward
    ) {
      // Calculate hit position relative to center (-1 to 1)
      const hitOffset = (this.x - bat.x) / (bat.width / 2);
      const clampedOffset = Math.max(-0.85, Math.min(0.85, hitOffset));

      // Calculate bounce reflection angle (range: -60 deg to +60 deg)
      const maxAngle = (Math.PI / 3) * 0.85; 
      const bounceAngle = clampedOffset * maxAngle;
      const currentSpeed = Math.max(7, Math.hypot(this.vx, this.vy) * 1.03); // Slight speed up on hit

      this.vx = Math.sin(bounceAngle) * currentSpeed;
      this.vy = -Math.cos(bounceAngle) * currentSpeed;

      // Position adjustment so ball doesn't get stuck inside bat
      this.y = bounds.top - this.radius - 2;

      // Visuals & Sound
      const colors = this.colorMap[this.type] || this.colorMap.normal;
      particleSystem.addSpark(this.x, this.y, colors.glow, 12);
      soundEngine.playBounce(currentSpeed);

      return true;
    }

    // Magnet pulling logic if bat magnet powerup active
    if (bat.isMagnet) {
      const dx = bat.x - this.x;
      const dy = bat.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 220) {
        this.vx += (dx / dist) * 0.6;
        this.vy += (dy / dist) * 0.4;
      }
    }

    return false;
  }

  draw(ctx) {
    const colors = this.colorMap[this.type] || this.colorMap.normal;

    ctx.save();

    // 1. Draw Motion Trail
    this.trail.forEach((pt, index) => {
      const alpha = (index + 1) / this.trail.length * 0.4;
      const r = this.radius * ((index + 1) / this.trail.length);

      ctx.fillStyle = colors.glow;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Draw Main Ball Body & Glow
    ctx.globalAlpha = 1;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 20;

    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      this.radius * 0.1,
      this.x,
      this.y,
      this.radius
    );
    grad.addColorStop(0, colors.core);
    grad.addColorStop(0.4, colors.glow);
    grad.addColorStop(1, colors.main);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
