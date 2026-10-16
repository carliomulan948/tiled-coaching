import { expect, Page, test } from '@playwright/test';
import { login, logout } from './helpers';

async function noteFullSession(page: Page, trackName?: string) {
  await page.goto('/quest/carnet');
  await page.getByRole('button', { name: 'Noter une séance' }).click();
  if (trackName) await page.getByLabel('Parcours').selectOption({ label: trackName });
  await page.getByRole('button', { name: 'Tout cocher' }).click();
  await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).click();
  await expect(page.getByRole('heading', { name: 'Noter une séance faite' })).toBeHidden();
}

test('historique et préférences séparés entre deux profils', async ({ page }) => {
  // Profil client : une séance Maison et le ton Sobre.
  await login(page, 'Client');
  await noteFullSession(page);
  await expect(page.getByTestId('carnet-entry')).toHaveCount(1);
  await expect(page.getByTestId('carnet-entry')).toContainText('Parcours Maison');
  await page.goto('/quest');
  await page.getByRole('radio', { name: /^Sobre/ }).click();
  await logout(page);

  // Profil coach : carnet vide, ton par défaut, puis une séance Salle.
  await login(page, 'Coach');
  await expect(page.getByTestId('quest-dashboard-card')).toContainText(/Complètes\s*0/);
  await page.goto('/quest/carnet');
  await expect(page.getByTestId('carnet-entry')).toHaveCount(0);
  await page.goto('/quest');
  await expect(page.getByRole('radio', { name: /^Squatty/ })).toHaveAttribute('aria-checked', 'true');
  await noteFullSession(page, 'Parcours Salle');
  await expect(page.getByTestId('carnet-entry')).toHaveCount(1);
  await expect(page.getByTestId('carnet-entry')).toContainText('Parcours Salle');
  await page.goto('/dashboard');
  await expect(page.getByTestId('quest-dashboard-card')).toContainText(/Complètes\s*1/);
  await logout(page);

  // Retour au client : uniquement sa propre séance, son réglage conservé.
  await login(page, 'Client');
  await page.goto('/quest/carnet');
  await expect(page.getByTestId('carnet-entry')).toHaveCount(1);
  await expect(page.getByTestId('carnet-entry')).toContainText('Parcours Maison');
  await page.goto('/quest');
  await expect(page.getByRole('radio', { name: /^Sobre/ })).toHaveAttribute('aria-checked', 'true');
});

test('saisie manuelle d’une séance partielle dans le carnet', async ({ page }) => {
  await login(page, 'Client');
  await page.goto('/quest/carnet');
  await page.getByRole('button', { name: 'Noter une séance' }).click();
  await page.getByRole('button', { name: 'Squat poids du corps série 1' }).click();
  await page.getByRole('button', { name: 'Pont fessier série 1' }).click();
  await expect(page.getByText('Elle sera notée comme séance partielle.')).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).click();
  const entry = page.getByTestId('carnet-entry');
  await expect(entry).toContainText('2/10 séries');
  await expect(entry).toContainText('Partielle');
  await expect(entry).toContainText('saisie manuelle');
  await page.getByRole('button', { name: /Partielles/ }).click();
  await expect(entry).toHaveCount(1);
  await page.getByRole('button', { name: /Complètes/ }).click();
  await expect(entry).toHaveCount(0);
});
