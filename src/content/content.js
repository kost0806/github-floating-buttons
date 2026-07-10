/**
 * GitHub Floating Buttons — 콘텐트 스크립트.
 * 우측 하단에 설정된 버튼을 렌더링하고 동작을 처리한다.
 * constants.js 가 먼저 로드되어 globalThis.GFB 를 제공한다.
 */
(function () {
  "use strict";

  const GFB = globalThis.GFB;
  if (!GFB) return;

  const CONTAINER_ID = "gfb-container";
  const TOAST_ID = "gfb-toast";
  const CONFIRM_ID = "gfb-confirm";

  // GitHub 의 레포가 아닌 예약된 1단계 경로들 (pr-list 판별용)
  const RESERVED_OWNERS = new Set([
    "settings",
    "notifications",
    "marketplace",
    "explore",
    "topics",
    "trending",
    "collections",
    "events",
    "sponsors",
    "about",
    "pulls",
    "issues",
    "new",
    "organizations",
    "dashboard",
    "search",
    "apps",
    "codespaces"
  ]);

  let toastTimer = null;

  /* ----------------------------- 토스트 ----------------------------- */
  function showToast(message) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    // 강제 리플로우 후 클래스 토글 (애니메이션)
    void toast.offsetWidth;
    toast.classList.add("gfb-toast-show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("gfb-toast-show");
    }, 2600);
  }

  /* ------------------------- 커스텀 confirm ------------------------- */
  function showCustomConfirm(anchorEl, message) {
    return new Promise((resolve) => {
      const existing = document.getElementById(CONFIRM_ID);
      if (existing) existing.remove();

      const box = document.createElement("div");
      box.id = CONFIRM_ID;
      box.setAttribute("role", "dialog");

      const msg = document.createElement("p");
      msg.className = "gfb-confirm-msg";
      msg.textContent = message;

      const actions = document.createElement("div");
      actions.className = "gfb-confirm-actions";

      const okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.className = "gfb-confirm-ok";
      okBtn.textContent = GFB.t("confirmOk");

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "gfb-confirm-cancel";
      cancelBtn.textContent = GFB.t("confirmCancel");

      actions.appendChild(cancelBtn);
      actions.appendChild(okBtn);
      box.appendChild(msg);
      box.appendChild(actions);
      document.body.appendChild(box);

      // 버튼 왼쪽에 위치
      const rect = anchorEl.getBoundingClientRect();
      box.style.right = `${window.innerWidth - rect.left + 10}px`;
      box.style.top = `${rect.top + rect.height / 2}px`;

      function done(result) {
        document.removeEventListener("click", outsideClick, true);
        box.remove();
        resolve(result);
      }

      okBtn.addEventListener("click", () => done(true));
      cancelBtn.addEventListener("click", () => done(false));

      function outsideClick(e) {
        if (!box.contains(e.target) && e.target !== anchorEl) {
          done(false);
        }
      }
      setTimeout(() => document.addEventListener("click", outsideClick, true), 0);
    });
  }

  /* --------------------------- 경로 유틸 --------------------------- */
  function getRepoContext() {
    const m = location.pathname.match(/^\/([^/]+)\/([^/]+)/);
    if (!m) return null;
    const owner = m[1];
    if (RESERVED_OWNERS.has(owner.toLowerCase())) return null;
    return { owner, repo: m[2] };
  }

  function getPullContext() {
    const m = location.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!m) return null;
    return { owner: m[1], repo: m[2], number: m[3] };
  }

  function isFilesTab() {
    return /\/pull\/\d+\/files\/?$/.test(location.pathname);
  }

  /* --------------------------- 동작 핸들러 --------------------------- */
  function actionPrList() {
    const ctx = getRepoContext();
    if (!ctx) {
      showToast(GFB.t("toastRepoOnly"));
      return;
    }
    location.assign(`${location.origin}/${ctx.owner}/${ctx.repo}/pulls`);
  }

  function actionScrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function actionScrollBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  async function actionReviewApprove() {
    const pull = getPullContext();
    if (!pull) {
      showToast(GFB.t("toastPrOnly"));
      return;
    }
    if (!isFilesTab()) {
      // Files 탭으로 이동 후, 로드되면 자동으로 리뷰 동작을 재개한다.
      try {
        sessionStorage.setItem(GFB.SESSION_PENDING_KEY, "1");
      } catch (e) {
        /* sessionStorage 비활성 시 무시 */
      }
      location.assign(
        `${location.origin}/${pull.owner}/${pull.repo}/pull/${pull.number}/files`
      );
      return;
    }
    await performReview();
  }

  /** 셀렉터 후보가 나타날 때까지 폴링. timeout 내 못 찾으면 null. */
  function waitFor(selectors, timeout) {
    const deadline = Date.now() + (timeout || 4000);
    return new Promise((resolve) => {
      const tick = () => {
        const el = GFB.queryFirst(selectors);
        if (el) return resolve(el);
        if (Date.now() > deadline) return resolve(null);
        setTimeout(tick, 120);
      };
      tick();
    });
  }

  /** Files 탭에서 리뷰 팝오버를 열고, 설정에 따라 Approve/제출까지 수행. */
  async function performReview() {
    const settings = await GFB.getSettings();

    // 1. 리뷰 팝오버 열기
    const reviewBtn = await waitFor(GFB.SELECTORS.reviewButton, 6000);
    if (!reviewBtn) {
      showToast(GFB.t("toastReviewBtnNotFound"));
      return;
    }
    // <details>/<summary> 형태면 부모 details 를 열고, 아니면 클릭.
    const details = reviewBtn.closest("details");
    if (details && !details.open) {
      reviewBtn.click();
    } else if (!details) {
      reviewBtn.click();
    }

    // 2. Approve 라디오 선택
    const approveRadio = await waitFor(GFB.SELECTORS.approveRadio, 4000);
    if (!approveRadio) {
      showToast(GFB.t("toastApproveRadioNotFound"));
      return;
    }
    approveRadio.checked = true;
    approveRadio.dispatchEvent(new Event("change", { bubbles: true }));

    if (settings.reviewAction !== "approve") {
      // 리뷰창만 열기 모드: 사용자가 직접 제출하도록 둔다.
      return;
    }

    // 3. 자동 approve: 코멘트 입력 후 제출
    const body = GFB.queryFirst(GFB.SELECTORS.reviewBody);
    const comment = GFB.pickRandom(settings.approveComments);
    if (body && comment) {
      body.value = comment;
      body.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const submit = GFB.queryFirst(GFB.SELECTORS.submitButton);
    if (!submit) {
      showToast(GFB.t("toastSubmitNotFound"));
      return;
    }
    submit.disabled = false;
    submit.click();
    showToast(GFB.t("toastApproveSubmitted"));
  }

  /** Files 탭 진입 시 보류 중인 리뷰 동작을 재개. */
  async function checkPendingReview() {
    let pending = false;
    try {
      pending = sessionStorage.getItem(GFB.SESSION_PENDING_KEY) === "1";
    } catch (e) {
      /* ignore */
    }
    if (!pending) return;
    if (!isFilesTab()) return;
    try {
      sessionStorage.removeItem(GFB.SESSION_PENDING_KEY);
    } catch (e) {
      /* ignore */
    }
    await performReview();
  }

  /** PR 페이지에서 병합 전략을 선택하고 Merge 버튼을 클릭한다. */
  async function actionMerge(strategySelectors, labelKey, anchorEl) {
    const pull = getPullContext();
    if (!pull) {
      showToast(GFB.t("toastPrOnly"));
      return;
    }

    const label = GFB.t(labelKey);
    const confirmed = await showCustomConfirm(anchorEl, GFB.t("confirmMerge")(label));
    if (!confirmed) return;

    // 전략 드롭다운이 있으면 먼저 열고 전략 옵션 선택
    const strategyDropdown = GFB.queryFirst(GFB.SELECTORS.mergeStrategyDropdown);
    if (strategyDropdown) {
      const details = strategyDropdown.closest("details");
      if (details && !details.open) strategyDropdown.click();

      const strategyOption = await waitFor(strategySelectors, 2000);
      if (!strategyOption) {
        showToast(GFB.t("toastMergeStrategyNotFound"));
        return;
      }
      strategyOption.click();
      await new Promise((r) => setTimeout(r, 400));
    } else {
      // 드롭다운 없이 전략 버튼이 독립적으로 노출될 경우
      const strategyOption = GFB.queryFirst(strategySelectors);
      if (strategyOption) {
        strategyOption.click();
        await new Promise((r) => setTimeout(r, 300));
      }
      // 전략 옵션이 없어도 현재 전략이 이미 맞을 수 있으므로 계속 진행
    }

    // 첫 번째 클릭: 확인 폼(commit message) 열기
    const primaryBtn = await waitFor(GFB.SELECTORS.mergeButton, 3000);
    if (!primaryBtn) {
      showToast(GFB.t("toastMergeBtnNotFound"));
      return;
    }
    if (primaryBtn.disabled) {
      showToast(GFB.t("toastMergeNotReady"));
      return;
    }
    primaryBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // 두 번째 클릭: 실제 병합 완료 (같은 버튼이 confirming 상태로 바뀐 것)
    const confirmBtn = await waitFor(GFB.SELECTORS.mergeButton, 3000);
    if (!confirmBtn) {
      showToast(GFB.t("toastMergeBtnNotFound"));
      return;
    }
    if (confirmBtn.disabled) {
      showToast(GFB.t("toastMergeNotReady"));
      return;
    }
    confirmBtn.click();
    showToast(GFB.t("toastMergeRequested"));
  }

  function actionMergeCommit(anchorEl) {
    return actionMerge(GFB.SELECTORS.mergeCommitOption, "btnMergeCommit", anchorEl);
  }

  function actionSquashMerge(anchorEl) {
    return actionMerge(GFB.SELECTORS.squashMergeOption, "btnSquashMerge", anchorEl);
  }

  const ACTIONS = {
    "pr-list": actionPrList,
    "scroll-top": actionScrollTop,
    "scroll-bottom": actionScrollBottom,
    "review-approve": actionReviewApprove,
    "merge-commit": actionMergeCommit,
    "squash-merge": actionSquashMerge
  };

  /* ----------------------------- 렌더링 ----------------------------- */
  function buttonDef(id) {
    return GFB.BUTTONS.find((b) => b.id === id);
  }

  function makeBtn(def) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.gfbId = def.id;
    btn.dataset.label = def.label;
    btn.setAttribute("aria-label", def.label);
    btn.innerHTML = def.icon;
    btn.addEventListener("click", () => {
      const fn = ACTIONS[def.id];
      if (fn) fn(btn);
    });
    return btn;
  }

  function render(settings) {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();

    const enabled = settings.buttons
      .filter((b) => b.enabled)
      .sort((a, b) => a.order - b.order);

    if (enabled.length === 0) return;
    if (!document.body) return;

    const container = document.createElement("div");
    container.id = CONTAINER_ID;

    // 그룹 멤버를 미리 수집 (순서 무관하게 같은 group끼리 묶음)
    const groupDefs = new Map(); // group → [def, ...]
    for (const item of enabled) {
      const def = buttonDef(item.id);
      if (!def || !def.group) continue;
      if (!groupDefs.has(def.group)) groupDefs.set(def.group, []);
      groupDefs.get(def.group).push(def);
    }

    const renderedGroups = new Set();

    for (const item of enabled) {
      const def = buttonDef(item.id);
      if (!def) continue;

      if (def.group) {
        if (renderedGroups.has(def.group)) continue; // 이미 렌더링됨
        renderedGroups.add(def.group);
        const groupItems = groupDefs.get(def.group);

        if (groupItems.length === 1) {
          const btn = makeBtn(groupItems[0]);
          btn.className = "gfb-btn";
          container.appendChild(btn);
        } else {
          const group = document.createElement("div");
          group.className = "gfb-btn-group";
          group.setAttribute("role", "group");
          groupItems.forEach((gDef, idx) => {
            if (idx > 0) {
              const divider = document.createElement("div");
              divider.className = "gfb-btn-group-divider";
              group.appendChild(divider);
            }
            const btn = makeBtn(gDef);
            btn.className = "gfb-group-btn";
            group.appendChild(btn);
          });
          container.appendChild(group);
        }
      } else {
        const btn = makeBtn(def);
        btn.className = "gfb-btn";
        container.appendChild(btn);
      }
    }

    document.body.appendChild(container);
  }

  async function rerender() {
    const settings = await GFB.getSettings();
    GFB.setLang(settings.language);
    render(settings);
  }

  /* ------------------------------ 초기화 ----------------------------- */
  async function init() {
    await rerender();
    await checkPendingReview();
  }

  // 설정 변경 시 즉시 반영
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[GFB.STORAGE_KEY]) {
      rerender();
    }
  });

  // GitHub SPA(Turbo/pjax) 네비게이션 대응: 컨테이너 유지 및 보류 리뷰 재개
  ["turbo:load", "turbo:render", "pjax:end"].forEach((evt) => {
    document.addEventListener(evt, () => {
      rerender();
      checkPendingReview();
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
