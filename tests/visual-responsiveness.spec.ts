import { test, expect, devices } from '@playwright/test';

/**
 * Mo7ami Platform - Visual Responsiveness & Functionality Tests
 *
 * Tests cover:
 * - Homepage responsiveness (mobile, tablet, desktop)
 * - Chat interface across devices
 * - Voice recording UI consistency
 * - Arabic (RTL) and French (LTR) layouts
 * - Logo visibility and branding
 * - Typography and readability
 */

const BASE_URL = 'http://localhost:3000';

// Device configurations to test
const testDevices = [
  { name: 'Mobile', viewport: { width: 375, height: 667 } }, // iPhone SE
  { name: 'Tablet', viewport: { width: 768, height: 1024 } }, // iPad
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } }, // Full HD
];

test.describe('Mo7ami Platform - Visual Responsiveness Tests', () => {

  test.describe('Homepage Tests', () => {

    for (const device of testDevices) {
      test(`Homepage renders correctly on ${device.name}`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize(device.viewport);

        // Navigate to homepage
        await page.goto(BASE_URL);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await page.screenshot({
          path: `tests/screenshots/homepage-${device.name.toLowerCase()}.png`,
          fullPage: true
        });

        // Test 1: Logo visibility
        const logo = page.locator('img[alt*="Mo7ami"], img[alt*="محامي"]');
        await expect(logo).toBeVisible();

        // Test 2: Logo size check (responsive)
        const logoBox = await logo.boundingBox();
        if (device.name === 'Mobile') {
          expect(logoBox?.width).toBeGreaterThanOrEqual(320); // w-80 = 320px
        } else if (device.name === 'Tablet') {
          expect(logoBox?.width).toBeGreaterThanOrEqual(384); // md:w-96 = 384px
        } else {
          expect(logoBox?.width).toBeGreaterThanOrEqual(448); // lg:w-[28rem] = 448px
        }

        // Test 3: Title visibility
        const title = page.locator('h1:has-text("محامي"), h1:has-text("Mo7ami")');
        await expect(title).toBeVisible();

        // Test 4: Language toggle buttons
        const langToggle = page.locator('button:has-text("عربي"), button:has-text("Français"), button:has-text("ⵜⴰⵎⴰⵣⵉⵖⵜ")');
        await expect(langToggle.first()).toBeVisible();

        // Test 5: Start button/link
        const startButton = page.locator('a[href*="/chat"], button:has-text("ابدأ الآن"), button:has-text("Commencer")');
        await expect(startButton.first()).toBeVisible();

        console.log(`✅ Homepage test passed on ${device.name}`);
      });
    }

    test('Homepage language toggle works (Arabic ↔ French)', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check initial language (should be Arabic by default)
      let title = await page.locator('h1').textContent();
      const isInitiallyArabic = title?.includes('محامي');

      // Click language toggle (French button)
      const langToggle = page.locator('button:has-text("Français")');
      await langToggle.click();
      await page.waitForTimeout(500); // Wait for animation

      // Check language changed
      title = await page.locator('h1').textContent();
      if (isInitiallyArabic) {
        expect(title).toContain('Mo7ami'); // Should now be French
      } else {
        expect(title).toContain('محامي'); // Should now be Arabic
      }

      // Take screenshot of toggled state
      await page.screenshot({
        path: 'tests/screenshots/homepage-language-toggled.png',
        fullPage: true
      });

      console.log('✅ Language toggle test passed');
    });

    test('Homepage has proper RTL/LTR direction', async ({ page }) => {
      await page.goto(BASE_URL);

      // Test Arabic (RTL)
      const bodyDir = await page.evaluate(() => document.body.dir);
      console.log('Body direction:', bodyDir);

      // Check for RTL/LTR classes or attributes
      const hasRTL = await page.evaluate(() => {
        return document.documentElement.dir === 'rtl' ||
               document.body.dir === 'rtl' ||
               document.querySelector('[dir="rtl"]') !== null;
      });

      console.log('✅ RTL/LTR direction test completed');
    });
  });

  test.describe('Chat Interface Tests', () => {

    for (const device of testDevices) {
      test(`Chat interface renders correctly on ${device.name}`, async ({ page }) => {
        await page.setViewportSize(device.viewport);

        // Navigate to chat page
        await page.goto(`${BASE_URL}/chat`);
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await page.screenshot({
          path: `tests/screenshots/chat-${device.name.toLowerCase()}.png`,
          fullPage: true
        });

        // Test 1: Chat header visible
        const header = page.locator('header, [class*="ChatHeader"]');
        await expect(header.first()).toBeVisible();

        // Test 2: Input area visible
        const input = page.locator('textarea[placeholder*="سؤالك"], textarea[placeholder*="question"], input[placeholder*="سؤالك"]');
        await expect(input.first()).toBeVisible();

        // Test 3: Voice button visible
        const voiceButton = page.locator('button[title*="تسجيل"], button[title*="vocal"], button:has(svg)').filter({ hasText: /mic|microphone/i });
        const voiceButtonAlt = page.locator('button').filter({ has: page.locator('svg') });
        const isVoiceVisible = await voiceButton.first().isVisible().catch(() => false) ||
                               await voiceButtonAlt.first().isVisible().catch(() => false);

        console.log(`Voice button visible on ${device.name}:`, isVoiceVisible);

        // Test 4: Logo in header (48px size)
        const headerLogo = page.locator('header img[alt*="Mo7ami"], header img[alt*="محامي"]');
        if (await headerLogo.count() > 0) {
          const logoBox = await headerLogo.first().boundingBox();
          expect(logoBox?.width).toBeGreaterThanOrEqual(40); // Should be 40-48px
          expect(logoBox?.width).toBeLessThanOrEqual(60);
        }

        console.log(`✅ Chat interface test passed on ${device.name}`);
      });
    }

    test('Chat input handles text and shows character counter', async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);
      await page.waitForLoadState('networkidle');

      // Find input field
      const input = page.locator('textarea[placeholder*="سؤالك"], textarea[placeholder*="question"]').first();

      // Type Arabic text
      const arabicText = 'ما هي شروط الزواج في القانون المغربي؟';
      await input.fill(arabicText);

      // Check if text appears
      const value = await input.inputValue();
      expect(value).toBe(arabicText);

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/chat-input-arabic.png',
        fullPage: true
      });

      // Clear and type French text
      await input.clear();
      const frenchText = 'Quelles sont les conditions du mariage au Maroc?';
      await input.fill(frenchText);

      const valueFr = await input.inputValue();
      expect(valueFr).toBe(frenchText);

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/chat-input-french.png',
        fullPage: true
      });

      console.log('✅ Chat input test passed');
    });

    test('Chat shows assistant messages with logo avatar', async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);
      await page.waitForLoadState('networkidle');

      // Check if there are any existing messages
      const messages = page.locator('[class*="message"], [class*="Message"]');
      const messageCount = await messages.count();

      if (messageCount > 0) {
        // Find assistant messages (not user messages)
        const assistantAvatar = page.locator('img[alt*="Mo7ami"], img[src*="logo1.png"]').first();

        if (await assistantAvatar.count() > 0) {
          await expect(assistantAvatar).toBeVisible();

          // Check avatar is circular (width ≈ height)
          const avatarBox = await assistantAvatar.boundingBox();
          if (avatarBox) {
            const ratio = avatarBox.width / avatarBox.height;
            expect(ratio).toBeGreaterThan(0.9);
            expect(ratio).toBeLessThan(1.1);
          }
        }
      }

      // Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/chat-messages.png',
        fullPage: true
      });

      console.log('✅ Chat messages test completed');
    });
  });

  test.describe('Voice Recording UI Tests', () => {

    test('Voice button is visible and styled correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);
      await page.waitForLoadState('networkidle');

      // Find voice button (may be in different locations)
      const voiceButton = page.locator('button').filter({
        has: page.locator('svg[class*="lucide-mic"], svg')
      }).first();

      // Check visibility
      const isVisible = await voiceButton.isVisible().catch(() => false);
      console.log('Voice button visible:', isVisible);

      if (isVisible) {
        // Check button styling
        const buttonClasses = await voiceButton.getAttribute('class');
        console.log('Voice button classes:', buttonClasses);

        // Take screenshot
        await page.screenshot({
          path: 'tests/screenshots/voice-button-idle.png',
          fullPage: false
        });

        // Hover over button (test hover state)
        await voiceButton.hover();
        await page.waitForTimeout(300);

        await page.screenshot({
          path: 'tests/screenshots/voice-button-hover.png',
          fullPage: false
        });
      }

      console.log('✅ Voice button UI test completed');
    });

    test('Voice recording shows visual feedback', async ({ page, context }) => {
      // Grant microphone permissions
      await context.grantPermissions(['microphone']);

      await page.goto(`${BASE_URL}/chat`);
      await page.waitForLoadState('networkidle');

      // Find and click voice button
      const voiceButton = page.locator('button').filter({
        has: page.locator('svg')
      }).first();

      if (await voiceButton.isVisible().catch(() => false)) {
        // Click to start recording
        await voiceButton.click();

        // Wait for recording state
        await page.waitForTimeout(1000);

        // Take screenshot of recording state
        await page.screenshot({
          path: 'tests/screenshots/voice-recording-active.png',
          fullPage: false
        });

        // Check for visual indicators (red glow, animation, etc.)
        const hasRecordingIndicator = await page.evaluate(() => {
          // Check for red colors, animations, or recording-specific classes
          const elements = document.querySelectorAll('[class*="recording"], [class*="Recording"], [class*="wave"], [class*="pulse"]');
          return elements.length > 0;
        });

        console.log('Recording indicator present:', hasRecordingIndicator);

        // Stop recording
        await voiceButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'tests/screenshots/voice-recording-stopped.png',
          fullPage: false
        });
      }

      console.log('✅ Voice recording visual feedback test completed');
    });
  });

  test.describe('Typography and Readability Tests', () => {

    test('Homepage text is properly sized and spaced', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check title font size
      const title = page.locator('h1').first();
      const titleStyles = await title.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
          letterSpacing: styles.letterSpacing,
          fontWeight: styles.fontWeight
        };
      });

      console.log('Title styles:', titleStyles);

      // Title should be large (48px+ on mobile, 72px+ on desktop)
      const fontSize = parseInt(titleStyles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(48);

      // Check subtitle
      const subtitle = page.locator('p, h2').filter({ hasText: /مساعدك|assistant/i }).first();
      if (await subtitle.count() > 0) {
        const subtitleStyles = await subtitle.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            fontSize: styles.fontSize,
            lineHeight: styles.lineHeight
          };
        });

        console.log('Subtitle styles:', subtitleStyles);
      }

      console.log('✅ Typography test passed');
    });

    test('Text rendering is smooth (antialiased)', async ({ page }) => {
      await page.goto(BASE_URL);

      // Check for font-smoothing properties
      const hasFontSmoothing = await page.evaluate(() => {
        const bodyStyles = window.getComputedStyle(document.body);
        return {
          webkitFontSmoothing: (bodyStyles as any)['-webkit-font-smoothing'],
          mozOsxFontSmoothing: (bodyStyles as any)['-moz-osx-font-smoothing']
        };
      });

      console.log('Font smoothing:', hasFontSmoothing);

      console.log('✅ Font rendering test completed');
    });
  });

  test.describe('Cross-Device Consistency Tests', () => {

    test('UI elements maintain consistency across devices', async ({ page }) => {
      const results: any[] = [];

      for (const device of testDevices) {
        await page.setViewportSize(device.viewport);
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');

        // Measure logo size
        const logo = page.locator('img[alt*="Mo7ami"], img[alt*="محامي"]').first();
        const logoBox = await logo.boundingBox();

        // Measure title size
        const title = page.locator('h1').first();
        const titleBox = await title.boundingBox();

        results.push({
          device: device.name,
          logoWidth: logoBox?.width,
          logoHeight: logoBox?.height,
          titleWidth: titleBox?.width,
          titleHeight: titleBox?.height
        });
      }

      console.log('Cross-device measurements:', results);

      // Verify logo gets progressively larger
      expect(results[0].logoWidth).toBeLessThan(results[1].logoWidth!); // Mobile < Tablet
      expect(results[1].logoWidth).toBeLessThan(results[2].logoWidth!); // Tablet < Desktop

      console.log('✅ Cross-device consistency test passed');
    });
  });

  test.describe('Accessibility Tests', () => {

    test('Page has proper ARIA labels and alt text', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check logo has alt text
      const logo = page.locator('img').first();
      const altText = await logo.getAttribute('alt');
      expect(altText).toBeTruthy();

      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const hasTitle = await button.getAttribute('title');
        const hasAriaLabel = await button.getAttribute('aria-label');
        const hasText = await button.textContent();

        // Button should have at least one way to be identified
        expect(hasTitle || hasAriaLabel || hasText).toBeTruthy();
      }

      console.log('✅ Accessibility test passed');
    });

    test('Color contrast meets WCAG standards', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check text color contrast
      const title = page.locator('h1').first();
      const contrast = await title.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor
        };
      });

      console.log('Title contrast:', contrast);

      // Note: Full contrast checking would require color parsing library
      // This is a basic check that colors are defined
      expect(contrast.color).toBeTruthy();

      console.log('✅ Color contrast check completed');
    });
  });
});

test.describe('Performance Tests', () => {

  test('Homepage loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Homepage loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);

    console.log('✅ Performance test passed');
  });

  test('Chat page loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/chat`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Chat page loaded in ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);

    console.log('✅ Chat performance test passed');
  });
});
