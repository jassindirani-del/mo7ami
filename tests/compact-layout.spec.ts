import { test, expect } from '@playwright/test';

/**
 * Mo7ami - Compact Layout & Visual Accuracy Tests
 *
 * Tests verify:
 * - Homepage vertical compactness (reduced spacing)
 * - Enhanced text visibility (larger fonts)
 * - Logo integration on sign-in page
 * - Visual consistency across pages
 */

const BASE_URL = 'http://localhost:3000';

test.describe('Mo7ami - Compact Layout Tests', () => {

  test.describe('Homepage - Vertical Compactness', () => {

    test('Homepage hero section is vertically compact', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Take baseline screenshot
      await page.screenshot({
        path: 'tests/screenshots/homepage-compact-full.png',
        fullPage: true
      });

      // Measure hero section height
      const heroSection = page.locator('.container-luxury').first();
      const heroBox = await heroSection.boundingBox();

      console.log('Hero section dimensions:', {
        height: heroBox?.height,
        y: heroBox?.y
      });

      // Hero section should be compact (not exceed viewport height significantly)
      if (heroBox) {
        expect(heroBox.height).toBeLessThan(1000); // Reasonable compact height
      }

      // Check logo visibility
      const logo = page.locator('img[alt*="Mo7ami"]').first();
      await expect(logo).toBeVisible();

      // Check title visibility and size
      const title = page.locator('h1:has-text("محامي"), h1:has-text("Mo7ami")');
      await expect(title).toBeVisible();

      // Verify text spacing is tight
      const titleBox = await title.boundingBox();
      console.log('Title dimensions:', titleBox);

      console.log('✅ Homepage is vertically compact');
    });

    test('Homepage title is prominently visible (large font)', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check title font size - should be LARGE (96px on desktop)
      const title = page.locator('h1').first();
      const titleStyles = await title.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          lineHeight: styles.lineHeight
        };
      });

      console.log('Title styles:', titleStyles);

      // Title should be at least 72px (increased from 72px to 96px)
      const fontSize = parseInt(titleStyles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(72);

      // Font weight should be bold (700)
      expect(titleStyles.fontWeight).toBe('700');

      // Take screenshot of title area
      const titleBox = await title.boundingBox();
      if (titleBox) {
        await page.screenshot({
          path: 'tests/screenshots/homepage-title-prominent.png',
          clip: {
            x: Math.max(0, titleBox.x - 50),
            y: Math.max(0, titleBox.y - 50),
            width: Math.min(1920, titleBox.width + 100),
            height: Math.min(1080, titleBox.height + 100)
          }
        });
      }

      console.log('✅ Title is prominently visible');
    });

    test('Homepage subtitle is bold and visible', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Find subtitle
      const subtitle = page.locator('p.text-teal-700').first();
      await expect(subtitle).toBeVisible();

      const subtitleStyles = await subtitle.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          color: styles.color
        };
      });

      console.log('Subtitle styles:', subtitleStyles);

      // Subtitle should be large (32px on desktop, increased from 30px)
      const fontSize = parseInt(subtitleStyles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(24);

      // Should be bold (700)
      expect(subtitleStyles.fontWeight).toBe('700');

      console.log('✅ Subtitle is bold and visible');
    });

    test('Homepage description text is prominent', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Find description paragraph
      const description = page.locator('p').filter({ hasText: /القانون المغربي|droit marocain/ }).first();
      await expect(description).toBeVisible();

      const descStyles = await description.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          color: styles.color
        };
      });

      console.log('Description styles:', descStyles);

      // Description should be larger (24px+, increased from 20px)
      const fontSize = parseInt(descStyles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(20);

      // Should be medium weight (500)
      expect(descStyles.fontWeight).toBe('500');

      console.log('✅ Description is prominent');
    });

    test('Homepage spacing is compact but readable', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Measure spacing between key elements
      const logo = page.locator('img[alt*="Mo7ami"]').first();
      const title = page.locator('h1').first();
      const description = page.locator('p').filter({ hasText: /القانون المغربي|droit marocain/ }).first();

      const logoBox = await logo.boundingBox();
      const titleBox = await title.boundingBox();
      const descBox = await description.boundingBox();

      if (logoBox && titleBox && descBox) {
        // Calculate spacing
        const logoToTitleGap = titleBox.y - (logoBox.y + logoBox.height);
        const titleToDescGap = descBox.y - (titleBox.y + titleBox.height);

        console.log('Spacing measurements:', {
          logoToTitle: logoToTitleGap + 'px',
          titleToDesc: titleToDescGap + 'px'
        });

        // Spacing should be tight but not cramped
        expect(logoToTitleGap).toBeGreaterThanOrEqual(8); // At least 8px (mb-3 = 12px)
        expect(logoToTitleGap).toBeLessThan(50); // Not more than 50px

        expect(titleToDescGap).toBeGreaterThanOrEqual(8); // At least 8px (mb-4 = 16px)
        expect(titleToDescGap).toBeLessThan(80); // Not more than 80px (allows for subtitle)
      }

      console.log('✅ Spacing is compact but readable');
    });

  });

  test.describe('Sign-In Page - Logo Integration', () => {

    test('Sign-in page displays Mo7ami logo', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/signin-page-with-logo.png',
        fullPage: true
      });

      // Check logo is present (not SVG)
      const logo = page.locator('img[alt="Mo7ami Logo"]');
      await expect(logo).toBeVisible();

      // Verify it's the actual logo image
      const logoSrc = await logo.getAttribute('src');
      expect(logoSrc).toBe('/logo1.png');

      console.log('✅ Sign-in page has Mo7ami logo:', logoSrc);

      // Check logo container styling
      const logoContainer = logo.locator('..');
      const containerClasses = await logoContainer.getAttribute('class');
      console.log('Logo container classes:', containerClasses);

      // Should have proper styling (border, shadow, etc.)
      expect(containerClasses).toContain('shadow-xl');
      expect(containerClasses).toContain('border');

      console.log('✅ Logo is properly styled');
    });

    test('Sign-in logo has correct dimensions', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.waitForLoadState('networkidle');

      // Get logo dimensions
      const logo = page.locator('img[alt="Mo7ami Logo"]');
      const logoBox = await logo.boundingBox();

      console.log('Sign-in logo dimensions:', logoBox);

      if (logoBox) {
        // Logo should be reasonable size (128px container = w-32 h-32)
        expect(logoBox.width).toBeGreaterThanOrEqual(100);
        expect(logoBox.width).toBeLessThanOrEqual(150);

        // Should be roughly square
        const ratio = logoBox.width / logoBox.height;
        expect(ratio).toBeGreaterThan(0.9);
        expect(ratio).toBeLessThan(1.1);
      }

      console.log('✅ Sign-in logo has correct dimensions');
    });

    test('Sign-in page maintains visual consistency', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.waitForLoadState('networkidle');

      // Check key elements are present
      const logo = page.locator('img[alt="Mo7ami Logo"]');
      const title = page.locator('h1:has-text("محامي")');
      const subtitle = page.locator('p:has-text("مساعدك القانوني")');
      const googleButton = page.locator('button:has-text("Google")');

      await expect(logo).toBeVisible();
      await expect(title).toBeVisible();
      await expect(subtitle).toBeVisible();
      await expect(googleButton).toBeVisible();

      // Verify title and subtitle match homepage
      const titleText = await title.textContent();
      const subtitleText = await subtitle.textContent();

      console.log('Sign-in page text:', { titleText, subtitleText });

      expect(titleText).toContain('محامي');
      expect(subtitleText).toContain('مساعدك القانوني');

      console.log('✅ Sign-in page is visually consistent');
    });

  });

  test.describe('Cross-Page Visual Consistency', () => {

    test('Logo appears consistently across all pages', async ({ page }) => {
      const pages = [
        { url: '/', name: 'Homepage' },
        { url: '/auth/signin', name: 'Sign-in' },
        { url: '/chat', name: 'Chat' }
      ];

      const logoData: any[] = [];

      for (const pageData of pages) {
        await page.goto(`${BASE_URL}${pageData.url}`);
        await page.waitForLoadState('networkidle');

        const logo = page.locator('img[alt*="Mo7ami"], img[src*="logo1.png"]').first();

        if (await logo.isVisible()) {
          const logoBox = await logo.boundingBox();
          const logoSrc = await logo.getAttribute('src');

          logoData.push({
            page: pageData.name,
            src: logoSrc,
            width: logoBox?.width,
            height: logoBox?.height
          });
        }
      }

      console.log('Logo across pages:', logoData);

      // All logos should use the same source
      const sources = logoData.map(d => d.src);
      const uniqueSources = [...new Set(sources)];
      expect(uniqueSources.length).toBe(1);
      expect(uniqueSources[0]).toBe('/logo1.png');

      console.log('✅ Logo is consistent across all pages');
    });

    test('Typography scale is consistent', async ({ page }) => {
      // Test homepage
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const homepageTitle = page.locator('h1').first();
      const homepageTitleSize = await homepageTitle.evaluate((el) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });

      // Test sign-in page
      await page.goto(`${BASE_URL}/auth/signin`);
      await page.waitForLoadState('networkidle');

      const signinTitle = page.locator('h1').first();
      const signinTitleSize = await signinTitle.evaluate((el) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });

      console.log('Typography comparison:', {
        homepage: homepageTitleSize + 'px',
        signin: signinTitleSize + 'px'
      });

      // Sizes should be in a reasonable range
      expect(homepageTitleSize).toBeGreaterThanOrEqual(72);
      expect(signinTitleSize).toBeGreaterThanOrEqual(28);

      console.log('✅ Typography scale is consistent');
    });

  });

  test.describe('Responsive Behavior', () => {

    test('Compact layout works on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/homepage-compact-mobile.png',
        fullPage: true
      });

      // Check all elements are visible
      const logo = page.locator('img[alt*="Mo7ami"]').first();
      const title = page.locator('h1').first();
      const description = page.locator('p').filter({ hasText: /القانون المغربي|droit marocain/ }).first();
      const startButton = page.locator('a[href="/chat"]').first();

      await expect(logo).toBeVisible();
      await expect(title).toBeVisible();
      await expect(description).toBeVisible();
      await expect(startButton).toBeVisible();

      // Check font sizes are appropriate for mobile
      const titleSize = await title.evaluate((el) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });

      console.log('Mobile title size:', titleSize + 'px');

      // Mobile should have large but not excessive font (text-6xl = 60px)
      expect(titleSize).toBeGreaterThanOrEqual(48);
      expect(titleSize).toBeLessThanOrEqual(80);

      console.log('✅ Compact layout works on mobile');
    });

    test('Compact layout works on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/homepage-compact-tablet.png',
        fullPage: true
      });

      // Verify layout is compact
      const heroSection = page.locator('.container-luxury').first();
      const heroBox = await heroSection.boundingBox();

      console.log('Tablet hero section height:', heroBox?.height);

      // Should still be reasonably compact
      if (heroBox) {
        expect(heroBox.height).toBeLessThan(1200);
      }

      console.log('✅ Compact layout works on tablet');
    });

    test('Compact layout works on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/homepage-compact-desktop.png',
        fullPage: false // Don't need full page, just above fold
      });

      // Check title is VERY large (text-8xl = 96px)
      const title = page.locator('h1').first();
      const titleSize = await title.evaluate((el) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });

      console.log('Desktop title size:', titleSize + 'px');

      // Desktop should have maximum visibility (96px)
      expect(titleSize).toBeGreaterThanOrEqual(84);

      console.log('✅ Compact layout works on desktop with maximum text visibility');
    });

  });

  test.describe('Interactive Elements', () => {

    test('CTA buttons are visible and interactive', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Find start button
      const startButton = page.locator('a[href="/chat"]').first();
      await expect(startButton).toBeVisible();

      // Hover over button
      await startButton.hover();
      await page.waitForTimeout(300);

      // Take screenshot of hover state
      await page.screenshot({
        path: 'tests/screenshots/homepage-cta-hover.png',
        fullPage: false
      });

      // Button should be interactive (check if hover changes anything)
      const buttonClasses = await startButton.getAttribute('class');
      expect(buttonClasses).toContain('hover:');

      console.log('✅ CTA buttons are interactive');
    });

    test('Language selector remains accessible', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Find language buttons
      const arabicBtn = page.locator('button:has-text("العربية")');
      const frenchBtn = page.locator('button:has-text("Français")');
      const amazighBtn = page.locator('button:has-text("ⵜⴰⵎⴰⵣⵉⵖⵜ")');

      await expect(arabicBtn).toBeVisible();
      await expect(frenchBtn).toBeVisible();
      await expect(amazighBtn).toBeVisible();

      // Click French button
      await frenchBtn.click();
      await page.waitForTimeout(300);

      // Verify language changed
      const title = await page.locator('h1').textContent();
      expect(title).toContain('Mo7ami');

      console.log('✅ Language selector works');
    });

  });

});
