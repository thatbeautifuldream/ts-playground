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
  await page.screenshot({ path: "/tmp/playground-diagnostics-mobile.png" });
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
  await page.screenshot({ path: "/tmp/playground-console-desktop.png" });
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
