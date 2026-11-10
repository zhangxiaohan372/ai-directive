import * as THREE from 'three';

/**
 * Procedural texture generators for 3D Forensic Evidence inspection.
 * Zero external 404 dependencies, 100% HTML5 Canvas-based, SRGBColorSpace compliant.
 */

// Helper to set standard texture options
function finishTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  return texture;
}

/**
 * 1. Folded Artist's Rag Texture:
 *    Natural linen fabric weave with heavy French Cadmium Red (#302) oil paint stains
 *    and translucent solvent (turpentine) bleeding rings.
 */
export function createClothTexture(isUV: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (isUV) {
    // Under UV blacklight: Deep indigo/violet background with fluorescent crimson paint
    ctx.fillStyle = '#080614';
    ctx.fillRect(0, 0, 512, 512);

    // Fine synthetic fiber traces glowing in cyan
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
      ctx.stroke();
    }

    // Heavy glowing Cadmium Red stain with vibrant neon orange-red phosphor core
    const radGlow = ctx.createRadialGradient(256, 256, 30, 256, 256, 220);
    radGlow.addColorStop(0, '#FF2A4D');
    radGlow.addColorStop(0.4, '#EA1E3D');
    radGlow.addColorStop(0.7, 'rgba(190, 18, 45, 0.6)');
    radGlow.addColorStop(1, 'rgba(120, 10, 30, 0)');
    ctx.fillStyle = radGlow;
    ctx.beginPath();
    ctx.ellipse(256, 256, 210, 170, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Secondary smear
    ctx.fillStyle = 'rgba(255, 60, 90, 0.85)';
    ctx.beginPath();
    ctx.ellipse(320, 200, 90, 60, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Turpentine oily edge halo (faint yellow-green fluorescence)
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(256, 256, 225, 185, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Normal Mode: Authentic textured linen/cotton cloth
    ctx.fillStyle = '#E8E1D7';
    ctx.fillRect(0, 0, 512, 512);

    // Woven fiber thread pattern
    ctx.fillStyle = 'rgba(195, 185, 172, 0.35)';
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 1.5, 512);
    }
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1.5);
    }

    // Dirt and grimy smudge on edges
    const grime = ctx.createRadialGradient(256, 256, 180, 256, 256, 256);
    grime.addColorStop(0, 'rgba(0,0,0,0)');
    grime.addColorStop(1, 'rgba(90, 75, 60, 0.35)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, 0, 512, 512);

    // Turpentine yellowish greasy solvent soak ring
    const turpGrad = ctx.createRadialGradient(256, 256, 60, 256, 256, 230);
    turpGrad.addColorStop(0, 'rgba(175, 140, 80, 0.45)');
    turpGrad.addColorStop(0.7, 'rgba(195, 160, 95, 0.25)');
    turpGrad.addColorStop(1, 'rgba(200, 170, 110, 0)');
    ctx.fillStyle = turpGrad;
    ctx.beginPath();
    ctx.ellipse(256, 256, 220, 180, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // French Cadmium Red (#302) thick painterly oil smears
    ctx.fillStyle = '#8F1313';
    ctx.beginPath();
    ctx.ellipse(256, 256, 170, 130, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#A31818';
    ctx.beginPath();
    ctx.ellipse(240, 245, 130, 95, Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#650B0B';
    ctx.beginPath();
    ctx.ellipse(270, 270, 90, 65, Math.PI / 7, 0, Math.PI * 2);
    ctx.fill();

    // Splattered paint droplets
    ctx.fillStyle = '#991414';
    const drops = [
      [120, 150, 7], [140, 180, 5], [380, 310, 8], [400, 280, 6],
      [190, 380, 9], [340, 140, 6], [290, 110, 4], [160, 290, 8]
    ];
    drops.forEach(([dx, dy, dr]) => {
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fold creasing shadows
    ctx.strokeStyle = 'rgba(60, 45, 35, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(80, 200);
    ctx.bezierCurveTo(200, 240, 310, 210, 440, 280);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(150, 100);
    ctx.bezierCurveTo(220, 220, 260, 350, 330, 430);
    ctx.stroke();
  }

  return finishTexture(canvas);
}

/**
 * 2. Antique Pocket Watch Roman Enamel Dial Texture
 */
export function createWatchDialTexture(isUV: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  if (isUV) {
    ctx.fillStyle = '#0B0A1A';
    ctx.fillRect(0, 0, 512, 512);

    // Luminescent markers
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 210, 0, Math.PI * 2);
    ctx.stroke();

    // Impact fracture point near 22:15 with glowing bronze dust
    ctx.fillStyle = '#EAB308';
    for (let i = 0; i < 40; i++) {
      const rx = cx - 110 + (Math.random() - 0.5) * 50;
      const ry = cy - 60 + (Math.random() - 0.5) * 50;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 2.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Aged porcelain ivory enamel dial
    const dialGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 240);
    dialGrad.addColorStop(0, '#FFFDF8');
    dialGrad.addColorStop(0.85, '#F5EDE0');
    dialGrad.addColorStop(1, '#E4D6C3');
    ctx.fillStyle = dialGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fill();

    // Outer double railway track
    ctx.strokeStyle = '#2B231D';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 206, 0, Math.PI * 2);
    ctx.stroke();

    // Minute division ticks (60)
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI) / 30;
      const isFive = i % 5 === 0;
      const rInner = isFive ? 195 : 206;
      const rOuter = 220;

      ctx.lineWidth = isFive ? 3 : 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
      ctx.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
      ctx.stroke();
    }

    // Roman Numerals
    const romans = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.fillStyle = '#1D1713';
    ctx.font = 'bold 30px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      const rx = cx + Math.cos(angle) * 165;
      const ry = cy + Math.sin(angle) * 165;
      ctx.fillText(romans[i], rx, ry);
    }

    // Vintage Luxury Branding Inscription
    ctx.font = 'italic 12px "Times New Roman", serif';
    ctx.fillStyle = '#4A3E36';
    ctx.fillText('VACHERON & CHERON', cx, cy - 70);
    ctx.font = '10px "Times New Roman", serif';
    ctx.fillText('CHRONOMÈTRE D\'ART · PARIS 1898', cx, cy - 54);

    // Subsidiary seconds dial at 6 o'clock
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#5A4C42';
    ctx.beginPath();
    ctx.arc(cx, cy + 85, 42, 0, Math.PI * 2);
    ctx.stroke();

    // Aged crack glaze radiating from impact point (upper-left)
    ctx.strokeStyle = 'rgba(70, 50, 40, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 110, cy - 60);
    ctx.lineTo(cx - 30, cy - 10);
    ctx.lineTo(cx + 40, cy + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 110, cy - 60);
    ctx.lineTo(cx - 160, cy + 20);
    ctx.stroke();
  }

  return finishTexture(canvas);
}

