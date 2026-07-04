import { expect, test } from '@playwright/test'

test('boots, sims an exhibition, and renders a box score', async ({ page }) => {
  // Fixed seed -> deterministic teams and result.
  await page.goto('/?seed=42')

  await expect(page.getByRole('heading', { name: /Campus Ball/i })).toBeVisible()

  await page.getByRole('button', { name: 'Quick Sim' }).click()

  // Final banner + line score render.
  await expect(page.getByText(/^Final/)).toBeVisible()
  await expect(page.getByRole('table').first()).toBeVisible()

  // Both batting box scores render with real content.
  const battingHeaders = page.getByRole('columnheader', { name: 'Batting' })
  await expect(battingHeaders).toHaveCount(2)
  const pitchingHeaders = page.getByRole('columnheader', { name: 'Pitching' })
  await expect(pitchingHeaders).toHaveCount(2)

  // Play again resims without error.
  await page.getByRole('button', { name: 'Play Again' }).click()
  await expect(page.getByText(/^Final/)).toBeVisible()

  // And we can navigate home.
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Play Exhibition' })).toBeVisible()
})
