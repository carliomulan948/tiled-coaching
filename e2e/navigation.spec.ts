import { expect, test } from '@playwright/test';
import { horizontalOverflow, login, openMenu } from './helpers';

test.describe('navigation entre Squatty Pro et Squatty Quest', () => {
  test('le tableau de bord mène à Quest et le menu contient les deux espaces', async ({ page }) => {
    await login(page, 'Client');
    const card = page.getByTestId('quest-dashboard-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Squatty Quest');

    await card.getByRole('link', { name: /Ouvrir l’aventure/ }).click();
    await expect(page).toHaveURL(/\/quest$/);
    await expect(page.getByRole('heading', { name: 'Squatty Quest', level: 1 })).toBeVisible();

    await openMenu(page);
    const nav = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(nav.getByText('Squatty Pro')).toBeVisible();
    await expect(nav.getByText('Squatty Quest')).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Programmes' })).toBeVisible();
    await nav.getByRole('link', { name: 'Carnet' }).click();
    await expect(page).toHaveURL(/\/quest\/carnet$/);
    await expect(page.getByRole('heading', { name: 'Carnet' })).toBeVisible();
  });

  test('choisir un parcours le propose ensuite comme prochaine étape', async ({ page }) => {
    await login(page, 'Client');
    await page.goto('/quest');
    await page.getByRole('link', { name: /Parcours Haltères/ }).first().click();
    await expect(page).toHaveURL(/\/quest\/parcours\/halteres$/);
    await page.getByRole('button', { name: 'Choisir ce parcours' }).click();
    await expect(page.getByRole('button', { name: 'Parcours actif' })).toBeVisible();

    await page.getByRole('main').getByRole('link', { name: 'Aventure', exact: true }).first().click();
    await expect(page.getByText('Le chemin des forges')).toBeVisible();
    await page.getByRole('link', { name: 'Lancer la séance' }).click();
    await expect(page).toHaveURL(/\/quest\/seance\/halteres-s1-a$/);

    await page.goto('/dashboard');
    await expect(page.getByTestId('quest-dashboard-card')).toContainText('Le chemin des forges');
  });

  test('les pages Programmes, Exercices, Messages et Boutique affichent le menu', async ({ page, isMobile }) => {
    await login(page, 'Coach');
    for (const path of ['/programmes', '/exercices', '/messages', '/boutique']) {
      await page.goto(path);
      await openMenu(page);
      const nav = page.getByRole('navigation', { name: 'Navigation principale' });
      await expect(nav.getByRole('link', { name: 'Aventure', exact: true })).toBeInViewport();
      await page.keyboard.press('Escape');
      if (isMobile) await expect(nav).not.toBeInViewport();
    }
  });

  test('une fiche d’exercice s’ouvre depuis une séance', async ({ page }) => {
    await login(page, 'Client');
    await page.goto('/quest/seance/maison-s1-a');
    await page.getByRole('button', { name: 'Fiche : Squat poids du corps' }).click();
    const dialog = page.getByRole('dialog', { name: 'Fiche d’exercice' });
    await expect(dialog.getByText('Consignes')).toBeVisible();
    await expect(dialog.getByText('Erreurs fréquentes')).toBeVisible();
    await expect(dialog.getByText('Plus facile')).toBeVisible();
    await dialog.getByRole('link', { name: /Ouvrir la fiche complète/ }).click();
    await expect(page).toHaveURL(/\/quest\/exercices\/bw-08$/);
    await expect(page.getByRole('heading', { name: 'Squat poids du corps' })).toBeVisible();
  });
});

test.describe('affichage mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'contrôle réservé au format téléphone');

  test('les pages Quest et le tableau de bord ne débordent pas', async ({ page }) => {
    await login(page, 'Client');
    // Une séance partielle dans le carnet pour afficher aussi l'historique et la « dernière séance ».
    await page.goto('/quest/carnet');
    await page.getByRole('button', { name: 'Noter une séance' }).click();
    await page.getByRole('button', { name: 'Squat poids du corps série 1' }).click();
    await page.getByRole('button', { name: 'Enregistrer dans le carnet' }).click();
    await expect(page.getByTestId('carnet-entry')).toHaveCount(1);
    for (const path of ['/dashboard', '/quest', '/quest/parcours/maison', '/quest/seance/maison-s1-a', '/quest/carnet', '/quest/exercices/bw-08']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await horizontalOverflow(page), path).toEqual([]);
    }
  });

  test('séance guidée et repos ne débordent pas', async ({ page }) => {
    await login(page, 'Client');
    await page.goto('/quest/seance/maison-s1-a');
    await page.getByRole('button', { name: 'Commencer la séance' }).click();
    expect(await horizontalOverflow(page)).toEqual([]);
    await page.getByRole('button', { name: 'Série faite' }).click();
    await expect(page.getByRole('heading', { name: 'Récupération' })).toBeVisible();
    expect(await horizontalOverflow(page)).toEqual([]);
  });

  test('relevé informatif des débordements sur les pages Squatty Pro existantes', async ({ page }) => {
    await login(page, 'Coach');
    const report: string[] = [];
    for (const path of ['/clients', '/invoices', '/schedule', '/payments', '/progress', '/programmes', '/exercices', '/messages', '/boutique']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const offenders = await horizontalOverflow(page);
      if (offenders.length) report.push(`${path} : ${offenders.length} élément(s), ex. ${offenders[0]}`);
    }
    test.info().annotations.push({ type: 'débordements Squatty Pro', description: report.join('\n') || 'aucun' });
    console.log(report.length ? report.join('\n') : 'Aucun débordement détecté sur les pages Squatty Pro.');
  });
});
