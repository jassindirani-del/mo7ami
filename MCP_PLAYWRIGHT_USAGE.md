# 🎭 Using Playwright MCP for Mo7ami Testing

**Last Updated:** October 15, 2025
**MCP Status:** ✅ Configured and Ready
**Browsers Installed:** Chromium, WebKit

---

## 🚀 Quick Start

### 1. Verify MCP Configuration

Check that Playwright MCP is configured:

```bash
# Check MCP servers config
cat ~/.claude/mcp_servers.json
```

You should see:
```json
{
  "playwright": {
    "command": "npx",
    "args": ["-y", "@playwright/mcp"],
    "cwd": "/Users/yassinedrani/Desktop/mo7ami",
    "description": "Browser automation for visual testing and E2E testing"
  }
}
```

### 2. Run Tests via Claude Code

You can now use natural language commands with Claude Code to run tests:

#### Example Commands:

**Test homepage responsiveness:**
```
"Test the Mo7ami homepage on mobile, tablet, and desktop devices"
```

**Test chat interface:**
```
"Check if the chat interface works properly on all screen sizes"
```

**Test voice recording UI:**
```
"Verify the voice recording button is visible and styled correctly"
```

**Run all tests:**
```
"Run the full visual responsiveness test suite and generate a report"
```

### 3. Run Tests Directly

Without MCP, you can run tests manually:

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/visual-responsiveness.spec.ts

# Run with UI mode (visual debugger)
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=webkit

# Generate HTML report
npx playwright test --reporter=html

# Show last test report
npx playwright show-report
```

---

## 📊 Understanding Test Results

### Test Output Structure

```
Running 19 tests using 4 workers

✅ [chromium] › Homepage renders correctly on Mobile (1.8s)
✅ [chromium] › Homepage renders correctly on Tablet (2.0s)
✅ [chromium] › Homepage renders correctly on Desktop (2.1s)
❌ [chromium] › Homepage language toggle works (30.0s - TIMEOUT)
✅ [chromium] › Chat interface renders correctly on Mobile (1.9s)
...

15 passed (78.9%)
4 failed (21.1%)
Duration: 36.1s
```

### Screenshot Locations

All screenshots are saved in:
```
tests/screenshots/
├── homepage-mobile.png       (326 KB)
├── homepage-tablet.png       (497 KB)
├── homepage-desktop.png      (741 KB)
├── chat-mobile.png          (83 KB)
├── chat-tablet.png          (177 KB)
├── chat-desktop.png         (266 KB)
├── chat-input-arabic.png    (169 KB)
├── chat-input-french.png    (170 KB)
├── chat-messages.png        (168 KB)
├── voice-button-idle.png    (168 KB)
├── voice-button-hover.png   (168 KB)
├── voice-recording-active.png (168 KB)
└── voice-recording-stopped.png (168 KB)
```

### Test Reports

Test reports are generated in:
```
tests/reports/
├── results.json          (Machine-readable results)
└── html/                 (Interactive HTML report)
    ├── index.html
    └── ... (report assets)
```

---

## 🎯 Test Coverage

### Current Test Suite

The Mo7ami test suite covers:

#### 1. **Homepage Tests** (7 tests)
- ✅ Logo visibility and sizing (mobile, tablet, desktop)
- ❌ Language toggle functionality (4 failed - selector issue)
- ✅ RTL/LTR direction handling
- ✅ Title and subtitle typography
- ✅ Start button visibility

#### 2. **Chat Interface Tests** (4 tests)
- ✅ Chat layout responsiveness (mobile, tablet, desktop)
- ✅ Text input (Arabic and French)
- ✅ Message display with logo avatars
- ✅ Header and footer components

#### 3. **Voice Recording Tests** (2 tests)
- ✅ Voice button visibility and styling
- ⚠️ Recording visual feedback (partial pass)

#### 4. **Typography Tests** (2 tests)
- ✅ Font sizing and spacing
- ✅ Font rendering (antialiasing)

#### 5. **Accessibility Tests** (2 tests)
- ✅ ARIA labels and alt text
- ✅ Color contrast basics

#### 6. **Performance Tests** (2 tests)
- ✅ Homepage load time (<2s)
- ✅ Chat page load time (<2s)

---

## 🔧 Customizing Tests

### Add a New Test

Edit `tests/visual-responsiveness.spec.ts`:

```typescript
test('My new test', async ({ page }) => {
  // 1. Navigate to page
  await page.goto(BASE_URL);

  // 2. Wait for page load
  await page.waitForLoadState('networkidle');

  // 3. Find element
  const element = page.locator('.my-element');

  // 4. Make assertions
  await expect(element).toBeVisible();

  // 5. Take screenshot
  await page.screenshot({
    path: 'tests/screenshots/my-test.png'
  });

  console.log('✅ My test passed');
});
```

### Test Different Viewports

```typescript
const customDevice = { width: 1440, height: 900 };

