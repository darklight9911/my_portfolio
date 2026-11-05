/**
 * Cozy Nature Wind, Swaying Branches, Falling Small Leaves & Visiting Birds Engine
 * Portfolio of Umme Munia
 */

(() => {
  const canvas = document.getElementById('leaves-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // Universal time-aware greeting etiquette:
  // 5:00 AM – 11:59 AM: "Good Morning"
  // 12:00 PM – 4:59 PM: "Good Afternoon"
  // 5:00 PM – 9:59 PM:  "Good Evening"
  // 10:00 PM – 4:59 AM (Late night / outside standard greeting hours): "Welcome"
  const greetingEl = document.getElementById('time-greeting-text');
  if (greetingEl) {
    const hour = new Date().getHours();
    let greeting = 'Welcome';
    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Good Evening';
    }
    greetingEl.textContent = greeting;
  }

  // Cozy green palette strictly from the 10-shade Verdant Veil palette
  const LEAF_COLORS = [
    '#1a3b2a', // deepest evergreen
    '#1f4730', // dark forest green
    '#2e5a34', // primary pine green
    '#3e6c41', // deep woodland green
    '#4a7a4d', // rich moss green
    '#5b8b5a', // medium leafy green
    '#7fa471'  // soft botanical green
  ];

  // Bird colors strictly from the palette, centered around #9bb78b
  const BIRD_PALETTE = {
    body: '#9bb78b',       // requested primary bird color
    breast: '#b7c9a4',     // soft sunlit chest highlight from palette
    wingFront: '#7fa471',  // folded/front wing tone from palette
    wingBack: '#5b8b5a',   // far wing depth shade from palette
    tail: '#7fa471',       // tail feathers from palette
    beakAndLegs: '#1a3b2a',
    eye: '#1a3b2a'
  };

  // Wind state (natural rhythmic gusts)
  const wind = {
    current: 0.35,
    target: 0.35,
    time: 0,
    gustTimer: 0
  };

  // Subtle mouse breeze interaction
  const mouse = {
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    lastX: 0,
    lastY: 0
  };

  window.addEventListener('mousemove', (e) => {
    mouse.vx = (e.clientX - mouse.lastX) * 0.12;
    mouse.vy = (e.clientY - mouse.lastY) * 0.12;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Spawn zones corresponding to the left and right tree boughs
  function getTreeSpawnPoint(side) {
    const treeWidth = Math.min(Math.max(width * 0.28, 180), 420);
    const tierRand = Math.random();
    let yRatio, xReachRatio;

    if (tierRand < 0.55) {
      yRatio = 0.04 + Math.random() * 0.18;
      xReachRatio = 0.12 + Math.random() * 0.78;
    } else if (tierRand < 0.85) {
      yRatio = 0.24 + Math.random() * 0.14;
      xReachRatio = 0.08 + Math.random() * 0.55;
    } else {
      yRatio = 0.45 + Math.random() * 0.12;
      xReachRatio = 0.06 + Math.random() * 0.38;
    }

    const xOffset = treeWidth * xReachRatio;
    const x = side === 'left' ? xOffset : width - xOffset;
    const y = height * yRatio;

    return { x, y, side };
  }

  class FallingLeaf {
    constructor(initialRandomY = false, forcedSide = null) {
      this.reset(initialRandomY, forcedSide);
    }

    reset(initialRandomY = false, forcedSide = null, customPos = null) {
      const side = forcedSide || (Math.random() < 0.52 ? 'left' : 'right');
      const spawn = customPos || getTreeSpawnPoint(side);

      this.side = side;
      this.x = spawn.x + (customPos ? (Math.random() - 0.5) * 18 : 0);
      this.y = customPos ? spawn.y + (Math.random() - 0.5) * 10 : (initialRandomY ? Math.random() * height * 0.85 : spawn.y);

      // Small delicate leaf size (6px to 12.5px)
      this.size = 6.5 + Math.random() * 6;
      this.color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];

      // Natural falling & drifting speeds
      this.vy = 0.45 + Math.random() * 0.65;
      const inwardBias = side === 'left' ? (0.15 + Math.random() * 0.35) : -(0.15 + Math.random() * 0.35);
      this.baseVx = inwardBias;
      this.vx = inwardBias;

      // Flutter / pendulum physics
      this.swayPhase = Math.random() * Math.PI * 2;
      this.swaySpeed = 0.018 + Math.random() * 0.022;
      this.swayAmp = 0.45 + Math.random() * 0.75;

      // 3D tumble / rotation physics
      this.angle = Math.random() * Math.PI * 2;
      this.angularVelocity = (Math.random() - 0.5) * 0.02;
      this.flipPhase = Math.random() * Math.PI * 2;
      this.flipSpeed = 0.02 + Math.random() * 0.03;

      this.opacity = (initialRandomY || customPos) ? (0.65 + Math.random() * 0.3) : 0.01;
      this.maxOpacity = 0.65 + Math.random() * 0.3;
      this.windSensitivity = 0.65 + Math.random() * 0.6;
    }

    update() {
      this.swayPhase += this.swaySpeed;
      this.flipPhase += this.flipSpeed;

      const flutterX = Math.sin(this.swayPhase) * this.swayAmp;
      const windPush = wind.current * this.windSensitivity;

      this.vx += (this.baseVx + flutterX + windPush - this.vx) * 0.06;
      const flutterLift = Math.abs(Math.cos(this.swayPhase)) * 0.08;

      // Gentle cursor breeze interaction
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 16000) {
        const force = (1 - distSq / 16000) * 0.35;
        this.vx += mouse.vx * force;
        this.vy += mouse.vy * force * 0.3;
      }

      this.x += this.vx;
      this.y += Math.max(0.2, this.vy - flutterLift);
      this.angle += this.angularVelocity + Math.cos(this.swayPhase) * 0.012 + wind.current * 0.006;

      if (this.y < height * 0.78) {
        this.opacity = Math.min(this.maxOpacity, this.opacity + 0.018);
      } else {
        const fadeProgress = (this.y - height * 0.78) / (height * 0.22);
        this.opacity = Math.max(0, this.maxOpacity * (1 - fadeProgress));
      }

      if (this.y > height + 20 || this.x < -60 || this.x > width + 60 || (this.y > height * 0.85 && this.opacity <= 0.01)) {
        this.reset(false);
      }
    }

    draw(ctx) {
      if (this.opacity <= 0.01) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      const flipScale = 0.35 + Math.abs(Math.cos(this.flipPhase)) * 0.65;
      ctx.scale(flipScale, 1);

      ctx.globalAlpha = this.opacity;
      const s = this.size;

      // Pointed botanical leaf shape
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.55, -s * 0.45, s * 0.5, s * 0.45, 0, s);
      ctx.bezierCurveTo(-s * 0.5, s * 0.45, -s * 0.55, -s * 0.45, 0, -s);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.fill();

      // Tiny stem at base
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(0, -s * 1.28);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 0.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Subtle central leaf vein
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.75);
      ctx.lineTo(0, s * 0.65);
      ctx.strokeStyle = 'rgba(212, 225, 197, 0.38)';
      ctx.lineWidth = 0.55;
      ctx.stroke();

      ctx.restore();
    }
  }

  // Create falling leaves pool
  const LEAF_COUNT = 38;
  const leaves = Array.from({ length: LEAF_COUNT }, (_, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    return new FallingLeaf(true, side);
  });

  // Helper to rustle 2 leaves off a branch when a bird lands or takes off
  let rustleIndex = 0;
  function rustleBranchLeaves(x, y, side) {
    for (let i = 0; i < 2; i++) {
      const leaf = leaves[rustleIndex % leaves.length];
      rustleIndex++;
      leaf.reset(false, side, { x, y });
    }
  }

  // ==========================================================
  // VISITING SONGBIRDS (#7fa471) FLYING IN, PERCHING & FLYING AWAY
  // ==========================================================
  const perchSpotElements = Array.from(document.querySelectorAll('.perch-spot'));
  const occupiedSpots = new Set();

  function getSpotPosition(spotEl) {
    const rect = spotEl.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5,
      side: spotEl.getAttribute('data-side') || 'left'
    };
  }

  function pickAvailablePerchSpot() {
    const valid = perchSpotElements.filter((el) => {
      if (occupiedSpots.has(el)) return false;
      const pos = getSpotPosition(el);
      return pos.x > 25 && pos.x < width - 25 && pos.y > 25 && pos.y < height * 0.75;
    });
    if (valid.length === 0) return null;
    return valid[Math.floor(Math.random() * valid.length)];
  }

  // Cubic ease-out and ease-in-out helpers for natural bird flight
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInQuad(t) {
    return t * t;
  }

  class VisitingBird {
    constructor(index) {
      this.index = index;
      this.state = 'WAITING'; // WAITING | FLYING_IN | PERCHED | FLYING_AWAY
      // First bird arrives quickly (~1.2s), second bird arrives after ~4s
      this.timer = index === 0 ? 75 : 240;
      this.scale = index === 0 ? 1.0 : 0.92;
      this.spotEl = null;

      this.x = -100;
      this.y = -100;
      this.facing = 1; // 1 = facing right, -1 = facing left
      this.wingPhase = Math.random() * Math.PI * 2;
      this.wingOpen = 0; // 0 = folded on branch, 1 = actively flapping in flight
      this.flightPitch = 0;

      // Idle perched animations
      this.headTilt = 0;
      this.targetHeadTilt = 0;
      this.tailBob = 0;
      this.hopOffset = 0;
      this.hopPhase = 0;
    }

    startFlightIn() {
      const spotEl = pickAvailablePerchSpot();
      if (!spotEl) {
        this.timer = 120;
        return;
      }

      this.spotEl = spotEl;
      occupiedSpots.add(spotEl);

      const target = getSpotPosition(spotEl);
      this.targetSide = target.side;

      // Spawn from off-screen sky (either opposite side or high above)
      const fromLeft = target.side === 'left'
        ? (Math.random() < 0.45)
        : (Math.random() < 0.75);

      this.startX = fromLeft ? -70 : width + 70;
      this.startY = height * (0.04 + Math.random() * 0.28);

      // Control point creates a graceful swooping arc down then up onto the branch
      this.ctrlX = (this.startX + target.x) * 0.5 + (Math.random() - 0.5) * 120;
      this.ctrlY = Math.max(target.y + 55 + Math.random() * 65, this.startY + 40);

      this.flightProgress = 0;
      const dist = Math.hypot(target.x - this.startX, target.y - this.startY);
      this.flightDuration = Math.max(130, Math.min(220, Math.floor(dist / 3.8)));

      this.x = this.startX;
      this.y = this.startY;
      this.facing = target.x >= this.startX ? 1 : -1;
      this.state = 'FLYING_IN';
    }

    startFlightAway() {
      if (this.spotEl) {
        const pos = getSpotPosition(this.spotEl);
        rustleBranchLeaves(pos.x, pos.y, this.targetSide);
        occupiedSpots.delete(this.spotEl);
        this.spotEl = null;
      }

      this.startX = this.x;
      this.startY = this.y;

      // Fly toward the open center sky and off-screen
      const flyRight = this.targetSide === 'left' ? (Math.random() < 0.8) : (Math.random() < 0.2);
      this.facing = flyRight ? 1 : -1;

      this.endX = flyRight ? width + 90 : -90;
      this.endY = height * (0.03 + Math.random() * 0.3);

      this.ctrlX = (this.startX + this.endX) * 0.5;
      this.ctrlY = Math.min(this.startY, this.endY) - (30 + Math.random() * 60);

      this.flightProgress = 0;
      const dist = Math.hypot(this.endX - this.startX, this.endY - this.startY);
      this.flightDuration = Math.max(115, Math.min(195, Math.floor(dist / 4.3)));

      this.state = 'FLYING_AWAY';
    }

    update() {
      if (this.state === 'WAITING') {
        this.timer--;
        if (this.timer <= 0) {
          this.startFlightIn();
        }
        return;
      }

      if (this.state === 'FLYING_IN') {
        this.flightProgress++;
        const rawT = Math.min(1, this.flightProgress / this.flightDuration);
        const t = easeOutCubic(rawT);

        // Live target branch position (follows swaying branch!)
        const target = this.spotEl ? getSpotPosition(this.spotEl) : { x: width * 0.2, y: height * 0.2 };

        const invT = 1 - t;
        const nextX = invT * invT * this.startX + 2 * invT * t * this.ctrlX + t * t * target.x;
        const nextY = invT * invT * this.startY + 2 * invT * t * this.ctrlY + t * t * target.y;

        const dx = nextX - this.x;
        const dy = nextY - this.y;
        if (Math.abs(dx) > 0.1) {
          this.facing = dx >= 0 ? 1 : -1;
        }

        // Smooth pitch angle along flight trajectory, leveling out upon landing
        const pathAngle = Math.atan2(dy, Math.abs(dx) + 0.1);
        const landingBlend = Math.max(0, (rawT - 0.72) / 0.28);
        this.flightPitch = pathAngle * 0.55 * (1 - landingBlend);

        // Wing flapping: active in flight, rapid braking flutter just before landing
        const flapSpeed = rawT > 0.75 ? 0.42 : 0.28;
        this.wingPhase += flapSpeed;
        this.wingOpen = rawT > 0.92 ? (1 - rawT) * 12.5 : 1;

        this.x = nextX;
        this.y = nextY;

        if (rawT >= 1) {
          this.state = 'PERCHED';
          this.wingOpen = 0;
          this.flightPitch = 0;
          // Face inward toward the center of the canvas while perched
          this.facing = this.targetSide === 'left' ? 1 : -1;
          // Sit on the branch for a random duration (5.5s to 11.5s at 60fps)
          this.perchTimer = 330 + Math.floor(Math.random() * 360);
          rustleBranchLeaves(this.x, this.y, this.targetSide);
        }
        return;
      }

      if (this.state === 'PERCHED') {
        if (this.spotEl) {
          const liveSpot = getSpotPosition(this.spotEl);
          this.x = liveSpot.x;
          this.y = liveSpot.y;
        }

        // If user scrolled the hero branch off-screen, release perch spot
        if (this.y < -30) {
          if (this.spotEl) {
            occupiedSpots.delete(this.spotEl);
            this.spotEl = null;
          }
          this.state = 'WAITING';
          this.timer = 90;
          return;
        }

        this.perchTimer--;
        this.tailBob += 0.05;

        // Occasional cute head tilt or looking around
        if (Math.random() < 0.012) {
          this.targetHeadTilt = (Math.random() - 0.5) * 0.35;
        }
        if (Math.random() < 0.004 && this.perchTimer > 60) {
          this.facing *= -1;
        }
        // Occasional tiny hop on the branch
        if (this.hopPhase > 0) {
          this.hopPhase += 0.18;
          this.hopOffset = -Math.sin(this.hopPhase) * 4.5;
          if (this.hopPhase >= Math.PI) {
            this.hopPhase = 0;
            this.hopOffset = 0;
          }
        } else if (Math.random() < 0.005 && this.perchTimer > 50) {
          this.hopPhase = 0.01;
        }

        this.headTilt += (this.targetHeadTilt - this.headTilt) * 0.1;

        // If cursor comes very close, the bird playfully takes off early
        const distToMouse = Math.hypot(this.x - mouse.x, this.y - mouse.y);
        if (distToMouse < 55 || this.perchTimer <= 0) {
          this.startFlightAway();
        }
        return;
      }

      if (this.state === 'FLYING_AWAY') {
        this.flightProgress++;
        const rawT = Math.min(1, this.flightProgress / this.flightDuration);
        const t = 0.35 * rawT + 0.65 * easeInQuad(rawT);

        const invT = 1 - t;
        const nextX = invT * invT * this.startX + 2 * invT * t * this.ctrlX + t * t * this.endX;
        const nextY = invT * invT * this.startY + 2 * invT * t * this.ctrlY + t * t * this.endY;

        const dx = nextX - this.x;
        const dy = nextY - this.y;
        if (Math.abs(dx) > 0.1) {
          this.facing = dx >= 0 ? 1 : -1;
        }

        this.flightPitch = Math.atan2(dy, Math.abs(dx) + 0.1) * 0.5;
        this.wingPhase += 0.32;
        this.wingOpen = Math.min(1, rawT * 5);

        this.x = nextX;
        this.y = nextY;

        if (rawT >= 1) {
          this.state = 'WAITING';
          // Wait 3.5s to 8.5s before another bird flies in
          this.timer = 210 + Math.floor(Math.random() * 300);
        }
      }
    }

    draw(ctx) {
      if (this.state === 'WAITING') return;

      ctx.save();
      ctx.translate(this.x, this.y + this.hopOffset);
      ctx.scale(this.facing * this.scale, this.scale);
      ctx.rotate(this.flightPitch);

      const isFlying = this.wingOpen > 0.08;
      const flap = Math.sin(this.wingPhase);

      // 1. Far Wing (drawn behind body when flying)
      if (isFlying) {
        ctx.save();
        ctx.translate(-2, -11);
        ctx.rotate((flap * 0.85 - 0.25) * this.wingOpen);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-6, -14, -18, -18, -22, -6);
        ctx.bezierCurveTo(-15, -1, -6, 2, 0, 0);
        ctx.closePath();
        ctx.fillStyle = BIRD_PALETTE.wingBack;
        ctx.fill();
        ctx.restore();
      }

      // 2. Delicate Perched Legs (drawn when perched or landing)
      if (this.wingOpen < 0.6) {
        ctx.save();
        ctx.strokeStyle = BIRD_PALETTE.beakAndLegs;
        ctx.lineWidth = 1.25;
        ctx.lineCap = 'round';
        // Back leg
        ctx.beginPath();
        ctx.moveTo(-2.5, -6);
        ctx.lineTo(-1, 0);
        ctx.lineTo(1.5, 0.5);
        ctx.stroke();
        // Front leg
        ctx.beginPath();
        ctx.moveTo(1.5, -6);
        ctx.lineTo(3, 0);
        ctx.lineTo(5.5, 0.5);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Tail Feathers (gentle balance bob when perched)
      ctx.save();
      const tailAngle = isFlying
        ? Math.sin(this.wingPhase) * 0.06
        : Math.sin(this.tailBob) * 0.05 + wind.current * 0.04;
      ctx.translate(-9, -8);
      ctx.rotate(tailAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 5);
      ctx.lineTo(-13, 1.5);
      ctx.lineTo(-16, -0.5);
      ctx.lineTo(-1, -3);
      ctx.closePath();
      ctx.fillStyle = BIRD_PALETTE.tail;
      ctx.fill();
      ctx.restore();

      // 4. Bird Body & Plump Breast (#7fa471 primary)
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.bezierCurveTo(-6, -15, 4, -16, 9, -11);
      ctx.bezierCurveTo(12, -7, 8, -3, 1, -4);
      ctx.bezierCurveTo(-4, -4, -8, -5, -10, -8);
      ctx.closePath();
      ctx.fillStyle = BIRD_PALETTE.body;
      ctx.fill();

      // Soft Breast Highlight
      ctx.beginPath();
      ctx.arc(3.5, -8.5, 4.8, -0.4, Math.PI * 0.65);
      ctx.fillStyle = BIRD_PALETTE.breast;
      ctx.fill();

      // 5. Head, Eye & Pointed Songbird Beak
      ctx.save();
      ctx.translate(7.5, -13);
      ctx.rotate(isFlying ? 0.1 : this.headTilt);

      // Head
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = BIRD_PALETTE.body;
      ctx.fill();

      // Tiny Beak
      ctx.beginPath();
      ctx.moveTo(4.4, -1.3);
      ctx.lineTo(9.2, 0.2);
      ctx.lineTo(4.4, 1.5);
      ctx.closePath();
      ctx.fillStyle = BIRD_PALETTE.beakAndLegs;
      ctx.fill();

      // Bright Dark Eye with tiny catchlight
      ctx.beginPath();
      ctx.arc(1.8, -0.8, 1.15, 0, Math.PI * 2);
      ctx.fillStyle = BIRD_PALETTE.eye;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(2.1, -1.1, 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#d4e1c5';
      ctx.fill();
      ctx.restore();

      // 6. Near Wing (folded neatly when perched, flapping when flying)
      ctx.save();
      if (isFlying) {
        ctx.translate(0, -10);
        ctx.rotate((flap * 1.05 + 0.1) * this.wingOpen);
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.bezierCurveTo(-2, -16, -15, -20, -20, -7);
        ctx.bezierCurveTo(-13, -1, -4, 3, 2, 0);
        ctx.closePath();
        ctx.fillStyle = BIRD_PALETTE.wingFront;
        ctx.fill();
      } else {
        // Folded resting wing along back
        ctx.beginPath();
        ctx.moveTo(3, -11.5);
        ctx.bezierCurveTo(-2, -12.5, -8, -10, -11, -6.5);
        ctx.bezierCurveTo(-5, -5.5, 1, -7, 3, -11.5);
        ctx.closePath();
        ctx.fillStyle = BIRD_PALETTE.wingFront;
        ctx.fill();
      }
      ctx.restore();

      ctx.restore();
    }
  }

  // Two independent songbirds that fly in, sit on random branches, and fly away
  const birds = [new VisitingBird(0), new VisitingBird(1)];

  function updateWind() {
    wind.time += 0.012;
    wind.gustTimer++;

    if (wind.gustTimer > 180 + Math.random() * 160) {
      wind.gustTimer = 0;
      const gustSign = Math.random() < 0.6 ? 1 : -1;
      const gustStrength = 0.55 + Math.random() * 0.85;
      wind.target = gustSign * gustStrength;
    } else if (wind.gustTimer === 95) {
      wind.target = (Math.random() - 0.45) * 0.35;
    }

    const naturalWave = Math.sin(wind.time) * 0.22 + Math.sin(wind.time * 2.3) * 0.1;
    wind.current += (wind.target + naturalWave - wind.current) * 0.025;

    mouse.vx *= 0.9;
    mouse.vy *= 0.9;

    const leftTree = document.querySelector('.tree-left');
    const rightTree = document.querySelector('.tree-right');
    const skewVal = (wind.current * 1.35).toFixed(2);
    if (leftTree && rightTree) {
      leftTree.style.transform = `skewX(${skewVal}deg)`;
      rightTree.style.transform = `skewX(${skewVal}deg)`;
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    updateWind();

    // Update & draw visiting songbirds (#9bb78b)
    for (let i = 0; i < birds.length; i++) {
      birds[i].update();
      birds[i].draw(ctx);
    }

    // Update & draw falling small leaves
    for (let i = 0; i < leaves.length; i++) {
      leaves[i].update();
      leaves[i].draw(ctx);
    }

    requestAnimationFrame(animate);
  }

  // Scroll-reveal observer for sections below the hero
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.14 }
    );
    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  // Continuous Left & Right Growing Vines on Scroll
  const pageContent = document.querySelector('.page-content');
  const leftVineSvg = document.querySelector('.growing-vine-left .vine-rail-svg');
  const vinePaths = Array.from(document.querySelectorAll('.vine-grow-path'));
  const vineSprouts = Array.from(document.querySelectorAll('.vine-sprout'));

  const VINE_START_Y = -20;
  const VINE_END_Y = 4600;
  const VINE_SPAN_Y = VINE_END_Y - VINE_START_Y;

  const pathLengths = vinePaths.map((p) => {
    const len = p.getTotalLength ? p.getTotalLength() : 4650;
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    return len;
  });

  function getSvgYAtScreenY(screenY) {
    if (leftVineSvg && leftVineSvg.getScreenCTM) {
      const ctm = leftVineSvg.getScreenCTM();
      if (ctm && ctm.d > 0) {
        return (screenY - ctm.f) / ctm.d;
      }
    }
    const rect = pageContent.getBoundingClientRect();
    const svgWidth = leftVineSvg ? leftVineSvg.getBoundingClientRect().width : 250;
    const svgScale = Math.max(svgWidth / 250, Math.max(1, rect.height) / VINE_END_Y);
    return (screenY - rect.top) / svgScale;
  }

  function updateGrowingVines() {
    if (!pageContent) return;
    const rect = pageContent.getBoundingClientRect();

    // If user is at the top in the Hero section and hasn't scrolled into .page-content yet
    const scrolledPx = window.innerHeight - rect.top;
    if (scrolledPx <= 20) {
      vinePaths.forEach((path, i) => {
        path.style.strokeDashoffset = `${pathLengths[i]}`;
      });
      vineSprouts.forEach((sprout) => {
        sprout.classList.remove('is-sprouted');
      });
      return;
    }

    // Grow vine stems slightly past the bottom edge of the viewport (+65px) so there is never a gap below while scrolling
    const stemTipSvgY = getSvgYAtScreenY(window.innerHeight + 65);
    const progress = Math.max(0, Math.min(1, (stemTipSvgY - VINE_START_Y) / VINE_SPAN_Y));

    vinePaths.forEach((path, i) => {
      const len = pathLengths[i];
      path.style.strokeDashoffset = `${len * (1 - progress)}`;
    });

    // Branches ONLY sprout after the vine stem has already grown past their anchor node,
    // and fold back in when scrolling up before the vine stem retracts past them.
    const isAtPageBottom = rect.bottom <= window.innerHeight + 25;
    const requiredLead = isAtPageBottom ? 15 : 75;
    vineSprouts.forEach((sprout) => {
      const nodeY = parseFloat(sprout.getAttribute('data-y') || '0');
      const isAlreadySprouted = sprout.classList.contains('is-sprouted');
      if (!isAlreadySprouted && stemTipSvgY >= nodeY + requiredLead) {
        sprout.classList.add('is-sprouted');
      } else if (isAlreadySprouted && stemTipSvgY < nodeY + 45) {
        sprout.classList.remove('is-sprouted');
      }
    });
  }

  window.addEventListener('scroll', updateGrowingVines, { passive: true });
  window.addEventListener('resize', updateGrowingVines);
  updateGrowingVines();

  requestAnimationFrame(animate);
})();
