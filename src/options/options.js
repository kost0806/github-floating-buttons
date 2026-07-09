/**
 * GitHub Floating Buttons — 옵션 페이지 로직.
 * constants.js 가 먼저 로드되어 window.GFB 를 제공한다 (classic script).
 */
(function () {
  "use strict";

  const GFB = window.GFB;
  let state = null; // 현재 설정 작업본

  const $ = (sel) => document.querySelector(sel);

  /* ----------------------------- 상태 표시 ----------------------------- */
  let statusTimer = null;
  function showStatus(msg) {
    const el = $("#status");
    el.textContent = msg;
    el.classList.add("show");
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }

  async function persist() {
    await GFB.saveSettings(state);
  }

  /* ----------------------------- 버튼 목록 ----------------------------- */
  function sortedButtons() {
    return state.buttons.slice().sort((a, b) => a.order - b.order);
  }

  function reindexOrder(orderedIds) {
    orderedIds.forEach((id, i) => {
      const b = state.buttons.find((x) => x.id === id);
      if (b) b.order = i;
    });
  }

  function buttonLabel(id) {
    const def = GFB.BUTTONS.find((b) => b.id === id);
    return def ? def.label : id;
  }

  function renderButtonList() {
    const list = $("#button-list");
    list.innerHTML = "";
    const ordered = sortedButtons();

    ordered.forEach((item, index) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.id = item.id;

      // 드래그 핸들
      const handle = document.createElement("span");
      handle.className = "drag-handle";
      handle.textContent = "⠿";
      handle.title = GFB.t("dragTitle");
      li.appendChild(handle);

      // 체크박스
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.enabled;
      checkbox.addEventListener("change", async () => {
        item.enabled = checkbox.checked;
        await persist();
        showStatus(GFB.t("saved"));
      });
      li.appendChild(checkbox);

      // 라벨
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = buttonLabel(item.id);
      li.appendChild(label);

      // ↑/↓ 버튼
      const orderBtns = document.createElement("span");
      orderBtns.className = "order-btns";
      const up = document.createElement("button");
      up.type = "button";
      up.textContent = "↑";
      up.title = GFB.t("up");
      up.disabled = index === 0;
      up.addEventListener("click", () => moveButton(item.id, -1));
      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "↓";
      down.title = GFB.t("down");
      down.disabled = index === ordered.length - 1;
      down.addEventListener("click", () => moveButton(item.id, 1));
      orderBtns.appendChild(up);
      orderBtns.appendChild(down);
      li.appendChild(orderBtns);

      attachDnD(li);
      list.appendChild(li);
    });
  }

  async function moveButton(id, delta) {
    const ids = sortedButtons().map((b) => b.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    reindexOrder(ids);
    await persist();
    renderButtonList();
    showStatus(GFB.t("saved"));
  }

  /* 드래그 앤 드롭 */
  let dragId = null;
  function attachDnD(li) {
    li.addEventListener("dragstart", (e) => {
      dragId = li.dataset.id;
      li.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      document
        .querySelectorAll("#button-list li.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    });
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      li.classList.add("drag-over");
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", async (e) => {
      e.preventDefault();
      li.classList.remove("drag-over");
      const targetId = li.dataset.id;
      if (!dragId || dragId === targetId) return;
      const ids = sortedButtons().map((b) => b.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      reindexOrder(ids);
      dragId = null;
      await persist();
      renderButtonList();
      showStatus(GFB.t("saved"));
    });
  }

  /* --------------------------- 리뷰 동작 --------------------------- */
  function renderReviewAction() {
    document
      .querySelectorAll('input[name="reviewAction"]')
      .forEach((radio) => {
        radio.checked = radio.value === state.reviewAction;
        radio.onchange = async () => {
          if (!radio.checked) return;
          state.reviewAction = radio.value;
          toggleCommentRow();
          await persist();
          showStatus(GFB.t("saved"));
        };
      });

    renderApproveComments();
    toggleCommentRow();
  }

  function toggleCommentRow() {
    const row = $("#approve-comment-row");
    row.classList.toggle("hidden", state.reviewAction !== "approve");
  }

  /* ------------------------- Approve 메시지 목록 ------------------------ */
  let commentDebounce = null;
  function debouncedPersist() {
    if (commentDebounce) clearTimeout(commentDebounce);
    commentDebounce = setTimeout(async () => {
      await persist();
      showStatus(GFB.t("saved"));
    }, 400);
  }

  function renderApproveComments() {
    const list = $("#approve-comment-list");
    list.innerHTML = "";
    if (!state.approveComments.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = GFB.t("noMessages");
      list.appendChild(empty);
      return;
    }
    state.approveComments.forEach((comment, index) => {
      const li = document.createElement("li");

      const input = document.createElement("input");
      input.type = "text";
      input.value = comment;
      input.maxLength = 500;
      input.addEventListener("input", () => {
        state.approveComments[index] = input.value;
        debouncedPersist();
      });
      li.appendChild(input);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = GFB.t("removeBtn");
      remove.addEventListener("click", async () => {
        if (state.approveComments.length <= 1) {
          showStatus(GFB.t("minOneMessage"));
          return;
        }
        state.approveComments.splice(index, 1);
        await persist();
        renderApproveComments();
        showStatus(GFB.t("deleted"));
      });
      li.appendChild(remove);

      list.appendChild(li);
    });
  }

  async function addApproveComment() {
    const input = $("#approve-comment-input");
    const value = input.value.trim();
    if (!value) {
      showStatus(GFB.t("enterMessage"));
      return;
    }
    state.approveComments.push(value);
    await persist();
    input.value = "";
    renderApproveComments();
    showStatus(GFB.t("added"));
  }

  /* --------------------------- Enterprise 호스트 --------------------------- */
  function renderHosts() {
    const list = $("#host-list");
    list.innerHTML = "";
    if (!state.enterpriseHosts.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = GFB.t("noHosts");
      list.appendChild(empty);
      return;
    }
    state.enterpriseHosts.forEach((host) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = host;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = GFB.t("removeBtn");
      remove.addEventListener("click", () => removeHost(host));
      li.appendChild(name);
      li.appendChild(remove);
      list.appendChild(li);
    });
  }

  async function addHost() {
    const input = $("#host-input");
    const host = GFB.normalizeHost(input.value);
    if (!host) {
      showStatus(GFB.t("invalidHost"));
      return;
    }
    if (state.enterpriseHosts.includes(host)) {
      showStatus(GFB.t("hostAlreadyAdded"));
      return;
    }

    // 사용자 제스처(클릭) 컨텍스트에서 권한 요청
    const granted = await new Promise((resolve) => {
      chrome.permissions.request(
        { origins: [GFB.originPatternForHost(host)] },
        (ok) => resolve(ok)
      );
    });
    if (!granted) {
      showStatus(GFB.t("permissionDenied"));
      return;
    }

    state.enterpriseHosts.push(host);
    await persist();
    input.value = "";
    renderHosts();
    notifyBackgroundSync();
    showStatus(GFB.t("hostAdded")(host));
  }

  async function removeHost(host) {
    state.enterpriseHosts = state.enterpriseHosts.filter((h) => h !== host);
    await persist();
    // 권한 회수 (실패해도 무시)
    chrome.permissions.remove(
      { origins: [GFB.originPatternForHost(host)] },
      () => {}
    );
    renderHosts();
    notifyBackgroundSync();
    showStatus(GFB.t("hostRemoved")(host));
  }

  function notifyBackgroundSync() {
    try {
      chrome.runtime.sendMessage({ type: "gfb:sync-registrations" }, () => {
        // 응답 무시; lastError 접근으로 콘솔 경고 방지
        void chrome.runtime.lastError;
      });
    } catch (e) {
      /* ignore */
    }
  }

  /* ------------------------------ i18n 적용 ----------------------------- */
  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const val = GFB.t(key);
      if (typeof val === "string") el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.dataset.i18nHtml;
      const val = GFB.t(key);
      if (typeof val === "string") el.innerHTML = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      const val = GFB.t(key);
      if (typeof val === "string") el.placeholder = val;
    });
    document.title = GFB.t("pageTitle");
    document.documentElement.lang = GFB.isKorean() ? "ko" : "en";
  }

  /* --------------------------- 언어 선택 --------------------------- */
  function renderLanguage() {
    const sel = $("#language-select");
    sel.value = state.language;
    sel.onchange = async () => {
      state.language = sel.value;
      GFB.setLang(state.language);
      await persist();
      // 언어가 바뀌면 UI 전체를 다시 그린다.
      applyI18n();
      renderButtonList();
      renderReviewAction();
      renderHosts();
      renderLanguage();
      showStatus(GFB.t("saved"));
    };
  }

  /* ------------------------------ 초기화 ----------------------------- */
  async function init() {
    state = await GFB.getSettings();
    GFB.setLang(state.language);
    applyI18n();
    renderButtonList();
    renderReviewAction();
    renderHosts();
    renderLanguage();

    $("#host-add-btn").addEventListener("click", addHost);
    $("#host-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") addHost();
    });

    $("#approve-comment-add-btn").addEventListener("click", addApproveComment);
    $("#approve-comment-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") addApproveComment();
    });
  }

  init();
})();
