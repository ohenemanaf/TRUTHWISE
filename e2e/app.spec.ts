import { expect, test, type Page } from "@playwright/test";
import { allLessons } from "../src/content/modules";
import { MISTAKES } from "../src/content/mistakes";

/** Fail the test on any uncaught error or console error. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

const notationRadio = (page: Page, name: RegExp) =>
  page.getByRole("radiogroup", { name: "Notation" }).first().getByRole("radio", { name });

const ROUTES = [
  "/",
  "/teach",
  "/experiment",
  "/mistakes",
  "/cheat-codes",
  ...allLessons().map(({ lesson }) => `/teach/${lesson.slug}`),
  ...MISTAKES.map((m) => `/mistakes/${m.slug}`),
];

test.describe("every page", () => {
  for (const route of ROUTES) {
    test(`${route} renders cleanly with no sideways scroll`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});

test("home: the notation toggle rewrites the same table", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("region", { name: "AND truth table demo" });
  await notationRadio(page, /^Code/).click();
  await expect(demo.getByText("A && B").first()).toBeVisible();
  await expect(demo.getByRole("cell", { name: "true" }).first()).toBeVisible();
  await notationRadio(page, /^T \/ F/).click();
  await expect(demo.getByText("A ∧ B").first()).toBeVisible();
});

test("notation toggle works from the keyboard", async ({ page }) => {
  await page.goto("/experiment");
  const tf = notationRadio(page, /^T \/ F/);
  await expect(tf).toHaveAttribute("aria-checked", "true");
  await tf.focus();
  await page.keyboard.press("ArrowRight");
  await expect(notationRadio(page, /^Gates/)).toHaveAttribute("aria-checked", "true");
});

test.describe("experiment", () => {
  test("simplifies a tangled code condition step by step", async ({ page }) => {
    await page.goto("/experiment");
    const input = page.getByLabel("Expression");
    await input.fill("!(!a || !b)");
    await expect(page.getByText("De Morgan's laws").first()).toBeVisible();
    await expect(page.getByText("Simplest form", { exact: true }).locator("..")).toContainText("a ∧ b");
  });

  test("points at the problem in a broken expression", async ({ page }) => {
    await page.goto("/experiment");
    await page.getByLabel("Expression").fill("A ∧");
    // (Next.js adds its own empty route-announcer alert, so match ours by text.)
    await expect(page.getByRole("alert").filter({ hasText: "ends too early" })).toBeVisible();
  });

  test("code view runs the picked row", async ({ page }) => {
    await page.goto("/experiment");
    await page.getByLabel("Expression").fill("A AND NOT B");
    await notationRadio(page, /^Code/).click();
    // Rows in 00, 01, 10, 11 order. Row 3 is A = true, B = false.
    await page.locator("tbody tr").nth(2).click();
    await expect(page.getByText("so the block runs")).toBeVisible();
    await page.locator("tbody tr").nth(0).click();
    await expect(page.getByText("so the block is skipped")).toBeVisible();
  });

  test("gate view draws the circuit", async ({ page }) => {
    await page.goto("/experiment");
    await page.getByLabel("Expression").fill("A NAND B");
    await notationRadio(page, /^Gates/).click();
    await expect(page.getByRole("img", { name: "Logic gate circuit" })).toBeVisible();
    await expect(page.getByText("It's a single NAND gate.")).toBeVisible();
  });

  test("row order flips and is remembered", async ({ page }) => {
    await page.goto("/experiment");
    const firstCell = page.locator("tbody tr").first().locator("td").first();
    await expect(firstCell).toHaveText("F");
    await page.getByRole("radio", { name: "TT first" }).first().click();
    await expect(firstCell).toHaveText("T");
    await page.reload();
    await expect(page.locator("tbody tr").first().locator("td").first()).toHaveText("T");
  });
});

test("teach: solving every exercise completes the lesson and progress survives a reload", async ({ page }) => {
  await page.goto("/teach/what-is-a-truth-table");
  // Exercise 1: how many rows for three inputs?
  await page.getByRole("radio", { name: /8$/ }).click();
  await expect(page.getByText("2 × 2 × 2")).toBeVisible();
  // Exercise 2: NOT A. Row 1 (A = F) should be T, row 2 (A = T) should be F.
  await page.getByRole("button", { name: /Row 1 output/ }).click(); // blank → T
  await page.getByRole("button", { name: /Row 2 output/ }).click(); // blank → T
  await page.getByRole("button", { name: /Row 2 output/ }).click(); // T → F
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("Every row is right")).toBeVisible();
  await expect(page.getByText("Lesson complete")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Lesson complete")).toBeVisible();
  await page.goto("/teach");
  await expect(page.getByText(/^1 of 17 lessons/)).toBeVisible();
});

test("teach: a wrong table is flagged, not accepted", async ({ page }) => {
  await page.goto("/teach/what-is-a-truth-table");
  await page.getByRole("button", { name: /Row 1 output/ }).click(); // T (right)
  await page.getByRole("button", { name: /Row 2 output/ }).click(); // T (wrong)
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("1 row isn't right yet")).toBeVisible();
});

test("validity: affirming the consequent is caught with a counterexample", async ({ page }) => {
  await page.goto("/teach/fallacies");
  await page.getByRole("button", { name: "Invalid" }).first().click();
  await expect(page.getByText("Right. The table below shows why.")).toBeVisible();
  await expect(page.getByText(/^Invalid\./).first()).toBeVisible();
});

test("mistakes: studying one marks it in the list", async ({ page }) => {
  await page.goto(`/mistakes/${MISTAKES[1].slug}`);
  await expect(page.getByText("Not equivalent.").first()).toBeVisible();
  await page.goto("/mistakes");
  await expect(page.getByText("Studied")).toHaveCount(1);
});

test("cheat codes: search by symbol or name", async ({ page }) => {
  await page.goto("/cheat-codes");
  const search = page.getByRole("searchbox", { name: "Search the cheat codes" });
  await search.fill("nand");
  await expect(page.getByRole("rowheader", { name: /Not-and/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Identity" })).toHaveCount(0);
  await search.fill("modus");
  await expect(page.getByRole("heading", { name: "Modus ponens" })).toBeVisible();
  await search.fill("zzzz");
  await expect(page.getByText(/Nothing matches/)).toBeVisible();
});

test("dark mode follows the system setting", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(15, 20, 32)");
});
