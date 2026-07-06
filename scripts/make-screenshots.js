"use strict";
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const OUT_DIR = path.join(__dirname, "..", "store-assets");

// --- SVG icons (from constants.js) ---
const ICONS = {
  prList: `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M2.5 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM2.5 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm0 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM6 4.25A.75.75 0 0 1 6.75 3.5h7a.75.75 0 0 1 0 1.5h-7A.75.75 0 0 1 6 4.25Zm0 3.75A.75.75 0 0 1 6.75 7.25h7a.75.75 0 0 1 0 1.5h-7A.75.75 0 0 1 6 8Zm0 3.75a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Z"/></svg>`,
  scrollTop: `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.22 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L8 6.81l-3.72 3.72a.75.75 0 0 1-1.06 0Z"/></svg>`,
  scrollBottom: `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12.78 5.47a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.53a.75.75 0 0 1 1.06-1.06L8 9.19l3.72-3.72a.75.75 0 0 1 1.06 0Z"/></svg>`,
  review: `<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>`,
};

// Inline styles from content.css for the floating button container
const GFB_STYLE = `
  #gfb-container {
    position: fixed; right: 24px; bottom: 24px;
    z-index: 9999; display: flex; flex-direction: column;
    gap: 10px; align-items: flex-end;
  }
  #gfb-container .gfb-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; padding: 0;
    border: 1px solid rgba(27,31,36,0.15); border-radius: 50%;
    background-color: #fff; color: #24292f; cursor: pointer;
    box-shadow: 0 1px 3px rgba(27,31,36,0.12), 0 8px 24px rgba(66,74,83,0.12);
    position: relative;
  }
  #gfb-container .gfb-btn svg { display: block; }
  #gfb-container .gfb-btn-group {
    display: flex; flex-direction: column; width: 44px;
    border-radius: 22px; border: 1px solid rgba(27,31,36,0.15);
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(27,31,36,0.12), 0 8px 24px rgba(66,74,83,0.12);
    overflow: hidden;
  }
  #gfb-container .gfb-btn-group-divider {
    height: 1px; background-color: rgba(27,31,36,0.12); margin: 0 8px;
  }
  #gfb-container .gfb-group-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; padding: 0; border: none;
    background: transparent; color: #24292f; cursor: pointer; position: relative;
  }
  #gfb-container .gfb-group-btn svg { display: block; }

  /* tooltip shown on the PR-list button */
  .gfb-tooltip-wrap { position: relative; }
  .gfb-tooltip {
    position: absolute; right: calc(100% + 10px); top: 50%;
    transform: translateY(-50%);
    white-space: nowrap; background-color: #24292f; color: #fff;
    font-size: 12px; line-height: 1; padding: 6px 8px;
    border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
`;

// ─── Screenshot 1: GitHub PR Files page ───────────────────────────────────────
function makeGitHubPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Refactor: use async/await in fetchUser by developer · Pull Request #42 · octocat/Hello-World</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:14px;color:#24292f;background:#fff}

