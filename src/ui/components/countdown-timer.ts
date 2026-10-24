export class CountdownTimer {
  private intervalId: number | null = null;

  public start(
    container: HTMLElement,
    seconds: number = 5,
    onTick?: (remaining: number) => void,
    onComplete?: () => void
  ): void {
    this.stop(container);

    let remaining = seconds;
    let box = container.querySelector<HTMLElement>('#turnCountdownBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'turnCountdownBox';
      box.className = 'turn-countdown-box';
      container.appendChild(box);
    }

    const render = () => {
      const pct = (remaining / seconds) * 100;
      if (box) {
        box.innerHTML = `
          <div class="turn-countdown-text">
            <span>⏱️ Esta tarjeta se cerrará en <strong id="countdownSecVal">${remaining}s</strong>...</span>
          </div>
          <div class="turn-countdown-bar-wrap">
            <div class="turn-countdown-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
      }
      if (onTick) onTick(remaining);
    };

    render();

    this.intervalId = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        render();
      } else {
        this.stop(container);
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  public stop(container?: HTMLElement | null): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (container) {
      const box = container.querySelector('#turnCountdownBox');
      if (box) box.remove();
    } else {
      const box = document.getElementById('turnCountdownBox');
      if (box) box.remove();
    }
  }
}

export const countdownTimer = new CountdownTimer();
