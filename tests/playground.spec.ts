import { compressToEncodedURIComponent } from "lz-string";
import { test, expect } from "@playwright/test";

test("execution can be interrupted and a later run succeeds", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator(".cm-content");
  await editor.fill('console.log("started"); while (true) {}');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText("started", { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Stopped");
  await editor.fill("const answer = 42;");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText("Finished with no output.", { exact: true })).toBeVisible();
});

test("semantic type errors navigate back to code on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".cm-content").fill('const count: number = "wrong";\nconsole.log(count);');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const problem = page.getByRole("button", { name: /Line 1:7.*not assignable/ });
  await expect(problem).toBeVisible({ timeout: 15000 });
  await problem.click();
  await expect(page.locator(".cm-content")).toBeFocused();
  await expect(page.locator(".cm-content .cm-lintRange-error")).not.toHaveCount(0);
  await page.screenshot({ animations: "disabled", path: "/tmp/playground-diagnostics-mobile.png" });
});

test("runtime errors map back to the original TypeScript line", async ({ page }) => {
  await page.goto("/");
  await page.locator(".cm-content").fill('const x: number = 1;\nthrow new Error("failure");');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByRole("button", { name: /Line 2:/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("status")).toContainText("Failed");
});

test("console preserves structured values, warnings, and copy/clear actions", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.locator(".cm-content").fill('console.warn("careful"); console.log({ answer: 42, nested: [1, 2] });');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(page.getByText("careful", { exact: true })).toBeVisible();
  await page.getByText("Object · Expand", { exact: true }).click();
  await expect(page.getByText("answer:", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Copy output", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByText("Output cleared.", { exact: true })).toBeVisible();
  await page.screenshot({ animations: "disabled", path: "/tmp/playground-console-desktop.png" });
});

test("incoming output does not steal the scroll position", async ({ page }) => {
  await page.goto("/");
  await page.locator(".cm-content").fill('for(let i=0;i<100;i++) console.log("line",i); setInterval(()=>console.log("new output"),200);');
  await page.getByRole("button", { name: "Run", exact: true }).click();
  const scroll = page.locator("[data-console-scroll]");
  await expect(page.getByText("99", { exact: true })).toBeVisible();
  await scroll.hover();
  await page.mouse.wheel(0, -10000);
  await expect(page.getByRole("button", { name: "Latest", exact: true })).toBeVisible();
  const top = await scroll.evaluate(element => element.scrollTop);
  expect(top).toBeLessThan(100);
  await page.getByRole("button", { name: "Latest", exact: true }).click();
  await expect(page.getByRole("button", { name: "Latest", exact: true })).not.toBeVisible();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
});

test("new and shared snippets preserve the previous draft", async ({ page }) => {
  await page.goto("/");
  await page.locator(".cm-content").fill('console.log("my draft");');
  await page.getByRole("button", { name: "Snippets", exact: true }).click();
  await page.getByRole("button", { name: "New snippet", exact: true }).click();
  await expect(page.locator(".cm-content")).toHaveText("");
  await expect(page).not.toHaveURL(/code=/);
  await page.getByRole("button", { name: "Snippets", exact: true }).click();
  await page.getByRole("button", { name: /console.log\("my draft"\)/ }).click();
  await expect(page.locator(".cm-content")).toContainText('"my draft"');
  await page.reload();
  await expect(page.locator(".cm-content")).toContainText('"my draft"');
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.screenshot({ animations: "disabled", path: "/tmp/playground-snippets-mobile.png" });
});


test("snapshot links import copies, preserve drafts, and leave edits local", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.locator(".cm-content").fill('console.log("original draft");');
  const shared = 'console.log("shared copy");';
  await page.goto(`/?code=${compressToEncodedURIComponent(shared)}`);
  await expect(page.locator(".cm-content")).toHaveText(shared);
  await expect(page).not.toHaveURL(/code=/);
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await page.locator(".cm-content").fill('console.log("edited copy");');
  await page.reload();
  await expect(page.locator(".cm-content")).toContainText("edited copy");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.getByRole("button", { name: "Copy snapshot link", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Snippets", exact: true }).click();
  await expect(page.getByRole("button", { name: /console.log\("original draft"\)/ })).toBeVisible();
});

test("large snapshots offer a file instead of an unreliable link", async ({ page }) => {
  await page.goto("/");
  await page.locator(".cm-content").fill("// " + Array.from({ length: 2500 }, (_, i) => (i * 2654435761).toString(36)).join(" "));
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download TypeScript", exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download TypeScript", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("playground.ts");
});

test("shortcut help reflects registered commands and console toggles preserve editing", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator(".cm-content");
  await editor.fill('console.log("keyboard");');
  await page.getByRole("button", { name: "Shortcuts", exact: true }).click();
  await expect(page.getByText("Run / Stop", { exact: true })).toBeVisible();
  await expect(page.getByText("Toggle console", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await editor.press("Control+`");
  await expect(page.getByRole("button", { name: "Console", exact: true })).toHaveAttribute("aria-expanded", "false");
  await editor.press("Meta+j");
  await expect(page.getByRole("region", { name: "Console", exact: true })).toBeFocused();
  await page.keyboard.press("Meta+j");
  await expect(editor).toBeFocused();
  await editor.press("Alt+Enter");
  await expect(page.getByText("keyboard", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByText("Keyboard shortcuts", { exact: true })).toBeVisible();
  await page.screenshot({ animations: "disabled", path: "/tmp/playground-shortcuts-mobile.png" });
});

test("mobile editing keys preserve the insertion point across console switches", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const editor = page.locator(".cm-content");
  await editor.fill("");
  await page.getByRole("button", { name: "Keys", exact: true }).click();
  await page.getByRole("button", { name: "Insert braces", exact: true }).click();
  await expect(editor).toHaveText("{}");
  await page.keyboard.type("x");
  await expect(editor).toHaveText("{x}");
  await page.getByRole("button", { name: "Console", exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await editor.press("y");
  await expect(editor).toHaveText("{xy}");
  await page.setViewportSize({ width: 320, height: 350 });
  await expect.poll(() => page.locator("main").evaluate(element => Math.round(element.getBoundingClientRect().height))).toBe(350);
  const keys = await page.getByRole("group", { name: "Editing keys", exact: true }).boundingBox();
  expect(keys!.y + keys!.height).toBeLessThanOrEqual(351);
  await page.screenshot({ animations: "disabled", path: "/tmp/playground-keyboard-short-viewport.png" });
});

test("switching mobile views preserves editor scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto("/");
  await page.locator(".cm-content").fill(Array.from({ length: 150 }, (_, i) => `// line ${i}`).join("\n"));
  const scroll = page.locator(".cm-scroller");
  await page.evaluate(() => document.fonts.ready);
  await scroll.evaluate(element => { element.scrollTop = 1200; });
  let previousTop = -1;
  await expect.poll(async () => {
    const top = await scroll.evaluate(element => element.scrollTop);
    const stable = top === previousTop; previousTop = top; return stable;
  }).toBe(true);
  const before = await scroll.evaluate(element => element.scrollTop);
  await page.getByRole("button", { name: "Console", exact: true }).click();
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await expect.poll(async () => Math.abs(await scroll.evaluate(element => element.scrollTop) - before)).toBeLessThan(2);
});

for (const width of [320, 390, 768, 1280]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`responsive layout ${width}px ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/");
      await expect(page.locator(".cm-content")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();
      if (width < 1024) {
        await page.getByRole("button", { name: "Keys", exact: true }).click();
        await expect(page.getByRole("button", { name: "Insert braces", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "More", exact: true }).click();
        await expect(page.getByRole("button", { name: "Format code", exact: true })).toBeVisible();
        await page.keyboard.press("Escape");
      }
      await page.screenshot({ animations: "disabled", path: `/tmp/playground-final-${width}-${colorScheme}.png` });
    });
  }
}

test("empty and invalid snapshot links do not resurrect or erase a local draft", async ({ page }) => {
  await page.goto("/");
  await page.locator(".cm-content").fill('console.log("keep me");');
  await page.goto("/?code=!");
  await expect(page.locator(".cm-content")).toContainText("keep me");
  await expect(page.getByText("This snapshot link is invalid. Your local draft is unchanged.", { exact: true })).toBeVisible();
  await page.goto(`/?code=${compressToEncodedURIComponent("")}`);
  await expect(page.locator(".cm-content")).toHaveText("");
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await page.getByRole("button", { name: "Snippets", exact: true }).click();
  await expect(page.getByRole("button", { name: /console.log\("keep me"\)/ })).toBeVisible();
});

test("array member completions filter and accept with Tab", async ({ page }) => {
  await page.goto("/");
  const editor = page.locator(".cm-content");
  await editor.fill("const numbers = [1, 2, 3];\nnumbers");
  await editor.pressSequentially(".");
  const list = page.getByRole("listbox");
  await expect(list.getByRole("option", { name: "map", exact: true })).toBeVisible({ timeout: 15000 });
  await expect(list.getByRole("option", { name: "filter", exact: true })).toBeVisible();
  await expect(list.getByRole("option", { name: "reduce", exact: true })).toBeAttached();
  await editor.pressSequentially("ma");
  await expect(list.getByRole("option", { name: "map", exact: true })).toBeVisible();
  await editor.press("Tab");
  await expect(editor).toContainText("numbers.map");
  await expect(list).not.toBeVisible();
  await editor.press("Control+z");
  await expect(editor).toContainText("numbers.ma");
  await editor.press("Escape");
  await editor.press("Control+Space");
  await expect(list.getByRole("option", { name: "map", exact: true })).toBeVisible();
});

test("completions respect inferred types and user-defined members on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  const editor = page.locator(".cm-content");
  await editor.fill('const greeting = "hello";\ngreeting');
  await editor.pressSequentially(".toU");
  await expect(page.getByRole("option", { name: "toUpperCase", exact: true })).toBeVisible({ timeout: 15000 });
  await editor.press("Enter");
  await expect(editor).toContainText("greeting.toUpperCase");
  await editor.fill('const user: { name: string; age: number } = { name: "Ada", age: 36 };\nuser');
  await editor.pressSequentially(".");
  await expect(page.getByRole("option", { name: "name", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: "age", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "name", exact: true }).click();
  await expect(editor).toContainText("user.name");
  await expect(page.getByRole("listbox")).not.toBeVisible();
  await editor.fill("const numbers = [1, 2, 3];\nnumbers");
  await editor.pressSequentially(".");
  await expect(page.getByRole("option", { name: "map", exact: true })).toBeVisible();
  await page.screenshot({ animations: "disabled", path: "/tmp/playground-completions-mobile.png" });
  await editor.press("Escape");
  await expect(page.getByRole("listbox")).not.toBeVisible();
});