/* ── Header ── */
header{background:#24292f;height:56px;display:flex;align-items:center;padding:0 24px;gap:16px;position:sticky;top:0;z-index:100}
.gh-logo{color:#fff;display:flex;align-items:center}
.gh-logo svg{fill:#fff}
.header-link{color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;font-weight:600}
.header-link:hover{color:#fff}
.header-sep{color:rgba(255,255,255,.2)}
.header-spacer{flex:1}
.gh-avatar{width:32px;height:32px;border-radius:50%;background:#586069;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600}

/* ── Sub-nav ── */
.subnav{border-bottom:1px solid #d0d7de;padding:0 24px;display:flex;gap:0;overflow-x:auto;background:#fff}
.subnav-item{display:flex;align-items:center;gap:6px;padding:12px 16px;color:#57606a;text-decoration:none;border-bottom:2px solid transparent;font-size:13px;white-space:nowrap}
.subnav-item.active{color:#24292f;border-bottom-color:#e36209;font-weight:600}
.subnav-item:hover{color:#24292f}
.badge{background:#e1e4e8;border-radius:20px;padding:1px 6px;font-size:11px;font-weight:600}

/* ── Page layout ── */
.page-container{max-width:1280px;margin:0 auto;padding:24px}
.pr-header{margin-bottom:16px}
.pr-title{font-size:22px;font-weight:400;color:#24292f;margin-bottom:8px}
.pr-title strong{font-weight:600}
.pr-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pr-state{background:#2da44e;color:#fff;border-radius:20px;padding:4px 12px;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
.pr-state svg{fill:#fff}
.pr-meta-text{color:#57606a;font-size:14px}
.pr-meta-text a{color:#0969da;text-decoration:none}
.pr-meta-text a:hover{text-decoration:underline}

/* ── Diff toolbar ── */
.diff-toolbar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px 6px 0 0;margin-top:16px}
.diff-stats{font-size:12px;color:#57606a;flex:1}
.diff-stat-add{color:#2da44e;font-weight:600}
.diff-stat-del{color:#cf222e;font-weight:600}

/* ── File diff ── */
.diff-file{border:1px solid #d0d7de;border-radius:6px;margin-bottom:16px;overflow:hidden}
.diff-file-header{background:#f6f8fa;padding:8px 16px;border-bottom:1px solid #d0d7de;display:flex;align-items:center;gap:8px}
.diff-file-name{font-family:"SFMono-Regular",Consolas,monospace;font-size:12px;font-weight:600;color:#24292f}
.diff-file-status{font-size:11px;background:#dafbe1;color:#1a7f37;border-radius:4px;padding:1px 6px;font-weight:500}
table.diff{width:100%;border-collapse:collapse;font-family:"SFMono-Regular",Consolas,monospace;font-size:12px;line-height:1.5}
table.diff td{padding:2px 8px;white-space:pre}
td.line-num{width:1%;color:#8c959f;text-align:right;padding-right:12px;user-select:none;border-right:1px solid #d0d7de}
tr.add td{background:#e6ffec}
tr.add td.line-num{background:#ccffd8;color:#2da44e}
tr.del td{background:#ffebe9}
tr.del td.line-num{background:#ffd7d5;color:#cf222e}
tr.ctx td{background:#fff;color:#57606a}
.diff-sign{width:14px;color:#8c959f;user-select:none}
tr.add .diff-sign{color:#2da44e}
tr.del .diff-sign{color:#cf222e}

/* ── Second file (collapsed) ── */
.diff-file-collapsed .diff-file-header{background:#f6f8fa}
.expand-hint{text-align:center;padding:12px;color:#57606a;font-size:12px;cursor:pointer}
.expand-hint:hover{color:#0969da}

${GFB_STYLE}
</style>
</head>
<body>

<!-- Header -->
<header>
  <a class="gh-logo" href="#" aria-label="GitHub">
    <svg height="32" viewBox="0 0 16 16" width="32">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  </a>
  <a class="header-link" href="#">octocat</a>
  <span class="header-sep">/</span>
  <a class="header-link" href="#">Hello-World</a>
  <div class="header-spacer"></div>
  <div class="gh-avatar">D</div>
</header>

<!-- Sub nav -->
<nav class="subnav">
  <a class="subnav-item" href="#">
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1.5 2.75a.25.25 0 0 1 .25-.25h12.5a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25h-6.5a.75.75 0 0 0-.53.22L4.5 14.44V12.5a.75.75 0 0 0-.75-.75h-2a.25.25 0 0 1-.25-.25v-8.5z"/></svg>
    Conversation
    <span class="badge">3</span>
  </a>
  <a class="subnav-item" href="#">
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/></svg>
    Commits
    <span class="badge">2</span>
  </a>
  <a class="subnav-item" href="#">Checks</a>
  <a class="subnav-item active" href="#">
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
    Files changed
    <span class="badge">2</span>
  </a>
</nav>

<!-- Main content -->
<div class="page-container">

  <!-- PR header -->
  <div class="pr-header">
    <div class="pr-title">
      <strong>Refactor: use async/await in fetchUser</strong>
      <span style="color:#57606a;font-weight:400"> #42</span>
    </div>
    <div class="pr-meta">
      <span class="pr-state">
        <svg viewBox="0 0 16 16" width="14" height="14"><path d="M7.177 3.073 9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM2.25 14a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM11.75 14a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/></svg>
        Open
      </span>
      <span class="pr-meta-text">
        <a href="#">developer</a> wants to merge 2 commits into
        <code style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:4px;padding:1px 5px;font-size:12px">main</code>
        from
        <code style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:4px;padding:1px 5px;font-size:12px">refactor/async-fetch</code>
      </span>
    </div>
  </div>

  <!-- Diff toolbar -->
  <div class="diff-toolbar">
    <span class="diff-stats">
      Showing <strong>2 changed files</strong> with
      <span class="diff-stat-add">+18</span> and
      <span class="diff-stat-del">-11</span> deletions
    </span>
  </div>

  <!-- File 1: fetchUser.js -->
  <div class="diff-file">
    <div class="diff-file-header">
      <span class="diff-file-name">src/api/fetchUser.js</span>
      <span class="diff-file-status">modified</span>
    </div>
    <table class="diff">
      <tbody>
        <tr class="ctx"><td class="line-num">1</td><td class="line-num">1</td><td class="diff-sign"> </td><td>import { API_BASE } from '../config';</td></tr>
        <tr class="ctx"><td class="line-num">2</td><td class="line-num">2</td><td class="diff-sign"> </td><td> </td></tr>
        <tr class="del"><td class="line-num">3</td><td class="line-num"></td><td class="diff-sign">-</td><td>export function fetchUser(id) {</td></tr>
        <tr class="del"><td class="line-num">4</td><td class="line-num"></td><td class="diff-sign">-</td><td>  return fetch(\`\${API_BASE}/users/\${id}\`)</td></tr>
        <tr class="del"><td class="line-num">5</td><td class="line-num"></td><td class="diff-sign">-</td><td>    .then(res =&gt; {</td></tr>
        <tr class="del"><td class="line-num">6</td><td class="line-num"></td><td class="diff-sign">-</td><td>      if (!res.ok) throw new Error(res.status);</td></tr>
        <tr class="del"><td class="line-num">7</td><td class="line-num"></td><td class="diff-sign">-</td><td>      return res.json();</td></tr>
        <tr class="del"><td class="line-num">8</td><td class="line-num"></td><td class="diff-sign">-</td><td>    });</td></tr>
        <tr class="del"><td class="line-num">9</td><td class="line-num"></td><td class="diff-sign">-</td><td>}</td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">3</td><td class="diff-sign">+</td><td>export async function fetchUser(id) {</td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">4</td><td class="diff-sign">+</td><td>  const res = await fetch(\`\${API_BASE}/users/\${id}\`);</td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">5</td><td class="diff-sign">+</td><td>  if (!res.ok) throw new Error(res.status);</td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">6</td><td class="diff-sign">+</td><td>  return res.json();</td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">7</td><td class="diff-sign">+</td><td>}</td></tr>
        <tr class="ctx"><td class="line-num">10</td><td class="line-num">8</td><td class="diff-sign"> </td><td> </td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">9</td><td class="diff-sign">+</td><td>export async function fetchUserList(ids) {</td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">10</td><td class="diff-sign">+</td><td>  return Promise.all(ids.map(fetchUser));</td></tr>
        <tr class="add"><td class="line-num"></td><td class="line-num">11</td><td class="diff-sign">+</td><td>}</td></tr>
      </tbody>
    </table>
  </div>

  <!-- File 2: collapsed -->
  <div class="diff-file diff-file-collapsed">
    <div class="diff-file-header">
      <span class="diff-file-name">src/api/__tests__/fetchUser.test.js</span>
      <span class="diff-file-status">modified</span>
    </div>
    <div class="expand-hint">▶ Click to expand</div>
  </div>

</div><!-- /.page-container -->

<!-- ─── Floating buttons (with tooltip visible on pr-list) ─── -->
<div id="gfb-container">

  <!-- PR list button (tooltip shown) -->
  <div class="gfb-tooltip-wrap">
    <button class="gfb-btn" aria-label="Pull Request 목록으로 가기" type="button">${ICONS.prList}</button>
    <span class="gfb-tooltip">Pull Request 목록으로 가기</span>
  </div>

  <!-- Scroll group pill -->
  <div class="gfb-btn-group" role="group">
    <button class="gfb-group-btn" type="button" aria-label="맨 위로 스크롤">${ICONS.scrollTop}</button>
    <div class="gfb-btn-group-divider"></div>
    <button class="gfb-group-btn" type="button" aria-label="맨 아래로 스크롤">${ICONS.scrollBottom}</button>
  </div>

  <!-- Review button -->
  <button class="gfb-btn" aria-label="현재 PR 리뷰창 열기" type="button">${ICONS.review}</button>

</div>

</body>
</html>`;
}

// ─── Screenshot 2: Options page ───────────────────────────────────────────────
function makeOptionsPage() {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>GitHub Floating Buttons 설정</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:14px;color:#24292f;background:#f6f8fa;min-height:100vh}
.wrap{max-width:680px;margin:0 auto;padding:32px 16px}
h1{font-size:22px;font-weight:600;margin-bottom:4px;color:#24292f}
.sub{color:#57606a;font-size:14px;margin-bottom:24px}

/* ── Cards ── */
.card{background:#fff;border:1px solid #d0d7de;border-radius:8px;padding:20px 24px;margin-bottom:16px}
.card h2{font-size:16px;font-weight:600;margin-bottom:4px}
.hint{color:#57606a;font-size:12px;margin-bottom:14px}

/* ── Button list ── */
.button-list{list-style:none}
.button-list li{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f2f4}
.button-list li:last-child{border-bottom:none}
.drag-handle{color:#8c959f;cursor:grab;font-size:16px;line-height:1}
input[type=checkbox]{width:16px;height:16px;accent-color:#2da44e;cursor:pointer}
.btn-label{flex:1;font-size:14px;color:#24292f}
.btn-icon{color:#57606a;display:flex;align-items:center}
.order-btns{display:flex;flex-direction:column;gap:2px}
.order-btn{background:#f6f8fa;border:1px solid #d0d7de;border-radius:4px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#57606a;font-size:11px;line-height:1}
.order-btn:hover{background:#e1e4e8}

/* ── Radio ── */
.radio{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;cursor:pointer}
.radio input{margin-top:2px;accent-color:#0969da}
.radio span{font-size:14px;color:#24292f}
.radio em{color:#57606a;font-size:13px;font-style:normal}

/* ── Text field ── */
.field{margin-top:12px;padding-top:12px;border-top:1px solid #f0f2f4}
.field label{display:block;font-size:13px;font-weight:500;color:#24292f;margin-bottom:4px}
.field input[type=text]{width:100%;padding:7px 10px;border:1px solid #d0d7de;border-radius:6px;font-size:14px;color:#24292f;background:#fff}
.field input[type=text]:focus{outline:none;border-color:#0969da;box-shadow:0 0 0 3px rgba(9,105,218,.1)}

/* ── Add-host row ── */
.add-host{display:flex;gap:8px;margin-bottom:12px}
.add-host input[type=text]{flex:1;padding:7px 10px;border:1px solid #d0d7de;border-radius:6px;font-size:14px;color:#24292f}
.btn-primary{background:#2da44e;color:#fff;border:none;border-radius:6px;padding:7px 14px;font-size:14px;font-weight:600;cursor:pointer}
.btn-primary:hover{background:#2c974b}

/* ── Host list ── */
.host-list{list-style:none}
.host-list li{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f2f4;font-size:14px;color:#24292f;font-family:"SFMono-Regular",Consolas,monospace}
.host-list li:last-child{border-bottom:none}
.host-list .del-btn{margin-left:auto;background:none;border:1px solid #d0d7de;border-radius:6px;padding:3px 8px;font-size:12px;color:#cf222e;cursor:pointer}
.host-list .del-btn:hover{background:#ffebe9;border-color:#cf222e}

code{background:#f6f8fa;border:1px solid #d0d7de;border-radius:4px;padding:1px 5px;font-size:12px;font-family:"SFMono-Regular",Consolas,monospace}
</style>
</head>
<body>
<div class="wrap">
  <h1>GitHub Floating Buttons</h1>
  <p class="sub">우측 하단 floating 버튼을 켜고 끄거나 순서를 바꾸고, GitHub Enterprise 호스트를 등록할 수 있어요.</p>

  <!-- 버튼 카드 -->
  <div class="card">
    <h2>버튼</h2>
    <p class="hint">체크박스로 켜고 끄고, 드래그(⠿)하거나 ↑/↓로 순서를 바꿔요.</p>
    <ul class="button-list">
      <li>
        <span class="drag-handle">⠿</span>
        <input type="checkbox" checked/>
        <span class="btn-icon">${ICONS.prList}</span>
        <span class="btn-label">Pull Request 목록으로 가기</span>
        <div class="order-btns"><button class="order-btn">↑</button><button class="order-btn">↓</button></div>
      </li>
      <li>
        <span class="drag-handle">⠿</span>
        <input type="checkbox" checked/>
        <span class="btn-icon">${ICONS.scrollTop}</span>
        <span class="btn-label">맨 위로 스크롤</span>
        <div class="order-btns"><button class="order-btn">↑</button><button class="order-btn">↓</button></div>
      </li>
      <li>
        <span class="drag-handle">⠿</span>
        <input type="checkbox" checked/>
        <span class="btn-icon">${ICONS.scrollBottom}</span>
        <span class="btn-label">맨 아래로 스크롤</span>
        <div class="order-btns"><button class="order-btn">↑</button><button class="order-btn">↓</button></div>
      </li>
      <li>
        <span class="drag-handle">⠿</span>
        <input type="checkbox" checked/>
        <span class="btn-icon">${ICONS.review}</span>
        <span class="btn-label">현재 PR 리뷰창 열기</span>
        <div class="order-btns"><button class="order-btn">↑</button><button class="order-btn">↓</button></div>
      </li>
    </ul>
  </div>

  <!-- 리뷰 동작 카드 -->
  <div class="card">
    <h2>리뷰 동작</h2>
    <p class="hint">"현재 PR 리뷰창 열기" 버튼이 어떻게 동작할지 선택해요.</p>
    <label class="radio">
      <input type="radio" name="reviewAction" value="open" checked/>
      <span>리뷰창만 열기 <em>(Approve 선택까지만, 제출은 직접)</em></span>
    </label>
    <label class="radio">
      <input type="radio" name="reviewAction" value="approve"/>
      <span>자동 approve <em>(Approve 선택 + 코멘트 입력 + 제출까지)</em></span>
    </label>
  </div>

  <!-- Enterprise 호스트 카드 -->
  <div class="card">
    <h2>GitHub Enterprise 호스트</h2>
    <p class="hint">예: <code>github.mycompany.com</code> — 추가 시 해당 사이트 접근 권한을 요청해요. github.com 은 기본 지원됩니다.</p>
    <div class="add-host">
      <input type="text" placeholder="github.mycompany.com" value=""/>
      <button class="btn-primary" type="button">추가</button>
    </div>
    <ul class="host-list">
      <li>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="#2da44e"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>
        github.mycompany.com
        <button class="del-btn" type="button">삭제</button>
      </li>
    </ul>
  </div>
</div>
</body>
</html>`;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });

  async function shoot(html, filename, width = 1280, height = 800) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const out = path.join(OUT_DIR, filename);
    await page.screenshot({ path: out });
    await page.close();
    console.log("✓", filename);
  }

  await shoot(makeGitHubPage(), "screenshot-01-pr-page.png");
  await shoot(makeOptionsPage(), "screenshot-02-options.png");

  await browser.close();
  console.log("\nDone →", OUT_DIR);
}

main().catch((err) => { console.error(err); process.exit(1); });
