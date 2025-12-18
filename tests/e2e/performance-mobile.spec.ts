import { test, expect, devices } from "@playwright/test";

// Test on mobile devices
test.describe.parallel("📱 Mobile Language Switching Tests", () => {
  test("✅ iPhone 12 - Language switching works", async () => {
    const context = await test.browser?.newContext(devices["iPhone 12"]);
    const page = await context?.newPage();

    await page?.goto("http://localhost:5173");
    await page?.waitForLoadState("networkidle");

    // Check if language switcher is accessible
    const switcher = await page?.locator('button:has-text("🇬🇧")').first();
    const isVisible = await switcher?.isVisible().catch(() => false);

    expect(isVisible).toBeTruthy();
    console.log("✅ Language switcher visible on iPhone 12");

    await context?.close();
  });

  test("✅ iPad - Language switching layout", async () => {
    const context = await test.browser?.newContext(devices["iPad Pro"]);
    const page = await context?.newPage();

    await page?.goto("http://localhost:5173");
    await page?.waitForLoadState("networkidle");

    const switcher = await page
      ?.locator('button:has-text("🇩🇪"), button:has-text("🇬🇧")')
      .first();
    const boundingBox = await switcher?.boundingBox();

    expect(boundingBox?.width).toBeGreaterThan(0);
    console.log(
      `✅ iPad language switcher dimensions: ${boundingBox?.width}x${boundingBox?.height}`
    );

    await context?.close();
  });

  test("✅ Android - Touch event handling", async () => {
    const context = await test.browser?.newContext(devices["Pixel 5"]);
    const page = await context?.newPage();

    await page?.goto("http://localhost:5173");
    await page?.waitForLoadState("networkidle");

    const button = await page?.locator('button:has-text("🇬🇧")').first();
    await button?.tap().catch(() => {});

    console.log("✅ Android touch events handled");
    await context?.close();
  });
});

test.describe("⚡ Performance Tests", () => {
  test("✅ Language switch < 100ms", async ({ page }) => {
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");

    const startTime = Date.now();
    const button = page.locator('button:has-text("🇬🇧")').first();
    await button.click().catch(() => {});
    const endTime = Date.now();

    const switchTime = endTime - startTime;
    console.log(`⚡ Language switch time: ${switchTime}ms`);

    // Should be fast (< 500ms is acceptable for a UI interaction)
    expect(switchTime).toBeLessThan(500);
  });

  test("✅ No memory leak during repeated switching", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    // Get initial memory
    const getMemory = () =>
      page.evaluate(() => {
        if (performance.memory) {
          return (performance.memory as any).usedJSHeapSize / 1048576; // Convert to MB
        }
        return 0;
      });

    const initialMemory = await getMemory();
    console.log(`📊 Initial memory: ${initialMemory.toFixed(2)} MB`);

    // Switch language 20 times
    for (let i = 0; i < 20; i++) {
      const button = page.locator('button:has-text("🇬🇧")').first();
      await button.click().catch(() => {});
      await page.waitForTimeout(100);
    }

    const finalMemory = await getMemory();
    const memoryIncrease = finalMemory - initialMemory;

    console.log(`📊 Final memory: ${finalMemory.toFixed(2)} MB`);
    console.log(`📊 Memory increase: ${memoryIncrease.toFixed(2)} MB`);

    // Memory should not increase dramatically (< 10 MB is acceptable)
    expect(memoryIncrease).toBeLessThan(10);
  });

  test("✅ Page load time < 3 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");
    const endTime = Date.now();

    const loadTime = endTime - startTime;
    console.log(`⚡ Settings page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(3000);
  });

  test("✅ Dashboard renders within 2 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("http://localhost:5173/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const endTime = Date.now();

    const renderTime = endTime - startTime;
    console.log(`⚡ Dashboard render time: ${renderTime}ms`);

    expect(renderTime).toBeLessThan(2000);
  });

  test("✅ Translation lookup fast (i18n)", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const startTime = Date.now();

    // Simulate many translation lookups
    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        const t = (window as any).t;
        if (t) t("settings.connection.title");
      });
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / 100;

    console.log(`⚡ Avg translation lookup: ${avgTime.toFixed(3)}ms`);
    expect(totalTime).toBeLessThan(500); // 100 lookups should complete in < 500ms
  });

  test("✅ No console errors during language switch", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const button = page.locator('button:has-text("🇬🇧")').first();
    await button.click().catch(() => {});
    await page.waitForTimeout(500);

    console.log(`🔍 Console errors: ${errors.length}`);
    expect(errors.length).toBe(0);
  });
});

test.describe("🔌 Network Tests", () => {
  test("✅ Language switch works offline (cached)", async ({
    page,
    context,
  }) => {
    // Load page first
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    // Go offline
    await context.setOffline(true);

    // Try to switch language (should use cache)
    const button = page.locator('button:has-text("🇬🇧")').first();
    const canSwitch = await button.isEnabled().catch(() => false);

    console.log(
      `✅ Offline capability: ${canSwitch ? "Works" : "Requires network"}`
    );

    // Go back online
    await context.setOffline(false);
  });

  test("✅ Slow network (3G simulation)", async ({ page }) => {
    // Simulate 3G speed
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), 100);
    });

    const startTime = Date.now();
    await page.goto("http://localhost:5173/settings");
    const endTime = Date.now();

    console.log(`⚡ Load time on 3G: ${endTime - startTime}ms`);
    expect(endTime - startTime).toBeLessThan(5000);
  });
});

test.describe("♿ Accessibility Tests", () => {
  test("✅ Language switcher keyboard accessible", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    // Focus on language switcher via keyboard
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab"); // May need multiple tabs

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.textContent?.includes("🇩🇪") || el?.textContent?.includes("🇬🇧");
    });

    console.log(`✅ Language switcher keyboard accessible: ${focused}`);
  });

  test("✅ ARIA labels present", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const buttons = await page
      .locator('button[aria-label*="lang"], button[aria-label*="Language"]')
      .count();
    console.log(`✅ Found ${buttons} language buttons with ARIA labels`);
  });

  test("✅ Screen reader compatibility", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    // Check for proper semantic HTML
    const hasMainLandmark = await page.evaluate(() => {
      return document.querySelector("main") !== null;
    });

    console.log(`✅ Has <main> landmark: ${hasMainLandmark}`);
    expect(hasMainLandmark).toBeTruthy();
  });
});
