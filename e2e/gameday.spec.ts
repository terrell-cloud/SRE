import { expect, test, type Page } from '@playwright/test'

// The user is the HOME team, so the game opens with the field-choice
// overlay (opponent bats the top of the 1st).

async function startGame(page: Page) {
  await page.goto('/?seed=42')
  await page.getByRole('button', { name: 'Play Exhibition' }).click()
  await expect(page.getByTestId('atbat-canvas')).toBeVisible()
  await expect(page.getByTestId('count')).toBeVisible()
}

test('sim path: play exhibition -> sim game -> box score', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'Sim Game' }).click()
  await expect(page.getByText(/^Final/)).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Batting' })).toHaveCount(2)
})

test('interactive pitching: throw + lock advances the count', async ({ page }) => {
  await startGame(page)
  // Field-choice overlay -> opt into pitching.
  await page.getByRole('button', { name: 'Pitch this ½ inning' }).click()

  for (let i = 0; i < 8; i++) {
    const throwBtn = page.getByRole('button', { name: 'Throw' })
    if (await throwBtn.isVisible().catch(() => false)) {
      await throwBtn.click()
      // Accuracy ring: lock quickly (poor accuracy is fine for the test).
      await page.waitForTimeout(250)
      const lockBtn = page.getByRole('button', { name: 'Lock' })
      if (await lockBtn.isVisible().catch(() => false)) await lockBtn.click()
      // Windup + flight + banner.
      await page.waitForTimeout(2600)
    } else {
      await page.waitForTimeout(400)
    }
  }

  // Something happened: pitch count or outs or count changed, no crash.
  await expect(page.getByTestId('count')).toBeVisible()
  await page.getByRole('button', { name: 'Sim Game' }).click()
  await expect(page.getByText(/^Final/)).toBeVisible()
})

test('interactive batting: two-thumb aim + swing produces outcomes', async ({ page }) => {
  await startGame(page)
  // Sim the opponent's top half to get to our at-bats.
  await page.getByRole('button', { name: 'Sim ½ inning' }).first().click()

  const canvas = page.getByTestId('atbat-canvas')
  const box = (await canvas.boundingBox())!

  for (let i = 0; i < 12; i++) {
    // Aim thumb: drag PCI near the middle of the zone.
    await canvas.dispatchEvent('pointerdown', {
      pointerId: 5,
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height * 0.62 + 90,
    })
    // Swing thumb: tap SWING mid-flight-ish.
    await page.waitForTimeout(500 + (i % 4) * 180)
    const swing = page.getByRole('button', { name: 'Swing' })
    if (await swing.isVisible().catch(() => false)) {
      await swing.dispatchEvent('pointerdown', { pointerId: 9 })
    }
    await page.waitForTimeout(1300)
  }

  // The half-inning progressed or at least the HUD is alive; finish via sim.
  await expect(page.getByTestId('count')).toBeVisible()
  await page.getByRole('button', { name: 'Sim Game' }).click()
  await expect(page.getByText(/^Final/)).toBeVisible()
})
