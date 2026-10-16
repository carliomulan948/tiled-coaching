import { expect, Page, test } from '@playwright/test';
import { completeRemainingSets, countdownSeconds, login } from './helpers';

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
});

async function startSession(page: Page, sessionId: string) {
  await page.goto(`/quest/seance/${sessionId}`);
  await page.getByRole('button', { name: 'Commencer la séance' }).click();
  await expect(page.getByTestId('set-label')).toBeVisible();
}

test('minuteur de récupération : décompte, ajout de temps, pause et saut', async ({ page }) => {
  await login(page, 'Client');
  await startSession(page, 'maison-s1-a');
  await expect(page.getByTestId('set-label')).toContainText('Série 1 sur 2');

  await page.getByRole('button', { name: 'Série faite' }).click();
  await expect(page.getByRole('heading', { name: 'Récupération' })).toBeVisible();
  const value = page.getByTestId('countdown-value');
  await expect(value).toHaveText('1:00');
  await expect.poll(async () => countdownSeconds(await value.textContent()), { timeout: 4000 }).toBeLessThan(60);

  const before = countdownSeconds(await value.textContent());
  await page.getByRole('button', { name: 'Ajouter 15 secondes' }).click();
  expect(countdownSeconds(await value.textContent())).toBeGreaterThanOrEqual(before + 13);

  await page.getByRole('button', { name: 'Mettre en pause' }).click();
  const paused = await value.textContent();
  await page.waitForTimeout(1500);
  await expect(value).toHaveText(paused ?? '');

  await page.getByRole('button', { name: 'Passer le repos' }).click();
  await expect(page.getByTestId('set-label')).toContainText('Série 2 sur 2');
  await expect(page.getByTestId('sets-progress')).toHaveText('1/10 séries');
});

test('chrono d’effort pour un exercice minuté', async ({ page }) => {
  await login(page, 'Client');
  await startSession(page, 'maison-s1-a');
  await page.getByRole('button', { name: /^5\. Planche avant/ }).click();
  await expect(page.getByTestId('set-label')).toContainText('20 s');
  await page.getByRole('button', { name: /Lancer le chrono/ }).click();
  const value = page.getByTestId('countdown-value');
  await expect(value).toHaveText('0:20');
  await expect.poll(async () => countdownSeconds(await value.textContent()), { timeout: 4000 }).toBeLessThan(20);
  await page.getByRole('button', { name: 'Arrêter et valider la série' }).click();
  await expect(page.getByRole('heading', { name: 'Récupération' })).toBeVisible();
  await expect(page.getByTestId('sets-progress')).toHaveText('1/10 séries');
});

test('séance partielle : enregistrement unique malgré un double clic, résumé au tableau de bord, puis reprise', async ({ page }) => {
  await login(page, 'Client');
  await startSession(page, 'maison-s1-a');
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Série faite' }).click();
    await page.getByRole('button', { name: 'Passer le repos' }).click();
  }
  await expect(page.getByTestId('sets-progress')).toHaveText('2/10 séries');
  await page.getByRole('button', { name: 'Terminer la séance' }).click();
  await expect(page.getByRole('heading', { name: 'Bilan de la séance' })).toBeVisible();
  await expect(page.getByText('Séance partielle : elle sera notée comme telle')).toBeVisible();

  // Deux clics dans le même instant, avant que l'écran ne change.
  await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(page.getByRole('heading', { name: 'Séance partielle enregistrée' })).toBeVisible();
  await expect(page.getByText('+20 XP')).toBeVisible();

  await page.getByRole('main').getByRole('link', { name: 'Tableau de bord' }).click();
  const card = page.getByTestId('quest-dashboard-card');
  await expect(card).toContainText(/Cette semaine\s*1\s*dont 1 partielle/);
  await expect(card).toContainText(/Partielles\s*1/);
  await expect(card).toContainText('Dernière : La vallée des squats');

  await page.goto('/quest/carnet');
  await expect(page.getByTestId('carnet-entry')).toHaveCount(1);
  await expect(page.getByTestId('carnet-entry')).toContainText('2/10 séries');

  // Reprise : la même entrée est complétée, pas dupliquée.
  await page.getByRole('link', { name: 'Reprendre' }).click();
  await expect(page.getByText(/Reprise de la séance du .* 2\/10 séries déjà faites/)).toBeVisible();
  await page.getByRole('button', { name: 'Reprendre la séance' }).click();
  await expect(page.getByTestId('sets-progress')).toHaveText('2/10 séries');
  await expect(page.getByTestId('set-label')).toContainText('Série 1 sur 2');
  await completeRemainingSets(page);
  await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).click();
  await expect(page.getByRole('heading', { name: 'Séance complète !' })).toBeVisible();
  await expect(page.getByText('Retour gagnant')).toBeVisible();

  await page.getByRole('link', { name: 'Voir le carnet' }).click();
  await expect(page.getByTestId('carnet-entry')).toHaveCount(1);
  await expect(page.getByTestId('carnet-entry')).toContainText('10/10 séries');
  await expect(page.getByTestId('carnet-entry')).toContainText('Complète');
  await expect(page.getByRole('link', { name: 'Reprendre' })).toHaveCount(0);
});

