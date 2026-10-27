// Smoke test: opens the built app, walks the main flows with the keyboard, and
// saves a screenshot of each step. Run with `bun run smoke` (it builds first).
// It uses a throwaway data folder, so your own Collections are never touched.
//
//   node tools/smoke/run.mjs [screenshot folder]
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import electronPath from "electron";
import { _electron as electron } from "playwright-core";

const screenshots = resolve(process.argv[2] ?? "out/smoke");
await mkdir(screenshots, { recursive: true });
const userData = await mkdtemp(join(tmpdir(), "book-smoke-"));
const problems = [];

// BOOK_EXECUTABLE runs a packaged build instead, such as dist/win-unpacked/Book.exe.
const packaged = process.env.BOOK_EXECUTABLE;
const app = await electron.launch({
  executablePath: packaged ?? String(electronPath),
  args: packaged ? [] : ["."],
  env: { ...process.env, BOOK_USER_DATA_DIR: userData },
});

try {
  const page = await app.firstWindow();
  page.on("pageerror", (error) =>
    problems.push(`page error: ${error.message}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      problems.push(`console error: ${message.text()}`);
  });

  const shot = async (name) => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(screenshots, `${name}.png`) });
    console.log(`saved ${name}.png`);
  };
  const step = async (name, action) => {
    try {
      await action();
    } catch (error) {
      problems.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  await step("library list", async () => {
    await page.waitForSelector('[role="option"]', { timeout: 30_000 });
    await page.waitForTimeout(1200);
    await shot("1-library");
  });

  await step("move and quick preview", async () => {
    for (let i = 0; i < 6; i += 1) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await page.waitForSelector('[aria-label="Quick preview"]');
    await shot("2-quick-preview");
    await page.keyboard.press("ArrowRight");
    await shot("2b-quick-preview-next-style");
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      return element
        ? `${element.tagName} ${element.getAttribute("role") ?? ""} ${element.getAttribute("aria-label") ?? ""}`
        : "none";
    });
    if (!focused.includes("listbox"))
      problems.push(`focus left the list: ${focused}`);
    if (await page.$('[aria-label="Quick preview"]'))
      problems.push("Quick preview stayed open");
  });

  await step("specimen", async () => {
    await page.keyboard.press("Enter");
    await page.waitForSelector("textarea", { timeout: 10_000 });
    await shot("3-specimen");
    await page.click('button[aria-label="Show Inspector"]');
    await shot("4-inspector");
  });

  await step("favorite and back", async () => {
    await page.click('button[aria-label="Add to Favorites"]');
    await page.keyboard.press("Escape");
    await page.waitForSelector('[role="listbox"]');
    await page.click('nav[aria-label="Library"] button:has-text("Favorites")');
    await page.waitForSelector('[role="option"]');
    await shot("5-favorites");
  });

  await step("search and classification", async () => {
    await page.click('nav[aria-label="Library"] button:has-text("All")');
    await page.fill('input[aria-label="Search"]', "mono");
    await page.waitForTimeout(300);
    await shot("6-search");
  });

  await step("collections", async () => {
    await page.fill('input[aria-label="Search"]', "");
    await page.click('button[aria-label="New Collection"]');
    await page.fill('input[aria-label="New Collection name"]', "Poster");
    await page.keyboard.press("Enter");
    await page.waitForSelector(
      'nav button[aria-current="page"]:has-text("Poster")',
    );
    await page.click('nav[aria-label="Library"] button:has-text("All")');
    await page.waitForSelector('[role="option"]');
    await page.keyboard.press("Enter");
    await page.waitForSelector("textarea");
    await page.click('button[aria-label="Add to Collection"]');
    await page.check('label:has-text("Poster") input[type="checkbox"]');
    await page.keyboard.press("Escape");
    await page.click('nav button:has-text("Poster")');
    await page.waitForSelector('[role="option"]');
    await shot("7-collection");
  });

  await step("variable Axes", async () => {
    await page.click('nav[aria-label="Library"] button:has-text("All")');
    await page.fill('input[aria-label="Search"]', "superfamily variable");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.waitForSelector("textarea");
    if (!(await page.$('aside[aria-label="Inspector"]'))) {
      await page.click('button[aria-label="Show Inspector"]');
    }
    await page.waitForSelector('aside h2:has-text("Axes")', { timeout: 5_000 });
    await shot("8-axes");
  });

  await step("classification filter", async () => {
    await page.keyboard.press("Escape");
    await page.fill('input[aria-label="Search"]', "");
    await page.click('button[aria-label="Classification"]');
    // Library rows are options too; the Select's item reads exactly "Serif" plus its count.
    await page.locator('[role="option"]', { hasText: /^Serif\s*\d+$/ }).click();
    await page.waitForTimeout(300);
    await shot("9-serif");
  });

  await step("dark theme", async () => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.keyboard.press("Escape");
    await page.click('nav[aria-label="Library"] button:has-text("All")');
    await page.waitForSelector('[role="option"]');
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await shot("10-dark");
  });
} finally {
  await app.close();
  await rm(userData, { recursive: true, force: true });
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("\nSmoke test passed.");
