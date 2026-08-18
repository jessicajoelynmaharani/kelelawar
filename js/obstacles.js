/**
 * Rescue Crystals, Powerups, Stalactites, & Floor Shield Entities
 */

// Floating Rescue Portal Crystal
class RescuePortal {
  constructor(x, y, radius = 35) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.angle = 0;
    this.pulse = 0;
  }

  update(particleSystem) {
    this.angle += 0.03;
    this.pulse = Math.sin(this.angle) * 4;

    if (Math.random() < 0.25) {
      particleSystem.addSpark(
        this.x + (Math.random() - 0.5) * this.radius,
        this.y + (Math.random() - 0.5) * this.radius,
        '#ffd700',
        1
      );
    }
  }

  checkRescue(ball, particleSystem, soundEngine) {
    const dist = Math.hypot(ball.x - this.x, ball.y - this.y);
    if (dist < this.radius + ball.radius) {
      // Ball rescued into portal!
      particleSystem.addSpark(this.x, this.y, '#ffd700', 30);
      particleSystem.addSonarWave(this.x, this.y, '#ffd700');
      soundEngine.playRescue();
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const r = this.radius + this.pulse;

    // Outer Glowing Ring
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating Crystal Star Inner Design
    ctx.rotate(this.angle);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a) * (r * 0.7);
      const y = Math.sin(a) * (r * 0.7);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// Falling Power-Up Item
class PowerupItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'giant', 'magnet', 'shield', 'slow', 'multiball'
    this.vy = 2.5;
    this.radius = 16;
    this.angle = 0;

    this.icons = {
      giant: '🦇',
      magnet: '🔊',
      shield: '🛡️',
      slow: '⏱️',
      multiball: '💥'
    };

    this.colors = {
      giant: '#ffc107',
      magnet: '#ff007f',
      shield: '#00f3ff',
      slow: '#00ff88',
      multiball: '#a040ff'
    };
  }

  update() {
    this.y += this.vy;
    this.angle += 0.05;
  }

  checkCatch(bat) {
    const bounds = bat.getBounds();
    return (
      this.x >= bounds.left &&
      this.x <= bounds.right &&
      this.y + this.radius >= bounds.top &&
      this.y - this.radius <= bounds.bottom
    ) || Math.hypot(this.x - bat.x, this.y - bat.y) < bat.width / 2 + this.radius;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const color = this.colors[this.type] || '#00f3ff';

    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(15, 10, 30, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Icon Text
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icons[this.type] || '✨', 0, 1);

    ctx.restore();
  }
}

// Danger Hazard: Falling Stalactite Spike
class Stalactite {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 3.5 + Math.random() * 2.5;
    this.width = 18;
    this.height = 36;
  }

  update() {
    this.y += this.vy;
  }

  checkHitBat(bat) {
    const bounds = bat.getBounds();
    return (
      this.x >= bounds.left &&
      this.x <= bounds.right &&
      this.y + this.height >= bounds.top &&
      this.y <= bounds.bottom
    );
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = '#4a3e6b';
    ctx.strokeStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-this.width / 2, 0);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(0, this.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// Floor Abyss Shield Barrier
class FloorShield {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.active = false;
    this.timer = 0;
  }

  activate(duration = 450) {
    this.active = true;
    this.timer = duration;
  }

  update(particleSystem) {
    if (!this.active) return;
    this.timer--;
    if (this.timer <= 0) {
      this.active = false;
    }

    if (Math.random() < 0.4) {
      particleSystem.addSpark(
        Math.random() * this.width,
        this.height - 12,
        '#00f3ff',
        2
      );
    }
  }

  checkBallSave(ball, particleSystem, soundEngine) {
    if (!this.active) return false;
    if (ball.y + ball.radius >= this.height - 15 && ball.vy > 0) {
      ball.vy = -Math.abs(ball.vy);
      ball.y = this.height - 15 - ball.radius;
      particleSystem.addSpark(ball.x, ball.y, '#00f3ff', 15);
      soundEngine.playBounce(8);
      return true;
    }
    return false;
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.moveTo(0, this.height - 10);
    ctx.lineTo(this.width, this.height - 10);
    ctx.stroke();

    // Electric energy beam pulse
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, this.height - 10);
    for (let x = 0; x < this.width; x += 30) {
      ctx.lineTo(x + 15, this.height - 10 + (Math.random() - 0.5) * 6);
    }
    ctx.stroke();

    ctx.restore();
  }
}
