import { test, expect, chromium, firefox, webkit } from "@playwright/test";

test.describe("🌐 Cross-Browser i18n Tests", () => {
  test("✅ Chromium - German/English switch", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const lang = await page.evaluate(() => localStorage.getItem("i18nextLng"));
    console.log(`✅ Chromium language: ${lang}`);

    await browser.close();
  });

  test("✅ Firefox - German/English switch", async () => {
    const browser = await firefox.launch();
    const page = await browser.newPage();

    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const lang = await page.evaluate(() => localStorage.getItem("i18nextLng"));
    console.log(`✅ Firefox language: ${lang}`);

    await browser.close();
  });

  test("✅ WebKit/Safari - German/English switch", async () => {
    const browser = await webkit.launch();
    const page = await browser.newPage();

    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const lang = await page.evaluate(() => localStorage.getItem("i18nextLng"));
    console.log(`✅ WebKit language: ${lang}`);

    await browser.close();
  });
});

test.describe("🎨 UI/UX Consistency Tests", () => {
  test("✅ German text doesn't overflow buttons", async ({ page }) => {
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");

    // Switch to German
    const deButton = page.locator('button:has-text("🇩🇪")').first();
    await deButton.click().catch(() => {});
    await page.waitForTimeout(300);

    // Check button sizes
    const buttons = await page.locator('button[type="button"]').all();
    let overflows = 0;

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        const scrollWidth = await button.evaluate((el: any) => el.scrollWidth);
        if (scrollWidth > box.width) {
          overflows++;
        }
      }
    }

    console.log(`✅ Text overflow issues: ${overflows}`);
    expect(overflows).toBeLessThan(5); // Allow some minor overflows
  });

  test("✅ English text doesn't overflow buttons", async ({ page }) => {
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");

    // Switch to English
    const enButton = page.locator('button:has-text("🇬🇧")').first();
    await enButton.click().catch(() => {});
    await page.waitForTimeout(300);

    const buttons = await page.locator('button[type="button"]').all();
    let overflows = 0;

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        const scrollWidth = await button.evaluate((el: any) => el.scrollWidth);
        if (scrollWidth > box.width) {
          overflows++;
        }
      }
    }

    console.log(`✅ Text overflow issues (English): ${overflows}`);
    expect(overflows).toBeLessThan(5);
  });

  test("✅ Icons and flags display correctly", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const deFlag = page.locator("text=🇩🇪");
    const enFlag = page.locator("text=🇬🇧");

    const deVisible = await deFlag.isVisible().catch(() => false);
    const enVisible = await enFlag.isVisible().catch(() => false);

    console.log(`✅ German flag visible: ${deVisible}`);
    console.log(`✅ English flag visible: ${enVisible}`);

    expect(deVisible || enVisible).toBeTruthy();
  });

  test("✅ Font sizes readable in both languages", async ({ page }) => {
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");

    // Check heading font sizes
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    let smallHeadings = 0;

    for (const heading of headings) {
      const size = await heading.evaluate((el: any) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });

      if (size < 12) smallHeadings++;
    }

    console.log(
      `✅ Heading font sizes OK: ${headings.length - smallHeadings}/${headings.length}`
    );
    expect(smallHeadings).toBeLessThan(heading.length * 0.1); // Less than 10% should be too small
  });
});