/**
 * 3. RFID Restoration Room Keycard Texture
 */
export function createKeycardTexture(isUV: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  if (isUV) {
    ctx.fillStyle = '#060A17';
    ctx.fillRect(0, 0, 512, 320);

    // Glowing security watermark crest
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 160, 75, 0, Math.PI * 2);
    ctx.stroke();

    // Fingerprint oily residue on corner
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 1.5;
    for (let r = 8; r < 40; r += 5) {
      ctx.beginPath();
      ctx.arc(430, 240, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Sleek dark charcoal/navy gallery master card
    const cardGrad = ctx.createLinearGradient(0, 0, 512, 320);
    cardGrad.addColorStop(0, '#1E242B');
    cardGrad.addColorStop(1, '#0F1216');
    ctx.fillStyle = cardGrad;
    ctx.fillRect(0, 0, 512, 320);

    // Metallic gold accent stripe
    ctx.fillStyle = '#C9942D';
    ctx.fillRect(0, 45, 512, 5);

    // Header title
    ctx.font = 'bold 18px serif';
    ctx.fillStyle = '#F3EFEA';
    ctx.fillText('METROPOLITAN CONTEMPORARY GALLERY', 36, 35);

    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#C9942D';
    ctx.fillText('MASTER ACCESS · RESTORATION LAB & ARCHIVE', 36, 75);

    // Card Holder ID / Details
    ctx.font = 'mono 13px monospace';
    ctx.fillStyle = '#9CA3AF';
    ctx.fillText('AUTHORIZATION: LEVEL 4 (SEC-02)', 36, 195);
    ctx.fillText('KEY-SERIAL: 8820-REST-BACKUP', 36, 218);
    ctx.fillText('LOGGED USE: 22:12:04 [AUTH OK]', 36, 241);

    // Contactless RFID icon
    ctx.strokeStyle = '#D8CFC5';
    ctx.lineWidth = 2.5;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(440, 160, i * 14, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }

    // Barcode at bottom
    ctx.fillStyle = '#D8CFC5';
    for (let x = 36; x < 400; x += (Math.random() > 0.4 ? 6 : 3)) {
      ctx.fillRect(x, 265, Math.random() > 0.5 ? 2.5 : 1.5, 30);
    }
  }

  return finishTexture(canvas);
}

/**
 * 4. Latent Fingerprint Texture (Forensic cyan phosphor whorl)
 */
export function createFingerprintTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';

  const cx = 128;
  const cy = 128;

  // Concentric fingerprint ridges with realistic irregularities
  for (let r = 8; r < 95; r += 7) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.75, r, Math.PI / 12, 0, Math.PI * 1.85);
    ctx.stroke();
  }

  return finishTexture(canvas);
}

/**
 * 5. Forensic Inspection Stage Plinth Texture:
 *    Laser-etched millimeter scale marks and degree increments on dark graphite plate.
 */
export function createTurntableTexture(isUV: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  // Dark matte obsidian base
  ctx.fillStyle = isUV ? '#0B0A14' : '#14110E';
  ctx.fillRect(0, 0, 512, 512);

  // Outer scale ring
  ctx.strokeStyle = isUV ? '#6366F1' : '#3B3027';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 230, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 215, 0, Math.PI * 2);
  ctx.stroke();

  // Degree ticks
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 45 === 0;
    const isMinor = deg % 15 === 0;
    const rInner = isMajor ? 200 : isMinor ? 208 : 215;

    ctx.strokeStyle = isMajor
      ? (isUV ? '#38BDF8' : '#C9942D')
      : (isUV ? '#818CF8' : '#5A4C42');
    ctx.lineWidth = isMajor ? 2 : 1;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * rInner, cy + Math.sin(rad) * rInner);
    ctx.lineTo(cx + Math.cos(rad) * 230, cy + Math.sin(rad) * 230);
    ctx.stroke();
  }

  // Crosshair center lines
  ctx.strokeStyle = isUV ? 'rgba(99, 102, 241, 0.4)' : 'rgba(201, 148, 45, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(cx - 160, cy);
  ctx.lineTo(cx + 160, cy);
  ctx.moveTo(cx, cy - 160);
  ctx.lineTo(cx, cy + 160);
  ctx.stroke();
  ctx.setLineDash([]);

  // Forensic Scale Label
  ctx.fillStyle = isUV ? '#A5B4FC' : '#73675E';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CRIME SCENE FORENSIC STAGE · METRIC 1:1', cx, cy + 175);

  return finishTexture(canvas);
}
