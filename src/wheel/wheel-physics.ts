import { WHEEL_SLICES } from '../types/category.types';

export class WheelPhysics {
  public static readonly POINTER_ANGLE = -Math.PI / 2;

  /**
   * Determina qué casilla de WHEEL_SLICES está situada bajo la aguja superior (-PI/2)
   */
  public static getSliceIndexAtPointer(angle: number): number {
    const numSlices = WHEEL_SLICES.length;
    const arc = (Math.PI * 2) / numSlices;
    let relativeAngle = (this.POINTER_ANGLE - angle) % (Math.PI * 2);
    if (relativeAngle < 0) relativeAngle += Math.PI * 2;
    return Math.floor(relativeAngle / arc) % numSlices;
  }

  /**
   * Calcula el ángulo exacto necesario para que targetSliceIdx quede bajo la aguja
   */
  public static calculateSpinDelta(
    currentAngle: number,
    targetSliceIdx: number,
    isAutoRespin: boolean = false
  ): { totalRotation: number; duration: number } {
    const numSlices = WHEEL_SLICES.length;
    const arc = (Math.PI * 2) / numSlices;

    const randomOffsetInsideSlice = (Math.random() * 0.56 + 0.22) * arc;
    const desiredFinalAngleMod =
      (this.POINTER_ANGLE - (targetSliceIdx * arc + randomOffsetInsideSlice) + Math.PI * 4) % (Math.PI * 2);

    const currentMod = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let deltaAngle = desiredFinalAngleMod - currentMod;
    if (deltaAngle <= 0) deltaAngle += Math.PI * 2;

    const fullRotations = (isAutoRespin ? 4 : 5 + Math.floor(Math.random() * 2)) * (Math.PI * 2);
    const totalRotation = fullRotations + deltaAngle;
    const duration = isAutoRespin ? 2400 : 3200;

    return { totalRotation, duration };
  }

  /**
   * Función de aceleración/desaceleración suave estilo física de frenado (easeOutQuart)
   */
  public static easeOutQuart(progress: number): number {
    return 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 4);
  }
}
