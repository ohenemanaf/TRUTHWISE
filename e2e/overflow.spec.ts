import { expect, test, type Page } from "@playwright/test";
import { allLessons } from "../src/content/modules";
import { MISTAKES } from "../src/content/mistakes";

/**
 * No text may spill out of, or be cut off by, its box.
 *
 * Page-level sideways scrolling is covered in app.spec.ts; this goes deeper.
 * On every page, at phone, tablet and desktop widths, in the notation with the
 * shortest text (T/F) and the longest (Code), it expands every row-by-row
 * table and every validity answer, then looks for text that:
 *   - is clipped by an `overflow: hidden` box,
 *   - sticks out past the edge of the screen, or
 *   - spills past the edge of the card it sits in.
 * Text inside deliberate horizontal scrollers (wide tables) is allowed.
 */

const ROUTES = [
  "/",
  "/teach",
  "/experiment",
  "/mistakes",
  "/cheat-codes",
  ...allLessons().map(({ lesson }) => `/teach/${lesson.slug}`),
  ...MISTAKES.map((m) => `/mistakes/${m.slug}`),
];
const WIDTHS = [360, 768, 1024, 1280];
const NOTATIONS = ["tf", "code"] as const;

/** Runs inside the page. Returns one line per overflowing piece of text. */
function findOverflow(): string[] {
  const issues: string[] = [];
  const vw = document.documentElement.clientWidth;
  const label = (el: Element) => {
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 3).join(".");
    return `<${el.tagName.toLowerCase()}${cls ? ` .${cls}` : ""}>`;
  };
  const text = (el: Element) => (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const scrollsSideways = (el: Element) => ["auto", "scroll"].includes(getComputedStyle(el).overflowX);
  const insideScroller = (el: Element) => {
    for (let p = el.parentElement; p; p = p.parentElement) if (scrollsSideways(p)) return true;
    return false;
  };

  for (const el of document.querySelectorAll<HTMLElement>("body *")) {
    if (el.closest("svg") || el.closest(".sr-only")) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());

    if ((style.overflowX === "hidden" || style.overflowX === "clip") && el.scrollWidth > el.clientWidth + 1 && text(el)) {
      issues.push(`clipped by ${el.scrollWidth - el.clientWidth}px: ${label(el)} "${text(el)}"`);
    }
    if (!ownText || insideScroller(el)) continue;
    if (box.right > vw + 1 || box.left < -1) {
      issues.push(`off screen (right edge ${Math.round(box.right)} > ${vw}): ${label(el)} "${text(el)}"`);
    }
    const card = el.parentElement?.closest("section, article, aside, [class*='rounded-xl'], [class*='rounded-2xl']");
    if (card) {
      const c = card.getBoundingClientRect();
      const spill = Math.max(box.right - c.right, c.left - box.left);
      if (spill > 1) issues.push(`spills ${Math.round(spill)}px out of ${label(card)}: ${label(el)} "${text(el)}"`);
    }
  }
  return [...new Set(issues)];
}

async function expandEverything(page: Page) {
  // "Fill all" disappears once its table is full, so keep clicking the first one left.
  const fillAll = page.getByRole("button", { name: "Fill all" });
  while ((await fillAll.count()) > 0) await fillAll.first().click();
  for (const button of await page.getByRole("button", { name: "Valid", exact: true }).all()) await button.click();
}

test.describe("no text overflows its box", () => {
  for (const notation of NOTATIONS) {
    for (const width of WIDTHS) {
      test(`${notation} notation at ${width}px`, async ({ page }, info) => {
        // Widths are set explicitly here, so running once (in the desktop project) is enough.
        test.skip(info.project.name !== "desktop", "runs once, at explicit widths");
        test.setTimeout(180_000);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.addInitScript((n) => {
          localStorage.setItem("truthwise-progress", JSON.stringify({ state: { notation: n }, version: 1 }));
        }, notation);

        const problems: string[] = [];
        for (const route of ROUTES) {
          await page.goto(route);
          await page.getByRole("heading", { level: 1 }).waitFor();
          await expandEverything(page);
          await page.waitForTimeout(250);
          for (const issue of await page.evaluate(findOverflow)) problems.push(`${route}  ${issue}`);
        }
        expect(problems, problems.join("\n")).toEqual([]);
      });
    }
  }
});
