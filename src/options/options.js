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
      handle.title = "드래그해서 순서 변경";
      li.appendChild(handle);

      // 체크박스
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.enabled;
      checkbox.addEventListener("change", async () => {
        item.enabled = checkbox.checked;
        await persist();
        showStatus("저장됨");
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
      up.title = "위로";
      up.disabled = index === 0;
      up.addEventListener("click", () => moveButton(item.id, -1));
      const down = document.createElement("button");
      down.type = "button";
      down.textContent = "↓";
      down.title = "아래로";
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
    showStatus("저장됨");
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
      showStatus("저장됨");
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
          showStatus("저장됨");
        };
      });

    const comment = $("#approve-comment");
    comment.value = state.approveComment || "";
    let debounce = null;
    comment.addEventListener("input", () => {
      state.approveComment = comment.value;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(async () => {
        await persist();
        showStatus("저장됨");
      }, 400);
    });

    toggleCommentRow();
  }

  function toggleCommentRow() {
    const row = $("#approve-comment-row");
    row.classList.toggle("hidden", state.reviewAction !== "approve");
  }

  /* --------------------------- Enterprise 호스트 --------------------------- */
  function renderHosts() {
    const list = $("#host-list");
    list.innerHTML = "";
    if (!state.enterpriseHosts.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "등록된 호스트가 없어요.";
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
      remove.textContent = "삭제";
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
      showStatus("올바른 호스트가 아니에요 (예: github.mycompany.com)");
      return;
    }
    if (state.enterpriseHosts.includes(host)) {
      showStatus("이미 등록된 호스트예요.");
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
      showStatus("권한이 거부되어 호스트를 추가하지 못했어요.");
      return;
    }

    state.enterpriseHosts.push(host);
    await persist();
    input.value = "";
    renderHosts();
    notifyBackgroundSync();
    showStatus(`${host} 추가됨`);
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
    showStatus(`${host} 삭제됨`);
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

  /* ------------------------------ 초기화 ----------------------------- */
  async function init() {
    state = await GFB.getSettings();
    renderButtonList();
    renderReviewAction();
    renderHosts();

    $("#host-add-btn").addEventListener("click", addHost);
    $("#host-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") addHost();
    });
  }

  init();
})();
