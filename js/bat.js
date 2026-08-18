/**
 * Bat Player Character Class
 */
class Bat {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.baseWidth = 110;
    this.width = this.baseWidth;
    this.height = 30;
    this.x = canvasWidth / 2;
    this.y = canvasHeight - 70;
    this.targetX = this.x;
    this.targetY = this.y;
    
    this.speed = 12;
    this.flapAngle = 0;
    this.flapSpeed = 0.15;
    
    // Sonar & Powerups
    this.sonarEnergy = 100;
    this.maxSonarEnergy = 100;
    this.isGiant = false;
    this.giantTimer = 0;
    this.isMagnet = false;
    this.magnetTimer = 0;

    // Visual animation states
    this.glowColor = '#00f3ff';
    this.eyeColor = '#00f3ff';
  }

  resize(w, h) {
    this.canvasWidth = w;
    this.canvasHeight = h;
    this.y = h - 70;
    this.targetY = this.y;
  }

  setTarget(x) {
    this.targetX = Math.max(this.width / 2, Math.min(this.canvasWidth - this.width / 2, x));
  }

  moveLeft() {
    this.setTarget(this.x - this.speed * 1.5);
  }

  moveRight() {
    this.setTarget(this.x + this.speed * 1.5);
  }

  triggerPowerup(type, duration = 300) {
    if (type === 'giant') {
      this.isGiant = true;
      this.giantTimer = duration;
      this.width = this.baseWidth * 1.5;
    } else if (type === 'magnet') {
      this.isMagnet = true;
      this.magnetTimer = duration;
    }
  }

  update(particleSystem) {
    // Smooth lerp to target position
    this.x += (this.targetX - this.x) * 0.25;

    // Wing flap oscillation
    this.flapAngle += this.flapSpeed;

    // Powerup Timers
    if (this.isGiant) {
      this.giantTimer--;
      if (this.giantTimer <= 0) {
        this.isGiant = false;
        this.width = this.baseWidth;
      }
    }

    if (this.isMagnet) {
      this.magnetTimer--;
      if (this.magnetTimer <= 0) {
        this.isMagnet = false;
      }
    }

    // Recharge Sonar Energy slowly
    if (this.sonarEnergy < this.maxSonarEnergy) {
      this.sonarEnergy = Math.min(this.maxSonarEnergy, this.sonarEnergy + 0.2);
    }
  }

  canUseSonar() {
    return this.sonarEnergy >= 30;
  }

  useSonar(particleSystem) {
    if (!this.canUseSonar()) return false;

    this.sonarEnergy -= 35;
    particleSystem.addSonarWave(this.x, this.y - 10, this.isMagnet ? '#ff007f' : '#00f3ff');
    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const wingOffset = Math.sin(this.flapAngle) * 16;
    const halfW = this.width / 2;

    // Glow Effect
    ctx.shadowColor = this.isMagnet ? '#ff007f' : (this.isGiant ? '#ffc107' : this.glowColor);
    ctx.shadowBlur = 18;

    // 1. Draw Bat Wings (Left & Right)
    ctx.fillStyle = 'rgba(25, 18, 48, 0.95)';
    ctx.strokeStyle = this.isMagnet ? '#ff007f' : (this.isGiant ? '#ffc107' : '#00f3ff');
    ctx.lineWidth = 2.5;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-halfW * 0.5, -30 + wingOffset, -halfW, -5 + wingOffset);
    ctx.quadraticCurveTo(-halfW * 0.7, 15, -halfW * 0.4, 8);
    ctx.quadraticCurveTo(-halfW * 0.2, 18, 0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(halfW * 0.5, -30 + wingOffset, halfW, -5 + wingOffset);
    ctx.quadraticCurveTo(halfW * 0.7, 15, halfW * 0.4, 8);
    ctx.quadraticCurveTo(halfW * 0.2, 18, 0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing Membrane Lines
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-halfW * 0.5, -25 + wingOffset);
    ctx.moveTo(0, -5);
    ctx.lineTo(halfW * 0.5, -25 + wingOffset);
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 2. Bat Body & Head
    ctx.fillStyle = '#100a26';
    ctx.strokeStyle = this.isMagnet ? '#ff007f' : '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bat Ears
    ctx.beginPath();
    // Left Ear
    ctx.moveTo(-10, -8);
    ctx.lineTo(-15, -22);
    ctx.lineTo(-5, -12);
    // Right Ear
    ctx.moveTo(5, -12);
    ctx.lineTo(15, -22);
    ctx.lineTo(10, -8);
    ctx.fillStyle = '#100a26';
    ctx.fill();
    ctx.stroke();

    // Glowing Eyes
    ctx.fillStyle = this.isMagnet ? '#ff007f' : (this.isGiant ? '#ffc107' : '#00f3ff');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-6, -3, 3, 0, Math.PI * 2);
    ctx.arc(6, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Magnet Aura Indicator if active
    if (this.isMagnet) {
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, halfW + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - 15,
      bottom: this.y + 15,
      width: this.width,
      height: this.height
    };
  }
}