test('Test on custom viewport', async ({ page }) => {
  await page.setViewportSize(customDevice);
  await page.goto(BASE_URL);
  // ... your test
});
```

### Test Multiple Languages

```typescript
test('Test Arabic interface', async ({ page }) => {
  // Navigate with language parameter
  await page.goto(`${BASE_URL}?lang=ar`);

  // Check for Arabic text
  const title = page.locator('h1:has-text("محامي")');
  await expect(title).toBeVisible();
});

test('Test French interface', async ({ page }) => {
  await page.goto(`${BASE_URL}?lang=fr`);

  const title = page.locator('h1:has-text("Mo7ami")');
  await expect(title).toBeVisible();
});
```

---

## 🐛 Debugging Failed Tests

### View Failure Screenshots

When a test fails, Playwright automatically captures:
- Screenshot at failure point
- Video recording of the test
- Trace file for debugging

Location:
```
test-results/
└── [test-name]-[browser]/
    ├── test-failed-1.png     (Screenshot)
    ├── video.webm            (Video recording)
    └── trace.zip             (Trace file)
```

### View Traces

Traces show a timeline of all actions:

```bash
# Show trace for a failed test
npx playwright show-trace test-results/[test-name]-[browser]/trace.zip
```

### Debug Mode

Run tests in debug mode with browser visible:

```bash
# Debug mode (headed, slow)
npx playwright test --debug

# Debug specific test
npx playwright test tests/visual-responsiveness.spec.ts:75 --debug
```

### UI Mode

Interactive test runner:

```bash
npx playwright test --ui
```

Features:
- ▶️ Run/pause tests
- 🔍 Inspect elements
- 📸 View screenshots
- 🎬 Watch recordings
- 🔧 Edit test code live

---

## 📈 Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright Browsers
      run: npx playwright install --with-deps

    - name: Run Playwright tests
      run: npx playwright test

    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: tests/reports/
        retention-days: 30

    - name: Upload screenshots
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: screenshots
        path: tests/screenshots/
        retention-days: 7
```

---

## 🎨 Visual Regression Testing

### Enable Screenshot Comparison

```typescript
test('Visual regression test', async ({ page }) => {
  await page.goto(BASE_URL);

  // Take screenshot and compare with baseline
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100  // Allow 100px difference
  });
});
```

### Update Baselines

When design changes are intentional:

```bash
# Update all baselines
npx playwright test --update-snapshots

# Update specific test
npx playwright test homepage-test --update-snapshots
```

---

## 📱 Mobile Device Emulation

### Test Real Devices

```typescript
import { devices } from '@playwright/test';

test('iPhone 12 test', async ({ page }) => {
  await page.setViewportSize(devices['iPhone 12'].viewport);
  await page.goto(BASE_URL);

  // Test mobile-specific features
});

test('iPad Pro test', async ({ page }) => {
  await page.setViewportSize(devices['iPad Pro'].viewport);
  await page.goto(BASE_URL);

  // Test tablet-specific features
});
```

### Available Devices

Common device presets:
- `'iPhone 12'`, `'iPhone 13 Pro'`, `'iPhone SE'`
- `'iPad'`, `'iPad Pro'`, `'iPad Mini'`
- `'Pixel 5'`, `'Galaxy S21'`, `'Galaxy Tab S7'`
- `'Desktop Chrome'`, `'Desktop Firefox'`, `'Desktop Safari'`

---

## 🔐 Testing Authentication

### Test Logged-In State

```typescript
test('Test with authentication', async ({ page }) => {
  // 1. Go to login page
  await page.goto(`${BASE_URL}/auth/signin`);

  // 2. Sign in (replace with actual flow)
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 3. Wait for redirect
  await page.waitForURL(`${BASE_URL}/chat`);

  // 4. Test authenticated features
  const profileButton = page.locator('[aria-label="Profile"]');
  await expect(profileButton).toBeVisible();
});
```

### Reuse Authentication State

