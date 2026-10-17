import { expect, test } from '@playwright/test';
import { login } from './helpers';

test('le panier fermé est masqué au clavier et aux lecteurs d’écran, puis s’ouvre et se referme', async ({ page }) => {
  await login(page, 'Client');
  await page.goto('/boutique');
  const cart = page.getByRole('dialog', { name: 'Panier' });
  await expect(cart).toBeHidden();
  await expect(page.getByText('Votre panier est vide')).toBeHidden();

  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const inCart = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"][aria-label="Panier"]')));
    expect(inCart).toBe(false);
  }

  await page.getByRole('button', { name: 'Panier', exact: true }).click();
  await expect(cart).toBeInViewport();
  await expect(cart.getByText('Votre panier est vide')).toBeVisible();

  await cart.getByRole('button').first().click();
  await expect(cart).toBeHidden();
});
