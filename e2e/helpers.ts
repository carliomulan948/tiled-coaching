import { expect, Page } from '@playwright/test';

export async function login(page: Page, role: 'Client' | 'Coach' | 'Administrateur') {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(`^${role}`) }).click();
  await page.waitForURL('**/dashboard');
}

export async function logout(page: Page) {
  const menu = page.getByRole('button', { name: 'Ouvrir le menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await page.waitForURL(url => url.pathname === '/');
}

// Ouvre le tiroir de menu sur mobile ; sans effet sur ordinateur où le menu est toujours visible.
export async function openMenu(page: Page) {
  const menu = page.getByRole('button', { name: 'Ouvrir le menu' });
  if (await menu.isVisible()) await menu.click();
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeInViewport();
}

export function countdownSeconds(text: string | null): number {
  const [m, s] = (text ?? '0:00').split(':').map(Number);
  return m * 60 + s;
}

// Valide toutes les séries restantes en sautant les temps de repos.
export async function completeRemainingSets(page: Page) {
  const bilan = page.getByRole('heading', { name: 'Bilan de la séance' });
  for (let i = 0; i < 40; i++) {
    if (await bilan.isVisible()) return;
    await page.getByRole('button', { name: 'Série faite' }).click();
    await expect(page.getByRole('heading', { name: /Récupération|Bilan de la séance/ })).toBeVisible();
    const skip = page.getByRole('button', { name: 'Passer le repos' });
    if (await skip.isVisible()) {
      await skip.click();
      await expect(page.getByTestId('set-label').or(bilan)).toBeVisible();
    }
  }
  throw new Error('La séance ne s’est pas terminée');
}

// Éléments qui débordent horizontalement : soit de l'écran, soit du bloc qui les contient
// (hors zones à défilement volontaire, éléments positionnés et tiroir de menu).
export async function horizontalOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: string[] = [];
    const scrolls = (el: Element) => ['auto', 'scroll', 'hidden'].includes(getComputedStyle(el).overflowX);
    const insideScroller = (el: Element) => {
      for (let p = el.parentElement; p && p.tagName !== 'MAIN' && p !== document.body; p = p.parentElement) {
        if (scrolls(p)) return true;
      }
      return false;
    };
    const describe = (el: Element, r: DOMRect, limit: number) =>
      `${el.tagName.toLowerCase()} « ${(el.textContent ?? '').trim().slice(0, 40)} » ${Math.round(r.left)}→${Math.round(r.right)} (limite ${Math.round(limit)})`;
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('aside')) return;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden') return;
      if (style.position === 'absolute' || style.position === 'fixed') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || insideScroller(el)) return;
      if (r.right > vw + 1 || r.left < -1) {
        offenders.push(describe(el, r, vw));
        return;
      }
      const parent = el.parentElement;
      if (!parent || parent === document.body || scrolls(parent)) return;
      if (parseFloat(style.marginLeft) < 0 || parseFloat(style.marginRight) < 0) return;
      const pr = parent.getBoundingClientRect();
      if (r.right > pr.right + 1) offenders.push(describe(el, r, pr.right));
    });
    return offenders.slice(0, 8);
  });
}
