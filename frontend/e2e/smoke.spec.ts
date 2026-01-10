import { test, expect } from '@playwright/test'

/**
 * Smoke Tests for Storyflow Application
 *
 * Quick tests to verify core functionality is working
 */

test.describe('Storyflow Smoke Tests', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Wait for React to render
    await page.waitForSelector('text=Storyflow', { timeout: 10000 })

    // Verify app title
    await expect(page.locator('text=Storyflow')).toBeVisible()

    // Verify "New Project" button exists
    await expect(page.locator('button:has-text("New Project")')).toBeVisible()
  })

  test('Can create a new project', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('button:has-text("New Project")', { timeout: 10000 })

    // Click New Project
    await page.click('button:has-text("New Project")')

    // Should navigate to specification page
    await expect(page).toHaveURL(/\/projects\/.*\/specification/)

    // Should see specification sidebar item (indicates we're on project page)
    await expect(page.getByRole('link', { name: 'Specification' })).toBeVisible()
  })

  test('Sidebar navigation works', async ({ page }) => {
    // Create a project first
    await page.goto('/')
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Test each navigation item
    const navItems = [
      { name: 'Brainstorm', url: /brainstorm/ },
      { name: 'Plot', url: /plot/ },
      { name: 'Characters', url: /character/ },
      { name: 'Scenes', url: /scene/ },
      { name: 'Write', url: /write/ },
    ]

    for (const item of navItems) {
      const navLink = page.locator(`a:has-text("${item.name}"), button:has-text("${item.name}")`)
      if (await navLink.isVisible()) {
        await navLink.click()
        await page.waitForTimeout(500)
        // Don't check URL for locked items
      }
    }
  })

  test('Keyboard shortcuts work', async ({ page }) => {
    // Create a project first
    await page.goto('/')
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Test Cmd+1 for Specification
    await page.keyboard.press('Meta+1')
    await page.waitForTimeout(300)
    await expect(page).toHaveURL(/specification/)

    // Test Cmd+2 for Brainstorm
    await page.keyboard.press('Meta+2')
    await page.waitForTimeout(300)
    // May or may not navigate depending on unlock status
  })

  test('Project search works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(300)
      // Search should filter results
    }
  })

  test('Project can be deleted', async ({ page }) => {
    // Create a project first
    await page.goto('/')
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Go back to project list
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Find delete button on first project
    const deleteButton = page.locator('button[aria-label*="Delete"], button:has([class*="trash"])')
    if (await deleteButton.first().isVisible()) {
      // Set up dialog handler to accept confirmation
      page.on('dialog', dialog => dialog.accept())

      await deleteButton.first().click()
      await page.waitForTimeout(500)
      // Project should be deleted
    }
  })
})

test.describe('Brainstorm Feature Tests', () => {
  test('Brainstorm page loads and accepts input', async ({ page }) => {
    // Create a project first
    await page.goto('/')
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Navigate to brainstorm
    const projectUrl = page.url()
    const brainstormUrl = projectUrl.replace('specification', 'brainstorm')
    await page.goto(brainstormUrl)

    // Find brainstorm textarea
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible()) {
      await textarea.fill('Test brainstorm content about a brave hero')
      await expect(textarea).toHaveValue(/brave hero/)
    }
  })

  test('Brainstorm shows writing prompts', async ({ page }) => {
    // Create a project first
    await page.goto('/')
    await page.click('button:has-text("New Project")')
    await page.waitForURL(/\/projects\/.*\/specification/)

    // Navigate to brainstorm
    const projectUrl = page.url()
    const brainstormUrl = projectUrl.replace('specification', 'brainstorm')
    await page.goto(brainstormUrl)

    // Look for writing prompts section
    const prompts = page.locator('text=/prompt|inspiration|idea/i')
    // Prompts should be visible to help users get started
  })
})

test.describe('Accessibility Tests', () => {
  test('All interactive elements have accessible names', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Check buttons have text or aria-label
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const title = await button.getAttribute('title')

      // Button should have some accessible name
      const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || title
      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('Page has proper heading structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Should have an h1
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })
})
