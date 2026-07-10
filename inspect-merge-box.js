/**
 * GitHub merge box DOM 검사 스크립트
 * 실행: node inspect-merge-box.js
 *
 * PR #3 에서 merge 버튼 영역 HTML과 셀렉터를 출력한다.
 */

const { chromium } = require("playwright");

const PR_URL = "https://github.com/kost0806/github-floating-buttons/pull/3";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = "kost0806";

// 현재 constants.js 의 셀렉터 목록 (검증 대상)
const SELECTORS_TO_TEST = {
  mergeStrategyDropdown: [
    ".merge-pr-select summary",
    'summary[data-target="merge-box.strategyButton"]',
    ".js-merge-commit-selector summary"
  ],
  mergeCommitOption: [
    'button[data-merge-type="merge_commit"]',
    'button[data-merge-type="merge"]',
    'button[value="merge"]'
  ],
  squashMergeOption: [
    'button[data-merge-type="squash"]',
    'button[value="squash"]'
  ],
  mergeButton: [
    "button.js-merge-commit-button",
    'button[data-target="merge-box.primaryCommitButton"]',
    'button[type="submit"].js-merge-commit-button'
  ]
};

async function run() {
  const PROXY = process.env.HTTPS_PROXY || "http://127.0.0.1:42781";
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors",
      `--proxy-server=${PROXY}`
    ]
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  const page = await context.newPage();

  // ── 1. GitHub 로그인 (token as password) ──────────────────────────────────
  console.log("\n[1] GitHub 로그인 시도...");
  await page.goto("https://github.com/login", { waitUntil: "domcontentloaded" });

  await page.fill("#login_field", USERNAME);
  await page.fill("#password", GITHUB_TOKEN);
  await page.click('[name="commit"]');
  await page.waitForLoadState("domcontentloaded");

  const afterLoginUrl = page.url();
  const isLoggedIn =
    !afterLoginUrl.includes("/login") && !afterLoginUrl.includes("/sessions");
  console.log(`   URL after login: ${afterLoginUrl}`);
  console.log(`   로그인 성공: ${isLoggedIn}`);

  if (!isLoggedIn) {
    console.log("\n⚠  로그인 실패 — 공개 접근 가능한 정보만 수집합니다.\n");
  }

  // ── 2. PR 페이지 이동 ──────────────────────────────────────────────────────
  console.log(`\n[2] PR 페이지 이동: ${PR_URL}`);
  await page.goto(PR_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // ── 3. merge box 영역 HTML 덤프 ───────────────────────────────────────────
  console.log("\n[3] Merge box 영역 HTML 덤프");
  console.log("=".repeat(70));

  const mergeBoxHtml = await page.evaluate(() => {
    const candidates = [
      document.querySelector("merge-box"),
      document.querySelector(".merge-pr"),
      document.querySelector('[data-target="merge-box.container"]'),
      document.querySelector("#partial-pull-merging"),
      document.querySelector(".js-merge-pr"),
      // 최신 GitHub에서 자주 쓰이는 컨테이너
      document.querySelector('div[data-view-component="true"] .merge-pr-section'),
      document.querySelector(".discussion-timeline-actions")
    ];
    const el = candidates.find(Boolean);
    if (!el) return null;
    // innerHTML이 너무 길 수 있으므로 3000자로 자름
    return el.outerHTML.slice(0, 3000);
  });

  if (mergeBoxHtml) {
    console.log(mergeBoxHtml);
  } else {
    console.log("  (merge box 컨테이너를 찾지 못했습니다 — 아래 버튼 검색 결과 참고)");
  }
  console.log("=".repeat(70));

  // ── 4. 기존 셀렉터 유효성 검사 ───────────────────────────────────────────
  console.log("\n[4] 현재 constants.js 셀렉터 히트 여부");
  console.log("-".repeat(70));

  for (const [group, selectors] of Object.entries(SELECTORS_TO_TEST)) {
    console.log(`\n▸ ${group}`);
    for (const sel of selectors) {
      const result = await page.evaluate((s) => {
        const els = document.querySelectorAll(s);
        if (els.length === 0) return null;
        return Array.from(els).map((el) => ({
          tag: el.tagName,
          text: el.textContent.trim().slice(0, 60),
          class: el.className.slice(0, 80),
          dataTarget: el.getAttribute("data-target") || "",
          dataMergeType: el.getAttribute("data-merge-type") || "",
          type: el.getAttribute("type") || "",
          disabled: el.disabled,
          hidden: el.hidden || el.style.display === "none"
        }));
      }, sel);

      if (result) {
        console.log(`   ✅ "${sel}" → ${result.length}개 매칭`);
        result.forEach((r, i) =>
          console.log(
            `      [${i}] <${r.tag}> text="${r.text}" class="${r.class}" ` +
            `data-target="${r.dataTarget}" data-merge-type="${r.dataMergeType}" ` +
            `type="${r.type}" disabled=${r.disabled} hidden=${r.hidden}`
          )
        );
      } else {
        console.log(`   ❌ "${sel}" → 매칭 없음`);
      }
    }
  }

  // ── 5. merge 관련 모든 버튼 탐색 ─────────────────────────────────────────
  console.log("\n\n[5] 페이지 내 merge 관련 전체 버튼 덤프");
  console.log("-".repeat(70));

  const allMergeBtns = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons
      .filter((b) => {
        const t = (b.textContent || "").toLowerCase();
        const cls = (b.className || "").toLowerCase();
        const dt = (b.getAttribute("data-target") || "").toLowerCase();
        const dm = (b.getAttribute("data-merge-type") || "").toLowerCase();
        return (
          t.includes("merge") ||
          t.includes("squash") ||
          t.includes("rebase") ||
          t.includes("confirm") ||
          cls.includes("merge") ||
          dt.includes("merge") ||
          dm.length > 0
        );
      })
      .map((b) => ({
        tag: "button",
        text: b.textContent.trim().slice(0, 80),
        class: b.className.slice(0, 100),
        id: b.id || "",
        dataTarget: b.getAttribute("data-target") || "",
        dataMergeType: b.getAttribute("data-merge-type") || "",
        dataValue: b.getAttribute("value") || "",
        type: b.getAttribute("type") || "",
        disabled: b.disabled,
        hidden: b.hidden || b.style.display === "none",
        ariaLabel: b.getAttribute("aria-label") || ""
      }));
  });

  if (allMergeBtns.length === 0) {
    console.log("  (merge 관련 버튼을 찾지 못했습니다 — 로그인이 필요할 수 있음)");
  } else {
    allMergeBtns.forEach((b, i) => {
      console.log(`\n  [${i}] text="${b.text}"`);
      console.log(`       class="${b.class}"`);
      console.log(`       id="${b.id}" type="${b.type}"`);
      console.log(`       data-target="${b.dataTarget}"`);
      console.log(`       data-merge-type="${b.dataMergeType}"`);
      console.log(`       value="${b.dataValue}" aria-label="${b.ariaLabel}"`);
      console.log(`       disabled=${b.disabled} hidden=${b.hidden}`);
    });
  }

  // ── 6. summary 요소 탐색 (드롭다운 후보) ─────────────────────────────────
  console.log("\n\n[6] merge 관련 <summary> 요소");
  console.log("-".repeat(70));

  const summaries = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("summary"))
      .filter((s) => {
        const t = (s.textContent || "").toLowerCase();
        const cls = (s.className || "").toLowerCase();
        const dt = (s.getAttribute("data-target") || "").toLowerCase();
        return t.includes("merge") || cls.includes("merge") || dt.includes("merge");
      })
      .map((s) => ({
        text: s.textContent.trim().slice(0, 80),
        class: s.className.slice(0, 100),
        dataTarget: s.getAttribute("data-target") || "",
        ariaLabel: s.getAttribute("aria-label") || ""
      }));
  });

  if (summaries.length === 0) {
    console.log("  (merge 관련 <summary>를 찾지 못했습니다)");
  } else {
    summaries.forEach((s, i) => {
      console.log(`\n  [${i}] text="${s.text}"`);
      console.log(`       class="${s.class}"`);
      console.log(`       data-target="${s.dataTarget}"`);
      console.log(`       aria-label="${s.ariaLabel}"`);
    });
  }

  // ── 7. 스크린샷 저장 ──────────────────────────────────────────────────────
  await page.screenshot({ path: "/tmp/pr-merge-box.png", fullPage: false });
  console.log("\n\n[7] 스크린샷 저장 → /tmp/pr-merge-box.png");

  await browser.close();
  console.log("\n완료.\n");
}

run().catch((e) => {
  console.error("오류:", e.message);
  process.exit(1);
});
