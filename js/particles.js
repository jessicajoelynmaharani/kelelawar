/**
 * High Performance Canvas Particle System
 */
class Particle {
  constructor(x, y, vx, vy, color, radius, life, type = 'spark') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.maxLife = life;
    this.life = life;
    this.type = type; // 'spark', 'ring', 'dust', 'star'
    this.alpha = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);

    if (this.type === 'ring') {
      this.radius += 3.5;
    } else if (this.type === 'spark') {
      this.vy += 0.05; // light gravity
      this.radius *= 0.96;
    } else if (this.type === 'dust') {
      this.vx += (Math.random() - 0.5) * 0.02;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.radius), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addSpark(x, y, color = '#00f3ff', count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const radius = 2 + Math.random() * 3;
      const life = 20 + Math.random() * 25;
      this.particles.push(new Particle(x, y, vx, vy, color, radius, life, 'spark'));
    }
  }

  addSonarWave(x, y, color = '#00f3ff') {
    this.particles.push(new Particle(x, y, 0, 0, color, 10, 40, 'ring'));
  }

  addAmbientDust(width, height) {
    if (this.particles.length > 200) return;
    const x = Math.random() * width;
    const y = height + 10;
    const vx = (Math.random() - 0.5) * 0.4;
    const vy = - (0.3 + Math.random() * 0.5);
    const color = Math.random() > 0.5 ? '#9d4edd' : '#00f3ff';
    const radius = 1 + Math.random() * 2;
    const life = 120 + Math.random() * 180;
    this.particles.push(new Particle(x, y, vx, vy, color, radius, life, 'dust'));
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }

  clear() {
    this.particles = [];
  }
}
