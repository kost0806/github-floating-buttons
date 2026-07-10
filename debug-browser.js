const { chromium } = require("playwright");

async function run() {
  const PROXY = process.env.HTTPS_PROXY || "http://127.0.0.1:42781";
  console.log("Proxy:", PROXY);

  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    headless: true,
    proxy: { server: PROXY },
    args: ["--ignore-certificate-errors", "--no-sandbox"]
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    console.log("Navigating to example.com...");
    const resp = await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 15000 });
    console.log("Status:", resp?.status());
    console.log("URL:", page.url());
    console.log("Title:", await page.title());
  } catch(e) {
    console.error("example.com failed:", e.message);
  }

  try {
    console.log("\nNavigating to github.com...");
    const resp = await page.goto("https://github.com", { waitUntil: "domcontentloaded", timeout: 15000 });
    console.log("Status:", resp?.status());
    console.log("URL:", page.url());
    console.log("Title:", await page.title());
    const html = await page.content();
    console.log("HTML snippet:", html.slice(0, 500));
  } catch(e) {
    console.error("github.com failed:", e.message);
  }

  await browser.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