Save auth state once, reuse in all tests:

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto(`${BASE_URL}/auth/signin`);
  // ... login steps ...

  // Save authentication state
  await page.context().storageState({
    path: 'tests/.auth/user.json'
  });
});
```

Then in tests:
```typescript
test.use({ storageState: 'tests/.auth/user.json' });

test('Test as logged-in user', async ({ page }) => {
  // Already authenticated!
  await page.goto(`${BASE_URL}/chat`);
});
```

---

## 🌐 Testing Arabic (RTL) Layouts

### RTL-Specific Tests

```typescript
test('Arabic layout is RTL', async ({ page }) => {
  await page.goto(`${BASE_URL}?lang=ar`);

  // Check direction attribute
  const dir = await page.evaluate(() => document.body.dir);
  expect(dir).toBe('rtl');

  // Check text alignment
  const title = page.locator('h1');
  const alignment = await title.evaluate((el) =>
    window.getComputedStyle(el).textAlign
  );
  expect(alignment).toBe('right');

  // Check input direction
  const input = page.locator('textarea');
  const inputDir = await input.getAttribute('dir');
  expect(inputDir).toBe('rtl');
});
```

---

## 📊 Performance Testing

### Measure Load Times

```typescript
test('Performance metrics', async ({ page }) => {
  const startTime = Date.now();

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;

  // Get web vitals
  const metrics = await page.evaluate(() => ({
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
    cls: performance.getEntriesByType('layout-shift')
      .reduce((sum, entry) => sum + (entry as any).value, 0)
  }));

  console.log('Load time:', loadTime, 'ms');
  console.log('Metrics:', metrics);

  // Assertions
  expect(loadTime).toBeLessThan(3000);
  expect(metrics.fcp).toBeLessThan(2000);
  expect(metrics.cls).toBeLessThan(0.1);
});
```

---

## 🎓 Best Practices

### 1. **Use Data Test IDs**

Instead of fragile selectors:
```typescript
// ❌ Bad
page.locator('div > div:nth-child(2) > button.blue')

// ✅ Good
page.locator('[data-testid="voice-button"]')
```

In your components:
```tsx
<button data-testid="voice-button">
  <Mic />
</button>
```

### 2. **Wait for Network Idle**

```typescript
// Wait for page to fully load
await page.goto(BASE_URL);
await page.waitForLoadState('networkidle');
```

### 3. **Use Descriptive Test Names**

```typescript
// ❌ Bad
test('test 1', async ({ page }) => {

// ✅ Good
test('Voice button should be visible on mobile devices', async ({ page }) => {
```

### 4. **Take Screenshots on Critical Points**

```typescript
// Before interaction
await page.screenshot({ path: 'tests/screenshots/before-click.png' });

// After interaction
await button.click();
await page.screenshot({ path: 'tests/screenshots/after-click.png' });
```

### 5. **Handle Timeouts Gracefully**

```typescript
// Set custom timeout for slow operations
await page.goto(BASE_URL, { timeout: 60000 });

// Or per action
await page.locator('.slow-element').click({ timeout: 10000 });
```

---

## 📚 Resources

### Playwright Documentation
- Official Docs: https://playwright.dev
- API Reference: https://playwright.dev/docs/api/class-playwright
- Best Practices: https://playwright.dev/docs/best-practices

### Mo7ami Specific
- Test Suite: `tests/visual-responsiveness.spec.ts`
- Configuration: `playwright.config.ts`
- MCP Config: `~/.claude/mcp_servers.json`
- Latest Report: `VISUAL_RESPONSIVENESS_REPORT.md`

### Getting Help
- GitHub Issues: https://github.com/microsoft/playwright/issues
- Discord: https://aka.ms/playwright/discord
- Stack Overflow: [playwright] tag

---

## 🎉 Summary

You now have:
- ✅ Playwright MCP configured and working
- ✅ Comprehensive test suite for Mo7ami
- ✅ 13 screenshots documenting visual states
- ✅ Detailed test report with metrics
- ✅ Knowledge to add new tests and debug issues

**Next Steps:**
1. Fix the 4 failed tests (language toggle selector)
2. Add authentication tests for logged-in features
3. Set up CI/CD pipeline for automated testing
4. Create visual regression baselines

**Happy Testing!** 🧪✨

---

**Document Version:** 1.0
**Last Updated:** October 15, 2025
**Maintained By:** Mo7ami Development Team
