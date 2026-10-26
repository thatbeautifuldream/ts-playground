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
