import { test, expect, Page } from "@playwright/test";
import atlas from "../src/data/atlas.json";

type O = [string, string, number, number, string, string, string, string];
const OBS = atlas.obs as unknown as O[];
const IND = atlas.indicators as { id: string; name: string; years: number[]; n_obs: number; decimals: number; no_national?: boolean }[];
const val = (id: string, r: string, y: number) => OBS.find((o) => o[0] === id && o[1] === r && o[2] === y)?.[3];
const fmt = (v: number, d: number) => v.toLocaleString("zh-CN", { minimumFractionDigits: d, maximumFractionDigits: d });

function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("1. homepage loads with value proposition, search, categories and no console errors", async ({ page }) => {
  const errors = watchConsole(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("官方统计数据");
  await expect(page.getByRole("heading", { name: "按主题浏览" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "值得关注的数据" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "全部数据集" })).toBeVisible();
  for (const c of ["人口与社会", "经济与收入", "教育", "医疗卫生"]) await expect(page.getByRole("heading", { name: c }).first()).toBeVisible();
  // search → province page
  const box = page.locator("#q-main");
  await box.fill("广东");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/regions\/guangdong\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("广东省");
  expect(errors).toEqual([]);
});

test("2. every indicator page loads with sections A–G and no console errors", async ({ page }) => {
  const errors = watchConsole(page);
  for (const ind of IND) {
    await page.goto(`/indicators/${ind.id}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ind.name);
    for (const h of ["关键发现", "省级排名", "历史趋势", "区域比较", "数据浏览与下载", "方法与口径", "数据来源", "推荐引用"])
      await expect(page.getByRole("heading", { name: new RegExp(h) }).first()).toBeAttached();
    await expect(page.getByTestId("rank-table")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("3. year switch updates map, ranking and values", async ({ page }) => {
  await page.goto("/indicators/population/");
  await page.getByTestId("year-select").selectOption("2015");
  await expect(page.getByRole("heading", { name: "地区分布 · 2015" })).toBeVisible();
  const ranked = OBS.filter((o) => o[0] === "population" && o[2] === 2015 && o[1] !== "100000").sort((a, b) => b[3] - a[3]);
  const firstRow = page.getByTestId("rank-table").locator("tbody tr").first();
  await expect(firstRow).toContainText(fmt(ranked[0][3], 0));
  // tile label for Beijing shows 2015 value
  await expect(page.getByTestId("tile-110000")).toHaveAttribute("aria-label", new RegExp(fmt(val("population", "110000", 2015)!, 0)));
});

test("4. province selection drives comparison (chips, tiles, trend)", async ({ page }) => {
  await page.goto("/indicators/disposable-income/");
  await page.getByRole("button", { name: "清空选择" }).click();
  await page.getByTestId("chip-330000").click();
  await page.getByTestId("tile-510000").click();
  await expect(page.getByTestId("selected-summary")).toContainText("浙江");
  await expect(page.getByTestId("selected-summary")).toContainText("四川");
  await expect(page.locator("svg text", { hasText: "浙江" }).first()).toBeAttached(); // trend legend
  await page.getByTestId("chip-330000").click();
  await expect(page.getByTestId("selected-summary")).not.toContainText("浙江");
});

test("5. regional ranking filter", async ({ page }) => {
  await page.goto("/indicators/gdp/");
  await page.getByTestId("rank-filter").selectOption("华东");
  await expect(page.getByTestId("rank-table").locator("tbody tr")).toHaveCount(7);
  await page.getByTestId("rank-filter").selectOption("东北");
  await expect(page.getByTestId("rank-table").locator("tbody tr")).toHaveCount(3);
});

test("6. charts and tables match the published data", async ({ page }) => {
  for (const id of ["population", "gdp", "college-enrolment", "bed-occupancy"]) {
    const ind = IND.find((i) => i.id === id)!;
    const y = ind.years[ind.years.length - 1];
    await page.goto(`/indicators/${id}/`);
    const rows = page.getByTestId("rank-table").locator("tbody tr");
    await expect(rows).toHaveCount(31);
    const expected = OBS.filter((o) => o[0] === id && o[2] === y && o[1] !== "100000").sort((a, b) => b[3] - a[3]);
    for (const k of [0, 15, 30]) await expect(rows.nth(k)).toContainText(fmt(expected[k][3], ind.decimals));
    // bar chart label for the top bar
    await expect(page.locator("svg text", { hasText: fmt(expected[0][3], ind.decimals) }).first()).toBeAttached();
    if (!ind.no_national) await expect(page.getByTestId("stat-latest")).not.toHaveText("—");
  }
  // explorer table equals CSV row for a known cell
  await page.goto("/indicators/disposable-income/");
  await page.getByTestId("explorer-search").fill("上海");
  await expect(page.getByTestId("explorer-table")).toContainText(fmt(val("disposable-income", "310000", 2024)!, 0));
});

test("7. CSV export: full file and filtered download", async ({ page, request }) => {
  for (const ind of IND) {
    const res = await request.get(`/data/${ind.id}.csv`);
    expect(res.status()).toBe(200);
    const lines = (await res.text()).trim().split("\n");
    expect(lines.length - 1).toBe(ind.n_obs);
    expect(lines[0]).toContain("source_url");
  }
  await page.goto("/indicators/urbanization/");
  await page.getByTestId("explorer-search").fill("北京");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("csv-filtered").click()]);
  const path = await dl.path();
  const txt = require("fs").readFileSync(path, "utf8");
  expect(txt).toContain("110000,北京");
  expect(txt.split("\n").filter((l: string) => l.startsWith("urbanization,")).length).toBe(IND.find((i) => i.id === "urbanization")!.years.length);
});

test("8. no-data states are explicit (missing year, empty filter, unknown page)", async ({ page }) => {
  await page.goto("/indicators/birth-rate/");
  await expect(page.getByText("2020年缺失").first()).toBeVisible();
  await expect(page.getByTestId("year-select").locator("option[value='2020']")).toHaveCount(0);
  await page.getByTestId("explorer-search").fill("不存在的地区");
  await expect(page.getByTestId("explorer-empty")).toBeVisible();
  const r = await page.goto("/indicators/not-a-real-indicator/");
  expect(r?.status()).toBe(404);
});

test("9. source links point to official NBS files", async ({ page, request }) => {
  test.setTimeout(120_000); // stats.gov.cn can be slow from overseas
  await page.goto("/indicators/gdp/");
  const hrefs = await page.getByTestId("source-links").locator("a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
  expect(hrefs.length).toBeGreaterThanOrEqual(10);
  for (const h of hrefs) expect(h).toMatch(/^https:\/\/www\.stats\.gov\.cn\/sj\/ndsj\/20\d\d\/html\/[\w-]+\.(jpg|xls)$/);
  // live check of a sample (requires internet)
  for (const h of [hrefs[0], hrefs[hrefs.length - 1]]) {
    const res = await request.get(h, { headers: { "User-Agent": "Mozilla/5.0 (ChinaDataAtlas link check)" }, timeout: 50_000 });
    expect(res.status(), h).toBe(200);
  }
});

test("10. responsive layout: no horizontal overflow; content readable", async ({ page }) => {
  for (const p of ["/", "/indicators/population/", "/regions/zhejiang/", "/explore/", "/methodology/"]) {
    await page.goto(p);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, p).toBeLessThanOrEqual(1);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.goto("/indicators/population/");
  await page.screenshot({ path: `test-results/screens/indicator-${test.info().project.name}.png`, fullPage: false });
  await page.goto("/");
  await page.screenshot({ path: `test-results/screens/home-${test.info().project.name}.png`, fullPage: false });
});

test("11. SEO: main content is in static HTML; three-click path to any province value", async ({ page, request }) => {
  const html = await (await request.get("/indicators/population/")).text();
  expect(html).toContain("<h1");
  expect(html).toContain("常住人口");
  expect(html).toContain("关键发现");
  expect(html).toContain('application/ld+json');
  expect(html).toMatch(/<meta name="description"/);
  expect(html).toMatch(/og:title/);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/indicators/gdp/");
  // home → indicator (1) → explorer search province: value visible (≤3 interactions)
  await page.goto("/");
  await page.getByRole("link", { name: "居民人均可支配收入" }).first().click(); // click 1
  await page.getByTestId("tile-460000").click(); // click 2: select Hainan, value in aria-label
  await expect(page.getByTestId("tile-460000")).toHaveAttribute("aria-label", new RegExp(fmt(val("disposable-income", "460000", 2024)!, 0)));
});
