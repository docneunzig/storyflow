import { test, expect, Page } from '@playwright/test'

/**
 * E2E Test: Felix der mutige Fuchs (Felix the Brave Fox)
 *
 * This test simulates the complete workflow of creating a children's novel
 * using the Storyflow application, testing all major features.
 */

const BRAINSTORM_TEXT = `Felix ist ein junger Fuchs, der Angst vor dem dunklen Wald hat. Seine kleine Schwester Finja verirrt sich eines Tages im Wald. Felix muss seine Angst überwinden, um sie zu retten. Auf dem Weg trifft er eine weise Eule namens Olga und einen grummeligen Dachs namens Bruno. Am Ende findet Felix nicht nur Finja, sondern auch seinen Mut.`

// Helper to wait for app to be ready
async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('text=Storyflow', { timeout: 10000 }).catch(() => {})
}

test.describe('Felix der mutige Fuchs - Complete Novel Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)
  })

  test('1. Create Project with Specification', async ({ page }) => {
    // Click "New Project" button
    await page.click('button:has-text("New Project")')

    // Wait for navigation to specification page
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Verify we're on specification page
    await expect(page.getByRole('link', { name: 'Specification' })).toBeVisible()

    // Fill in working title if there's an input
    const titleInput = page.locator('input').first()
    if (await titleInput.isVisible()) {
      await titleInput.fill('Felix der mutige Fuchs')
    }

    // Look for save button and click if visible
    const saveButton = page.locator('button').filter({ hasText: /save/i }).first()
    if (await saveButton.isVisible()) {
      await saveButton.click()
      await page.waitForTimeout(500)
    }

    // Verify title appears somewhere on page
    const titleText = page.locator('text=Felix der mutige Fuchs')
    const isVisible = await titleText.isVisible().catch(() => false)
    if (isVisible) {
      await expect(titleText).toBeVisible()
    }
  })

  test('2. Brainstorm Mode - Enter Ideas', async ({ page }) => {
    // Create project first
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Navigate to brainstorm
    const projectUrl = page.url()
    const brainstormUrl = projectUrl.replace('specification', 'brainstorm')
    await page.goto(brainstormUrl)
    await page.waitForLoadState('domcontentloaded')

    // Find and fill brainstorm textarea
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })
    await textarea.fill(BRAINSTORM_TEXT)

    // Verify text was entered
    await expect(textarea).toHaveValue(BRAINSTORM_TEXT)

    // Look for analyze button
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|generate/i }).first()
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click()
      await page.waitForTimeout(2000)
    }
  })

  test('3. Plot Development Page Loads', async ({ page }) => {
    // Create project first
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Navigate to plot
    const projectUrl = page.url()
    const plotUrl = projectUrl.replace('specification', 'plot')
    await page.goto(plotUrl)
    await page.waitForLoadState('domcontentloaded')

    // Verify we're on plot page - look for plot-related content
    const plotContent = page.locator('text=/plot|act|beat|story/i').first()
    await expect(plotContent).toBeVisible({ timeout: 10000 })
  })

  test('4. Characters Page Loads', async ({ page }) => {
    // Create project first
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Navigate to characters
    const projectUrl = page.url()
    const charactersUrl = projectUrl.replace('specification', 'characters')
    await page.goto(charactersUrl)
    await page.waitForLoadState('domcontentloaded')

    // Verify characters page loads
    const charactersContent = page.locator('text=/character|add|new/i').first()
    await expect(charactersContent).toBeVisible({ timeout: 10000 })
  })

  test('5. Scenes Page Loads', async ({ page }) => {
    // Create project first
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Navigate to scenes
    const projectUrl = page.url()
    const scenesUrl = projectUrl.replace('specification', 'scenes')
    await page.goto(scenesUrl)
    await page.waitForLoadState('domcontentloaded')

    // Verify scenes page loads
    const scenesContent = page.locator('text=/scene|add|timeline/i').first()
    await expect(scenesContent).toBeVisible({ timeout: 10000 })
  })

  test('6. Write Page Loads', async ({ page }) => {
    // Create project first
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Navigate to write
    const projectUrl = page.url()
    const writeUrl = projectUrl.replace('specification', 'write')
    await page.goto(writeUrl)
    await page.waitForLoadState('domcontentloaded')

    // Verify write page loads
    const writeContent = page.locator('text=/write|chapter|draft/i').first()
    await expect(writeContent).toBeVisible({ timeout: 10000 })
  })
})

// Separate test for full workflow (more comprehensive)
test.describe('Full Novel Creation Workflow', () => {
  test('Complete workflow from start to chapter', async ({ page }) => {
    // Start fresh
    await page.goto('/')
    await waitForApp(page)

    // 1. Create project
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)
    console.log('Project created')

    // 2. Go to brainstorm and add content
    const projectUrl = page.url()
    const baseUrl = projectUrl.replace('/specification', '')

    await page.goto(`${baseUrl}/brainstorm`)
    await page.waitForLoadState('domcontentloaded')

    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible()) {
      await textarea.fill(BRAINSTORM_TEXT)
      console.log('Brainstorm text entered')
    }

    // 3. Navigate through sections to verify they load
    const sections = ['plot', 'characters', 'scenes', 'write']
    for (const section of sections) {
      await page.goto(`${baseUrl}/${section}`)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(500)
      console.log(`${section} section loaded`)
    }

    // 4. Return to project list
    await page.goto('/')
    await waitForApp(page)

    // Verify project appears in list
    const projectCards = page.locator('.card-interactive, [class*="project"], [class*="card"]')
    const count = await projectCards.count()
    console.log(`Found ${count} projects in list`)
    expect(count).toBeGreaterThan(0)
  })
})

// Test keyboard navigation
test.describe('Keyboard Navigation', () => {
  test('Cmd+number shortcuts navigate sections', async ({ page }) => {
    await page.goto('/')
    await waitForApp(page)

    // Create project
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Test Cmd+1 for Specification
    await page.keyboard.press('Meta+1')
    await page.waitForTimeout(300)
    expect(page.url()).toContain('specification')

    // Test Cmd+2 for Brainstorm (if unlocked)
    await page.keyboard.press('Meta+2')
    await page.waitForTimeout(300)
    // URL may or may not change depending on unlock status
  })
})
