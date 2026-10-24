export class ScreenManager {
  public static showScreen(screenId: string): void {
    document.querySelectorAll('.screen-view').forEach((el) => {
      el.classList.toggle('active', el.id === screenId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
