// Screenshots at 375/768/1440 + console error count (run: node tests/screens.mjs, needs server on 3311)
import { chromium } from "@playwright/test";
const b = await chromium.launch();
const out = [];
for (const w of [375, 768, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: w === 375 ? 812 : 1000 } });
  let errs = 0; p.on("console", (m) => m.type() === "error" && errs++); p.on("pageerror", () => errs++);
  for (const [name, path] of [["home", "/"], ["indicator", "/indicators/disposable-income/"], ["region", "/regions/guangdong/"]]) {
    await p.goto("http://127.0.0.1:3311" + path); await p.waitForTimeout(600);
    await p.screenshot({ path: `../docs/screenshots/${name}-${w}.png`, fullPage: name !== "indicator" ? false : false });
  }
  out.push(`${w}px console errors: ${errs}`); await p.close();
}
console.log(out.join("\n")); await b.close();