test('séance en cours conservée après un rechargement de page', async ({ page }) => {
  await login(page, 'Client');
  await startSession(page, 'maison-s1-b');
  await page.getByRole('button', { name: 'Série faite' }).click();
  await page.reload();
  await expect(page.getByText(/Une tentative de cette séance est en cours : 1\/10 séries cochées/)).toBeVisible();
  await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
  await expect(page.getByTestId('sets-progress')).toHaveText('1/10 séries');
  await expect(page.getByTestId('set-label')).toContainText('Série 2 sur 2');

  await page.goto('/quest');
  await expect(page.getByText('Séance en cours : Le fort du gainage')).toBeVisible();
});

test('même séance le même jour : conflit, annulation, remplacement puis ajout', async ({ page }) => {
  await login(page, 'Client');
  const doOneSetAndFinish = async () => {
    await startSession(page, 'maison-s1-c');
    await page.getByRole('button', { name: 'Série faite' }).click();
    await page.getByRole('button', { name: 'Terminer la séance ici' }).click();
    await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).click();
  };

  await doOneSetAndFinish();
  await expect(page.getByRole('heading', { name: 'Séance partielle enregistrée' })).toBeVisible();

  await doOneSetAndFinish();
  const dialog = page.getByRole('dialog', { name: 'Séance déjà notée aujourd’hui' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Annuler' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).click();
  await dialog.getByRole('button', { name: /Remplacer/ }).click();
  await expect(page.getByRole('heading', { name: 'Séance partielle enregistrée' })).toBeVisible();
  await page.goto('/quest/carnet');
  await expect(page.getByTestId('carnet-entry')).toHaveCount(1);

  await doOneSetAndFinish();
  await dialog.getByRole('button', { name: /Garder les deux/ }).click();
  await expect(page.getByRole('heading', { name: 'Séance partielle enregistrée' })).toBeVisible();
  await page.goto('/quest/carnet');
  await expect(page.getByTestId('carnet-entry')).toHaveCount(2);
});

test('réglage Sobre et signalement de douleur sans humour', async ({ page }) => {
  await login(page, 'Client');
  await page.goto('/quest');
  await expect(page.getByRole('radio', { name: /^Squatty/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: /^Sobre/ }).click();
  await expect(page.getByRole('radio', { name: /^Sobre/ })).toHaveAttribute('aria-checked', 'true');

  await page.goto('/quest/seance/maison-s1-a');
  await expect(page.getByText(/^(Début de la séance\.|Séance lancée\. Commence par l’échauffement\.)$/)).toBeVisible();
  await page.getByRole('button', { name: 'Commencer la séance' }).click();
  await page.getByRole('button', { name: 'Série faite' }).click();
  await expect(page.getByText(/^(Série enregistrée\.|Série terminée\.)$/)).toBeVisible();
  await page.getByRole('button', { name: 'Passer le repos' }).click();

  await page.getByRole('button', { name: 'Douleur ?' }).click();
  const alert = page.getByRole('alertdialog', { name: 'Douleur signalée' });
  await expect(alert).toContainText('Arrête l’exercice en cours');
  await expect(alert).toContainText('15 ou le 112');
  await expect(alert).not.toContainText(/pistache|pet|prout/i);
  await alert.getByRole('button', { name: 'Noter la douleur et terminer la séance' }).click();
  await expect(page.getByRole('heading', { name: 'Bilan de la séance' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /douleur pendant la séance/ })).toBeChecked();
  await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).click();
  await page.goto('/quest/carnet');
  await expect(page.getByTestId('carnet-entry')).toContainText('Douleur signalée');
});
