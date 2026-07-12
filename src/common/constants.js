/**
 * GitHub Floating Buttons — 공유 상수 및 헬퍼.
 *
 * 이 파일은 빌드 도구 없이 여러 컨텍스트에서 재사용된다:
 *  - 콘텐트 스크립트: manifest content_scripts 의 js 배열에 content.js 보다 먼저 나열되어
 *    동일한 전역 스코프를 공유한다.
 *  - 서비스 워커: importScripts('/src/common/constants.js') 로 로드.
 *  - 옵션 페이지: <script src="../common/constants.js"> 로 로드.
 *
 * 따라서 ES 모듈 export 대신 globalThis.GFB 에 모든 것을 노출한다.
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "settings";

  /** Chrome 메시지 카탈로그에서 현재 UI 언어의 문자열을 반환한다. */
  function t(key, substitutions) {
    return chrome.i18n.getMessage(key, substitutions) || key;
  }
  /** 버튼 레지스트리. id 는 설정/동작 분기의 키로 쓰인다. */
  const BUTTONS = [
    {
      id: "pr-list",
      get label() { return t("btnPrList"); },
      // list / rows icon
      icon:
        '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M2.5 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM2.5 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm0 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM6 4.25A.75.75 0 0 1 6.75 3.5h7a.75.75 0 0 1 0 1.5h-7A.75.75 0 0 1 6 4.25Zm0 3.75A.75.75 0 0 1 6.75 7.25h7a.75.75 0 0 1 0 1.5h-7A.75.75 0 0 1 6 8Zm0 3.75a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Z"/></svg>'
    },
    {
      id: "scroll-top",
      get label() { return t("btnScrollTop"); },
      // chevron up icon
      icon:
        '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3.22 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L8 6.81l-3.72 3.72a.75.75 0 0 1-1.06 0Z"/></svg>',
      group: "scroll"
    },
    {
      id: "scroll-bottom",
      get label() { return t("btnScrollBottom"); },
      // chevron down icon
      icon:
        '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12.78 5.47a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 6.53a.75.75 0 0 1 1.06-1.06L8 9.19l3.72-3.72a.75.75 0 0 1 1.06 0Z"/></svg>',
      group: "scroll"
    },
    {
      id: "review-approve",
      get label() { return t("btnReviewApprove"); },
      // check / approve icon
      icon:
        '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>'
    },
    {
      id: "merge-commit",
      get label() { return t("btnMergeCommit"); },
      defaultEnabled: false,
      // git merge icon
      icon:
        '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z"/></svg>',
      group: "merge"
    },
    {
      id: "squash-merge",
      get label() { return t("btnSquashMerge"); },
      defaultEnabled: false,
      // compress/squash icon
      icon:
        '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8.75 1.75a.75.75 0 0 0-1.5 0v5.19L5.03 4.72a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 6.94V1.75ZM1.75 13a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H1.75Z"/></svg>',
      group: "merge"
    }
  ];

  /** 기본 설정값. 저장된 설정과 머지되어 하위호환을 유지한다. */
  const DEFAULT_SETTINGS = {
    buttons: BUTTONS.map((b, i) => ({ id: b.id, enabled: b.defaultEnabled !== false, order: i })),
    reviewAction: "open", // "open" | "approve"
    approveComments: ["LGTM 👍"], // 자동 approve 시 랜덤으로 선택될 메시지 목록
    enterpriseHosts: [] // ["github.mycompany.com", ...]
  };

  /** GitHub DOM 셀렉터. 사이트 변경에 대비해 후보를 여러 개 둔다. */
  const SELECTORS = {
    reviewButton: [
      ".js-reviews-container summary",
      "button.js-reviews-toggle",
      'summary[aria-label="Review changes"]',
      'button[aria-label="Review changes"]'
    ],
    approveRadio: [
      'input[name="pull_request_review[event]"][value="approve"]',
      'input[type="radio"][value="approve"]'
    ],
    reviewBody: [
      ".js-reviews-container textarea",
      'textarea[name="pull_request_review[body]"]',
      "#pull_request_review_body"
    ],
    submitButton: [
      ".js-reviews-container button[type=submit]",
      'button[type="submit"].js-reviews-submit-button'
    ],
    mergeStrategyDropdown: [
      'button[data-component="IconButton"][aria-haspopup="true"][data-variant="primary"]',
      ".merge-pr-select summary",
      'summary[data-target="merge-box.strategyButton"]',
      ".js-merge-commit-selector summary",
      ".js-merge-method-menu-button"
    ],
    mergeCommitOption: [
      '[role="menuitemradio"][aria-keyshortcuts="c"]',
      'button[data-merge-type="merge_commit"]',
      'button[data-merge-type="merge"]',
      'button[value="merge"]'
    ],
    squashMergeOption: [
      '[role="menuitemradio"][aria-keyshortcuts="s"]',
      'button[data-merge-type="squash"]',
      'button[value="squash"]'
    ],
    mergeButton: [
      "button.js-merge-commit-button",
      'button[data-target="merge-box.primaryCommitButton"]',
      'button[type="submit"].js-merge-commit-button',
      "button.btn-group-merge",
      "button.btn-group-squash",
      "button.btn-group-rebase",
      'button[data-component="Button"][data-variant="primary"]'
    ]
  };

  const SESSION_PENDING_KEY = "gfb:pendingReview";

  /** 설정을 읽어 기본값과 깊지 않게 머지한다. buttons 배열은 id 기준으로 보정. */
  function mergeSettings(stored) {
    const s = Object.assign({}, DEFAULT_SETTINGS, stored || {});
    const storedButtons = Array.isArray(stored && stored.buttons)
      ? stored.buttons
      : [];
    const byId = new Map(storedButtons.map((b) => [b.id, b]));
    // 알려진 버튼만, 저장된 enabled/order 를 존중하되 새 버튼은 기본값으로 추가.
    s.buttons = BUTTONS.map((def, i) => {
      const prev = byId.get(def.id);
      return {
        id: def.id,
        enabled: prev ? prev.enabled !== false : (def.defaultEnabled !== false),
        order: prev && Number.isFinite(prev.order) ? prev.order : i
      };
    });
    if (!Array.isArray(s.enterpriseHosts)) s.enterpriseHosts = [];
    if (s.reviewAction !== "approve") s.reviewAction = "open";
    delete s.language; // 구버전 수동 언어 설정은 Chrome UI 언어로 마이그레이션한다.

    // approveComments 배열 보정. 구버전(단일 문자열 approveComment)은 마이그레이션.
    let comments = Array.isArray(stored && stored.approveComments)
      ? stored.approveComments.filter((c) => typeof c === "string" && c.trim() !== "")
      : [];
    if (!comments.length && typeof (stored && stored.approveComment) === "string") {
      const legacy = stored.approveComment.trim();
      if (legacy) comments = [legacy];
    }
    s.approveComments = comments.length
      ? comments
      : DEFAULT_SETTINGS.approveComments.slice();
    delete s.approveComment;

    return s;
  }

  /** 배열에서 랜덤으로 하나를 선택. 비어있으면 null. */
  function pickRandom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(STORAGE_KEY, (data) => {
        resolve(mergeSettings(data && data[STORAGE_KEY]));
      });
    });
  }

  function saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => resolve());
    });
  }

  /** 호스트 문자열 정규화/검증. 유효하면 호스트명 반환, 아니면 null. */
  function normalizeHost(input) {
    if (!input) return null;
    let v = String(input).trim();
    if (!v) return null;
    // URL 전체가 들어와도 호스트만 추출.
    try {
      if (/^https?:\/\//i.test(v)) v = new URL(v).host;
    } catch (e) {
      return null;
    }
    v = v.replace(/\/.*$/, "").toLowerCase();
    // 간단한 호스트명 검증 (도메인 또는 도메인:포트)
    if (!/^[a-z0-9.-]+(:\d+)?$/.test(v)) return null;
    if (v === "github.com") return null; // 기본 지원, 중복 등록 방지
    return v;
  }

  function originPatternForHost(host) {
    return `https://${host}/*`;
  }

  /** 첫 번째로 매칭되는 요소를 반환. selectors 는 후보 배열. */
  function queryFirst(selectors, ctx) {
    const scope = ctx || document;
    for (const sel of selectors) {
      const el = scope.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  root.GFB = {
    STORAGE_KEY,
    SESSION_PENDING_KEY,
    BUTTONS,
    DEFAULT_SETTINGS,
    SELECTORS,
    t,
    mergeSettings,
    getSettings,
    saveSettings,
    pickRandom,
    normalizeHost,
    originPatternForHost,
    queryFirst
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
