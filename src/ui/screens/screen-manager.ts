export class ScreenManager {
  public static showScreen(screenId: string): void {
    document.querySelectorAll('.screen-view').forEach((el) => {
      el.classList.toggle('active', el.id === screenId);
    });

    const inBoard = screenId === 'boardScreen';
    const btnBack = document.getElementById('btnBackLobby');
    if (btnBack) btnBack.style.display = inBoard ? 'inline-block' : 'none';

    const navInfo = document.getElementById('navMatchInfo');
    if (navInfo) navInfo.style.display = inBoard ? 'flex' : 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
