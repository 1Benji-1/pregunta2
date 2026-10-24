import { WHEEL_SLICES } from '../types/category.types';

export class WheelRenderer {
  private loadedImages: Record<string, HTMLImageElement> = {};

  public async preloadImages(): Promise<void> {
    if (typeof Image === 'undefined') return;
    const urls = new Set<string>();
    WHEEL_SLICES.forEach((s) => urls.add(s.art));

    const promises = Array.from(urls).map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.loadedImages[src] = img;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        })
    );

    await Promise.all(promises);
  }

  public draw(canvas: HTMLCanvasElement | null, wheelAngle: number): void {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const outerRadius = w / 2 - 8;
    const rimRadius = outerRadius - 14;
    const numSlices = WHEEL_SLICES.length;
    const arc = (Math.PI * 2) / numSlices;

    ctx.clearRect(0, 0, w, h);

    // Aro exterior blanco estilo Preguntados
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#dce4f0';
    ctx.stroke();
    ctx.restore();

    // Dibujar las 7 secciones radiales
    for (let i = 0; i < numSlices; i++) {
      const slice = WHEEL_SLICES[i];
      const startAngle = wheelAngle + i * arc;
      const endAngle = startAngle + arc;
      const midAngle = startAngle + arc / 2;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rimRadius, startAngle, endAngle);
      ctx.closePath();

      // Gradiente radial para dar profundidad 3D
      const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, rimRadius);
      grad.addColorStop(0, slice.lightColor || '#ffffff');
      grad.addColorStop(0.35, slice.color);
      grad.addColorStop(1, slice.darkColor);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();

      // Dibujar icono o personaje
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      const imgRadius = rimRadius * 0.62;
      const img = this.loadedImages[slice.art];
      if (img && img.complete) {
        const sz = slice.isCrown ? 58 : 50;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(img, imgRadius - sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      }

      // Nombre de la categoría
      ctx.font = "800 12px 'Fredoka', 'Nunito', sans-serif";
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillText(slice.shortName, rimRadius * 0.9, 0);

      ctx.restore();
    }

    // Dibujar clavijas perimetrales
    const numPins = numSlices * 4;
    const pinRadius = outerRadius - 7;
    for (let p = 0; p < numPins; p++) {
      const pAngle = wheelAngle + (p * (Math.PI * 2)) / numPins;
      const px = cx + Math.cos(pAngle) * pinRadius;
      const py = cy + Math.sin(pAngle) * pinRadius;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = p % 2 === 0 ? '#ffd54f' : '#cbd5e1';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#475569';
      ctx.stroke();
      ctx.restore();
    }
  }
}

export const wheelRenderer = new WheelRenderer();
