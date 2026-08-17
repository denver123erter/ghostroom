import * as THREE from 'three';

/**
 * Generates realistic procedural horror textures on HTML5 Canvases
 * without requiring external image assets.
 */
export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Aged dark wooden floor planks with grain, nail heads, gaps and dust
   */
  public static createWoodPlankTexture(): THREE.CanvasTexture {
    if (this.cache.has('wood_floor')) return this.cache.get('wood_floor')!;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base dark wood stain
    ctx.fillStyle = '#1c1611';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankCount = 12;
    const plankWidth = 1024 / plankCount;

    for (let i = 0; i < plankCount; i++) {
      const x = i * plankWidth;
      // Slight plank shade variation
      const shade = Math.floor(20 + Math.random() * 15);
      ctx.fillStyle = `rgb(${shade + 5}, ${shade}, ${shade - 6})`;
      ctx.fillRect(x + 1, 0, plankWidth - 2, 1024);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(10, 8, 6, 0.4)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 40; g++) {
        ctx.beginPath();
        const gx = x + Math.random() * plankWidth;
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(
          gx + (Math.random() * 6 - 3), 300,
          gx + (Math.random() * 6 - 3), 700,
          gx + (Math.random() * 6 - 3), 1024
        );
        ctx.stroke();
      }

      // Plank seams (dark grooves)
      ctx.fillStyle = '#080604';
      ctx.fillRect(x, 0, 2, 1024);

      // Nail heads at ends
      for (let ny of [30, 280, 560, 840, 1000]) {
        ctx.fillStyle = '#0f0c09';
        ctx.beginPath();
        ctx.arc(x + plankWidth * 0.3, ny, 3, 0, Math.PI * 2);
        ctx.arc(x + plankWidth * 0.7, ny, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Dirt, dust & grime overlay
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let p = 0; p < data.length; p += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[p] = Math.max(0, Math.min(255, data[p] + noise));
      data[p + 1] = Math.max(0, Math.min(255, data[p + 1] + noise));
      data[p + 2] = Math.max(0, Math.min(255, data[p + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set('wood_floor', texture);
    return texture;
  }

  /**
   * Cracked, peeling vintage floral horror wallpaper
   */
  public static createCrackedWallTexture(): THREE.CanvasTexture {
    if (this.cache.has('cracked_wall')) return this.cache.get('cracked_wall')!;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base aged yellowish/gray dirty plaster
    ctx.fillStyle = '#22201d';
    ctx.fillRect(0, 0, 1024, 1024);

    // Faded vintage damask / stripe pattern
    ctx.fillStyle = '#2b2720';
    for (let x = 0; x < 1024; x += 64) {
      ctx.fillRect(x, 0, 32, 1024);
      // Subtle vintage crests
      for (let y = 32; y < 1024; y += 96) {
        ctx.beginPath();
        ctx.arc(x + 16, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1c17';
        ctx.fill();
        ctx.fillStyle = '#2b2720';
      }
    }

    // Damp dark mold patches (corners, edges)
    const moldGrad = ctx.createRadialGradient(200, 150, 20, 200, 150, 180);
    moldGrad.addColorStop(0, 'rgba(12, 16, 10, 0.85)');
    moldGrad.addColorStop(0.6, 'rgba(18, 20, 15, 0.5)');
    moldGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = moldGrad;
    ctx.fillRect(0, 0, 600, 400);

    const moldGrad2 = ctx.createRadialGradient(800, 800, 40, 800, 800, 250);
    moldGrad2.addColorStop(0, 'rgba(8, 10, 6, 0.9)');
    moldGrad2.addColorStop(0.7, 'rgba(15, 18, 12, 0.4)');
    moldGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = moldGrad2;
    ctx.fillRect(500, 500, 524, 524);

    // Peeling wallpaper rips (exposing raw crumbling gray brick/plaster underneath)
    ctx.fillStyle = '#151412';
    ctx.beginPath();
    ctx.moveTo(350, 400);
    ctx.lineTo(440, 430);
    ctx.lineTo(470, 520);
    ctx.lineTo(410, 570);
    ctx.lineTo(330, 510);
    ctx.closePath();
    ctx.fill();

    // Dark cracks running across
    ctx.strokeStyle = '#0d0b09';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(350, 400);
    ctx.lineTo(310, 340);
    ctx.lineTo(270, 310);
    ctx.moveTo(470, 520);
    ctx.lineTo(540, 590);
    ctx.lineTo(580, 640);
    ctx.stroke();

    // Heavy noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let p = 0; p < data.length; p += 4) {
      const noise = (Math.random() - 0.5) * 28;
      data[p] = Math.max(0, Math.min(255, data[p] + noise));
      data[p + 1] = Math.max(0, Math.min(255, data[p + 1] + noise));
      data[p + 2] = Math.max(0, Math.min(255, data[p + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    this.cache.set('cracked_wall', texture);
    return texture;
  }

  /**
   * Water-damaged stained ceiling
   */
  public static createCeilingTexture(): THREE.CanvasTexture {
    if (this.cache.has('ceiling')) return this.cache.get('ceiling')!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#181715';
    ctx.fillRect(0, 0, 512, 512);

    // Large water stain ring
    const stain = ctx.createRadialGradient(256, 256, 30, 256, 256, 180);
    stain.addColorStop(0, 'rgba(38, 30, 20, 0.6)');
    stain.addColorStop(0.7, 'rgba(45, 35, 22, 0.4)');
    stain.addColorStop(0.85, 'rgba(20, 16, 10, 0.8)'); // dark dry edge ring
    stain.addColorStop(1, 'transparent');
    ctx.fillStyle = stain;
    ctx.fillRect(0, 0, 512, 512);

    // Noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let p = 0; p < data.length; p += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[p] = Math.max(0, Math.min(255, data[p] + noise));
      data[p + 1] = Math.max(0, Math.min(255, data[p + 1] + noise));
      data[p + 2] = Math.max(0, Math.min(255, data[p + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.cache.set('ceiling', texture);
    return texture;
  }

  /**
   * Dark polished antique wood for furniture (cabinet, chair, desk, door)
   */
  public static createFurnitureWoodTexture(shadeHex = '#241a12'): THREE.CanvasTexture {
    const key = `wood_${shadeHex}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = shadeHex;
    ctx.fillRect(0, 0, 512, 512);

    // Fine wood grain
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      const x = Math.random() * 512;
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() * 12 - 6), 512);
      ctx.stroke();
    }

    // Scratches & wear on edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    for (let s = 0; s < 15; s++) {
      ctx.beginPath();
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.random() * 30 - 15, sy + Math.random() * 30 - 15);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Stained dirty fabric for bed mattress, blanket, pillow & curtains
   */
  public static createFabricTexture(colorHex = '#2c2925', stainIntensity = 0.5): THREE.CanvasTexture {
    const key = `fabric_${colorHex}_${stainIntensity}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 512, 512);

    // Thread weave pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 2, 512);
    }
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 2);
    }

    // Stains
    if (stainIntensity > 0) {
      const grad = ctx.createRadialGradient(200, 200, 10, 200, 200, 120);
      grad.addColorStop(0, 'rgba(40, 25, 20, 0.7)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Grungy window glass with dirt smudges, condensation streaks
   */
  public static createWindowGlassTexture(): THREE.CanvasTexture {
    if (this.cache.has('window_glass')) return this.cache.get('window_glass')!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(30, 45, 60, 0.4)';
    ctx.fillRect(0, 0, 512, 512);

    // Grime around corners
    const grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 250);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(15, 20, 25, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Rain drop streaks
    ctx.strokeStyle = 'rgba(100, 140, 180, 0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      const x = Math.random() * 512;
      ctx.moveTo(x, 20);
      ctx.lineTo(x + (Math.random() * 10 - 5), 480);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('window_glass', texture);
    return texture;
  }

  /**
   * Antique Wall Portraits (Horror artwork)
   */
  public static createVintagePaintingTexture(portraitIndex = 0): THREE.CanvasTexture {
    const key = `painting_${portraitIndex}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Aged canvas background
    ctx.fillStyle = '#1c1813';
    ctx.fillRect(0, 0, 512, 512);

    if (portraitIndex === 0) {
      // 19th Century Victorian Lady Portrait (Eerie silhouette with pale face and hollow dark eyes)
      // Background vignette
      const bgGrad = ctx.createRadialGradient(256, 200, 40, 256, 200, 220);
      bgGrad.addColorStop(0, '#362f26');
      bgGrad.addColorStop(1, '#0e0b08');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Dark Victorian Dress & Shoulders
      ctx.fillStyle = '#080706';
      ctx.beginPath();
      ctx.moveTo(140, 512);
      ctx.bezierCurveTo(170, 360, 200, 330, 256, 330);
      ctx.bezierCurveTo(312, 330, 342, 360, 372, 512);
      ctx.closePath();
      ctx.fill();

      // High Lace Collar
      ctx.fillStyle = '#8f887b';
      ctx.beginPath();
      ctx.moveTo(220, 340);
      ctx.lineTo(256, 310);
      ctx.lineTo(292, 340);
      ctx.closePath();
      ctx.fill();

      // Pale Face
      ctx.fillStyle = '#cfc6b6';
      ctx.beginPath();
      ctx.ellipse(256, 240, 50, 68, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark braided hair
      ctx.fillStyle = '#0a0807';
      ctx.beginPath();
      ctx.ellipse(256, 200, 62, 55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cfc6b6';
      ctx.beginPath();
      ctx.ellipse(256, 245, 46, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hollow, shadowed sunken eyes
      ctx.fillStyle = '#221a15';
      ctx.beginPath();
      ctx.ellipse(238, 235, 9, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(274, 235, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Black pinpoint pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(238, 235, 3.5, 0, Math.PI * 2);
      ctx.arc(274, 235, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Subtle melancholy / unnerving mouth
      ctx.strokeStyle = '#3a2b25';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(244, 275);
      ctx.bezierCurveTo(250, 274, 262, 274, 268, 275);
      ctx.stroke();

    } else if (portraitIndex === 1) {
      // Eerie Abandoned House & Dead Trees Landscape
      ctx.fillStyle = '#10151c';
      ctx.fillRect(0, 0, 512, 512);

      // Pale blood-tinted moon
      const moonGrad = ctx.createRadialGradient(380, 120, 10, 380, 120, 60);
      moonGrad.addColorStop(0, '#eae6d0');
      moonGrad.addColorStop(0.5, '#857568');
      moonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(300, 40, 160, 160);

      // Fog layer
      ctx.fillStyle = 'rgba(40, 48, 55, 0.6)';
      ctx.fillRect(0, 280, 512, 232);

      // Dead gnarled tree branches
      ctx.strokeStyle = '#050608';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(120, 512);
      ctx.lineTo(130, 280);
      ctx.lineTo(80, 190);
      ctx.moveTo(130, 280);
      ctx.lineTo(180, 170);
      ctx.stroke();

      // Silhouette of crooked house
      ctx.fillStyle = '#050608';
      ctx.beginPath();
      ctx.moveTo(240, 400);
      ctx.lineTo(240, 280);
      ctx.lineTo(310, 210);
      ctx.lineTo(380, 280);
      ctx.lineTo(380, 400);
      ctx.closePath();
      ctx.fill();

    } else {
      // Ominous Family Portrait (Three figures with blurred/scratched faces)
      ctx.fillStyle = '#14120e';
      ctx.fillRect(0, 0, 512, 512);

      // Father, Mother, Child silhouettes
      const drawFigure = (cx: number, cy: number, w: number, h: number) => {
        ctx.fillStyle = '#080705';
        ctx.fillRect(cx - w / 2, cy, w, h);
        ctx.fillStyle = '#a89d8d';
        ctx.beginPath();
        ctx.arc(cx, cy - 20, w * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Scratched out faces
        ctx.strokeStyle = '#380c0c';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(cx - 15, cy - 35 + i * 7);
          ctx.lineTo(cx + 15, cy - 25 + i * 7);
          ctx.stroke();
        }
      };

      drawFigure(180, 260, 60, 200); // Father
      drawFigure(330, 270, 55, 190); // Mother
      drawFigure(255, 340, 40, 140); // Child
    }

    // Heavy cracked lacquer effect over painting
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    for (let c = 0; c < 20; c++) {
      ctx.beginPath();
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.random() * 80 - 40, cy + Math.random() * 80 - 40);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Tattered Persian-style area rug for center of room
   */
  public static createRugTexture(): THREE.CanvasTexture {
    if (this.cache.has('rug')) return this.cache.get('rug')!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Faded deep crimson base
    ctx.fillStyle = '#3a1818';
    ctx.fillRect(0, 0, 512, 512);

    // Ornate floral borders
    ctx.strokeStyle = '#5a3d24';
    ctx.lineWidth = 16;
    ctx.strokeRect(24, 24, 464, 464);

    ctx.strokeStyle = '#2b1212';
    ctx.lineWidth = 8;
    ctx.strokeRect(48, 48, 416, 416);

    // Center medallion
    ctx.fillStyle = '#4a2c1d';
    ctx.beginPath();
    ctx.arc(256, 256, 80, 0, Math.PI * 2);
    ctx.fill();

    // Dark dirt & frayed corners
    const dirt = ctx.createRadialGradient(256, 256, 100, 256, 256, 260);
    dirt.addColorStop(0, 'transparent');
    dirt.addColorStop(1, 'rgba(10, 8, 6, 0.75)');
    ctx.fillStyle = dirt;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set('rug', texture);
    return texture;
  }

  /**
   * Handwritten note / diary page texture
   */
  public static createPaperTexture(title = "DIARY ENTRY"): THREE.CanvasTexture {
    const key = `paper_${title}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Aged yellow parchment
    ctx.fillStyle = '#c8b693';
    ctx.fillRect(0, 0, 512, 512);

    // Burnt edges
    const grad = ctx.createRadialGradient(256, 256, 160, 256, 256, 255);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(50, 30, 15, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Faded handwriting lines
    ctx.strokeStyle = '#32251a';
    ctx.lineWidth = 2;
    for (let y = 80; y < 460; y += 32) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      let cx = 60;
      while (cx < 440) {
        const step = 20 + Math.random() * 20;
        ctx.lineTo(cx + step, y + (Math.random() * 4 - 2));
        cx += step;
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }
}