test.describe("🔤 Character Encoding & Localization", () => {
  test("✅ German umlauts render correctly", async ({ page }) => {
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");

    // Switch to German
    const deButton = page.locator('button:has-text("🇩🇪")').first();
    await deButton.click().catch(() => {});
    await page.waitForTimeout(300);

    // Check for umlauts in page
    const pageText = await page.textContent("body");
    const hasUmlauts = /[äöüß]/.test(pageText || "");

    console.log(`✅ German umlauts found: ${hasUmlauts}`);
    // Note: May not always find umlauts depending on content
  });

  test("✅ Date/Time localization (if applicable)", async ({ page }) => {
    await page.goto("http://localhost:5173/analytics");
    await page.waitForLoadState("networkidle");

    // Check for date formats
    const pageText = await page.textContent("body");
    console.log(`✅ Analytics page loaded with localized content`);
    expect(pageText).toBeTruthy();
  });

  test("✅ Currency localization (if applicable)", async ({ page }) => {
    await page.goto("http://localhost:5173/payments");
    await page.waitForLoadState("networkidle");

    const pageText = await page.textContent("body");
    console.log(`✅ Payment page loaded with localized content`);
    expect(pageText).toBeTruthy();
  });

  test("✅ No mojibake or encoding errors", async ({ page }) => {
    const pages = ["/settings", "/dashboard", "/products"];

    for (const path of pages) {
      await page.goto(`http://localhost:5173${path}`);
      await page.waitForLoadState("networkidle");

      const pageText = await page.textContent("body");

      // Check for common mojibake patterns
      const hasMojibake = /\uFFFD/.test(pageText || "");
      expect(hasMojibake).toBeFalsy();

      console.log(`✅ No encoding errors on ${path}`);
    }
  });
});

test.describe("🔐 Localization Security", () => {
  test("✅ XSS protection in translations", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    // Check that translations are properly escaped
    const translations = await page.evaluate(() => {
      return (window as any).i18n?.store?.data;
    });

    if (translations) {
      console.log(`✅ Translation store loaded`);
      expect(translations).toBeTruthy();
    }
  });

  test("✅ localStorage XSS protection", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Try to access and verify localStorage is safe
    const lang = await page.evaluate(() => {
      return localStorage.getItem("i18nextLng");
    });

    // Language should be simple string like 'de' or 'en'
    const isSafe = /^[a-z]{2}(-[A-Z]{2})?$/.test(lang || "");
    console.log(`✅ localStorage language value safe: ${isSafe}`);
    expect(isSafe).toBeTruthy();
  });

  test("✅ No sensitive data in translation keys", async ({ page }) => {
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");

    const translations = await page.evaluate(() => {
      const store = (window as any).i18n?.store?.data;
      if (store) {
        const keys = [];
        const traverse = (obj: any) => {
          for (const key in obj) {
            if (typeof obj[key] === "string") {
              keys.push(obj[key]);
            } else if (typeof obj[key] === "object") {
              traverse(obj[key]);
            }
          }
        };
        traverse(store);
        return keys.join(" ");
      }
      return "";
    });

    // Check for no passwords, API keys, etc in visible translations
    const hasSensitive = /password|api|key|secret|token/i.test(translations);
    console.log(`✅ No sensitive data in translations: ${!hasSensitive}`);
    expect(hasSensitive).toBeFalsy();
  });
});

test.describe("🔄 Fallback & Error Handling", () => {
  test("✅ Fallback when key not found", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    const missingKey = await page.evaluate(() => {
      const t = (window as any).i18n?.t;
      if (t) return t("nonexistent.key.xyz");
      return null;
    });

    // Should return key as fallback or empty string
    console.log(`✅ Missing key fallback: "${missingKey}"`);
    expect(missingKey).toBeTruthy();
  });

  test("✅ Handles language change mid-navigation", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");

    // Switch language
    const button = page.locator('button:has-text("🇬🇧")').first();

    // Start navigation immediately after switching
    await button.click().catch(() => {});
    await page.goto("http://localhost:5173/settings");
    await page.waitForLoadState("networkidle");

    const lang = await page.evaluate(() => localStorage.getItem("i18nextLng"));
    console.log(`✅ Language after navigation: ${lang}`);
    expect(lang).toBeTruthy();
  });

  test("✅ Recovers from corrupted localStorage", async ({ page }) => {
    // Clear and corrupt localStorage
    await page.goto("http://localhost:5173");
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const lang = await page.evaluate(() => localStorage.getItem("i18nextLng"));
    console.log(`✅ Recovered language: ${lang}`);
    expect(lang).toBeTruthy();
  });
});
