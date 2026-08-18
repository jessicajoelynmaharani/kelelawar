/**
 * Main Game Controller Engine
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
    this.mode = 'arcade'; // arcade, survival, challenge

    // Game stats
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('bat_rescue_highscore') || '0', 10);
    this.lives = 3;
    this.level = 1;
    this.combo = 0;
    this.savedBallsCount = 0;

    // Entities
    this.bat = null;
    this.balls = [];
    this.portals = [];
    this.powerups = [];
    this.stalactites = [];
    this.floorShield = null;
    this.particleSystem = new ParticleSystem();

    // Timers & Modifiers
    this.slowMotionFactor = 1;
    this.slowMotionTimer = 0;
    this.spawnTimer = 0;
    this.stalactiteTimer = 0;

    // Inputs
    this.keys = { left: false, right: false, sonar: false };
    
    this.initCanvas();
    this.initEventListeners();
    this.updateHUD();
  }

  initCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (this.bat) {
      this.bat.resize(this.width, this.height);
    }
    if (this.floorShield) {
      this.floorShield.width = this.width;
      this.floorShield.height = this.height;
    }
  }

  initEventListeners() {
    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      if (this.state !== 'PLAYING' || !this.bat) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      this.bat.setTarget(mouseX);
    });

    // Touch support
    this.canvas.addEventListener('touchmove', (e) => {
      if (this.state !== 'PLAYING' || !this.bat) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      this.bat.setTarget(touchX);
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state === 'PLAYING' && this.bat) {
        this.triggerSonar();
      }
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerSonar();
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    // UI Buttons
    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
    document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
    
    document.getElementById('muteBtn').addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      document.getElementById('muteBtn').textContent = isMuted ? '🔇' : '🔊';
    });

    // Mode Selector Buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
      });
    });
  }

  triggerSonar() {
    if (this.bat && this.bat.useSonar(this.particleSystem)) {
      audio.playSonar();

      // Sonar impulse: Bounces nearby balls upwards or pulls them
      this.balls.forEach(ball => {
        const dist = Math.hypot(ball.x - this.bat.x, ball.y - this.bat.y);
        if (dist < 260) {
          ball.vy = -Math.abs(ball.vy) - 3;
          ball.vx += (ball.x - this.bat.x) * 0.05;
          this.particleSystem.addSpark(ball.x, ball.y, '#00f3ff', 12);
        }
      });
    }
  }

  startGame() {
    this.score = 0;
    this.lives = this.mode === 'survival' ? 5 : 3;
    this.level = 1;
    this.combo = 0;
    this.savedBallsCount = 0;

    this.bat = new Bat(this.width, this.height);
    this.floorShield = new FloorShield(this.width, this.height);
    this.balls = [];
    this.portals = [];
    this.powerups = [];
    this.stalactites = [];
    this.particleSystem.clear();

    // Spawn initial ball
    this.spawnBall();

    // Create Rescue Portals near top
    if (this.mode !== 'survival') {
      this.spawnPortals();
    }

    this.state = 'PLAYING';
    document.getElementById('menuOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('pauseOverlay').classList.add('hidden');

    audio.startBGM();
    this.updateHUD();

    if (!this.loopRunning) {
      this.loopRunning = true;
      requestAnimationFrame(() => this.loop());
    }
  }

  spawnBall(type = 'normal') {
    const ball = new Ball(
      this.width / 2 + (Math.random() - 0.5) * 100,
      this.height * 0.3,
      (Math.random() - 0.5) * 6,
      -5 - Math.random() * 2,
      type
    );
    this.balls.push(ball);
  }

  spawnPortals() {
    this.portals = [];
    const count = this.mode === 'arcade' ? 2 : 3;
    const spacing = this.width / (count + 1);

    for (let i = 1; i <= count; i++) {
      this.portals.push(new RescuePortal(spacing * i, 110 + (i % 2) * 30, 36));
    }
  }

  spawnPowerup(x, y) {
    const types = ['giant', 'magnet', 'shield', 'slow', 'multiball'];
    const selected = types[Math.floor(Math.random() * types.length)];
    this.powerups.push(new PowerupItem(x, y, selected));
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pauseOverlay').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pauseOverlay').classList.add('hidden');
      requestAnimationFrame(() => this.loop());
    }
  }

  showComboPopup(text, x, y) {
    const container = document.getElementById('canvasContainer');
    const pop = document.createElement('div');
    pop.className = 'combo-popup';
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    container.appendChild(pop);

    setTimeout(() => {
      if (pop.parentElement) pop.parentElement.removeChild(pop);
    }, 1000);
  }

  update() {
    if (this.state !== 'PLAYING') return;

    // Keyboard bat navigation
    if (this.keys.left) this.bat.moveLeft();
    if (this.keys.right) this.bat.moveRight();

    // Slow motion timer
    if (this.slowMotionTimer > 0) {
      this.slowMotionTimer--;
      this.slowMotionFactor = 0.55;
      if (this.slowMotionTimer <= 0) this.slowMotionFactor = 1;
    }

    // Update Entities
    this.bat.update(this.particleSystem);
    this.floorShield.update(this.particleSystem);
    this.particleSystem.addAmbientDust(this.width, this.height);
    this.particleSystem.update();

    // Portals Update
    this.portals.forEach(p => p.update(this.particleSystem));

    // Survival mode auto-spawn ball timer
    if (this.mode === 'survival') {
      this.spawnTimer++;
      if (this.spawnTimer > 280) {
        this.spawnTimer = 0;
        if (this.balls.length < 6) this.spawnBall();
      }
    }

    // Challenge mode stalactite drop
    if (this.mode === 'challenge') {
      this.stalactiteTimer++;
      if (this.stalactiteTimer > 180) {
        this.stalactiteTimer = 0;
        this.stalactites.push(new Stalactite(50 + Math.random() * (this.width - 100), 0));
      }
    }

    // Stalactite Updates & Collisions
    for (let i = this.stalactites.length - 1; i >= 0; i--) {
      const st = this.stalactites[i];
      st.update();

      if (st.checkHitBat(this.bat)) {
        this.stalactites.splice(i, 1);
        this.particleSystem.addSpark(this.bat.x, this.bat.y, '#ff0055', 20);
        audio.playHurt();
        this.loseLife();
        continue;
      }

      if (st.y > this.height) {
        this.stalactites.splice(i, 1);
      }
    }

    // Powerups Update
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      pw.update();

      if (pw.checkCatch(this.bat)) {
        this.applyPowerup(pw.type);
        this.particleSystem.addSpark(pw.x, pw.y, pw.colors[pw.type], 15);
        audio.playPowerup();
        this.showComboPopup(`POWER-UP!`, pw.x, pw.y);
        this.powerups.splice(i, 1);
        continue;
      }

      if (pw.y > this.height) {
        this.powerups.splice(i, 1);
      }
    }

    // Balls Update & Collision
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      ball.update(this.width, this.height, this.particleSystem, this.slowMotionFactor);

      // Bat Bounce Check
      if (ball.checkBatCollision(this.bat, this.particleSystem, audio)) {
        this.combo++;
        const points = 10 * Math.min(this.combo, 5);
        this.score += points;
        if (this.combo >= 3 && this.combo % 3 === 0) {
          this.showComboPopup(`COMBO x${this.combo}!`, ball.x, ball.y - 20);
        }
      }

      // Check Floor Shield Save
      this.floorShield.checkBallSave(ball, this.particleSystem, audio);

      // Portal Rescue Check
      let rescued = false;
      for (const portal of this.portals) {
        if (portal.checkRescue(ball, this.particleSystem, audio)) {
          rescued = true;
          this.savedBallsCount++;
          const rescuePoints = 150 + this.combo * 20;
          this.score += rescuePoints;
          this.showComboPopup(`DISELAMATKAN! +${rescuePoints}`, portal.x, portal.y);

          // Chance to drop powerup
          if (Math.random() < 0.45) {
            this.spawnPowerup(portal.x, portal.y);
          }

          // Level Up check
          if (this.savedBallsCount % 5 === 0) {
            this.levelUp();
          }
          break;
        }
      }

      if (rescued) {
        this.balls.splice(i, 1);
        this.spawnBall(Math.random() < 0.25 ? 'gold' : 'normal');
        continue;
      }

      // Check if Ball Fell Into Abyss Bottom
      if (ball.y - ball.radius > this.height) {
        this.balls.splice(i, 1);
        this.combo = 0;

        // If no balls remaining, lose a life
        if (this.balls.length === 0) {
          audio.playHurt();
          this.loseLife();
          if (this.lives > 0) {
            this.spawnBall();
          }
        }
      }
    }

    this.updateHUD();
  }

  applyPowerup(type) {
    if (type === 'giant') {
      this.bat.triggerPowerup('giant', 350);
    } else if (type === 'magnet') {
      this.bat.triggerPowerup('magnet', 350);
    } else if (type === 'shield') {
      this.floorShield.activate(450);
    } else if (type === 'slow') {
      this.slowMotionTimer = 300;
    } else if (type === 'multiball') {
      this.spawnBall('gold');
      this.spawnBall('normal');
    }
  }

  loseLife() {
    this.lives--;
    this.updateHUD();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  levelUp() {
    this.level++;
    audio.playRescue();
    this.showComboPopup(`LEVEL ${this.level}!`, this.width / 2 - 50, this.height / 2);
  }

  gameOver() {
    this.state = 'GAMEOVER';
    audio.playGameOver();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('bat_rescue_highscore', this.highScore.toString());
    }

    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalHighScore').textContent = this.highScore;
    document.getElementById('finalSaved').textContent = this.savedBallsCount;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
  }

  updateHUD() {
    document.getElementById('scoreVal').textContent = this.score;
    document.getElementById('highScoreVal').textContent = this.highScore;
    document.getElementById('livesVal').textContent = '❤️'.repeat(Math.max(0, this.lives));
    document.getElementById('levelVal').textContent = this.level;

    if (this.bat) {
      const fill = document.getElementById('sonarBarFill');
      const pct = (this.bat.sonarEnergy / this.bat.maxSonarEnergy) * 100;
      fill.style.width = `${pct}%`;
    }

    // Active powerups badges UI
    const pwContainer = document.getElementById('powerupBar');
    pwContainer.innerHTML = '';
    if (this.bat && this.bat.isGiant) {
      pwContainer.innerHTML += `<div class="powerup-badge">🦇 Sayap Raksasa</div>`;
    }
    if (this.bat && this.bat.isMagnet) {
      pwContainer.innerHTML += `<div class="powerup-badge">🔊 Magnet Sonar</div>`;
    }
    if (this.floorShield && this.floorShield.active) {
      pwContainer.innerHTML += `<div class="powerup-badge">🛡️ Perisai Gua</div>`;
    }
    if (this.slowMotionTimer > 0) {
      pwContainer.innerHTML += `<div class="powerup-badge">⏱️ Waktu Lambat</div>`;
    }
  }

  draw() {
    // Clear canvas with deep cyber cave gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#06040d');
    bgGrad.addColorStop(0.5, '#0b0818');
    bgGrad.addColorStop(1, '#05030a');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw background particles (ambient cavern dust)
    this.particleSystem.draw(this.ctx);

    // Draw floor shield line if active
    if (this.floorShield) this.floorShield.draw(this.ctx);

    // Draw Portals
    this.portals.forEach(p => p.draw(this.ctx));

    // Draw Stalactites
    this.stalactites.forEach(s => s.draw(this.ctx));

    // Draw Power-ups
    this.powerups.forEach(pw => pw.draw(this.ctx));

    // Draw Balls
    this.balls.forEach(b => b.draw(this.ctx));

    // Draw Bat Player
    if (this.bat) this.bat.draw(this.ctx);
  }

  loop() {
    if (this.state === 'PLAYING') {
      this.update();
      this.draw();
      requestAnimationFrame(() => this.loop());
    }
  }
}

// Instantiate game on window load
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new Game();
});
