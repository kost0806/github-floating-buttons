/**
 * GitHub Floating Buttons — 서비스 워커.
 * Enterprise 호스트에 대해 콘텐트 스크립트를 동적으로 등록/해제한다.
 * github.com 은 manifest 의 정적 content_scripts 로 처리되므로 제외.
 */
importScripts("/src/common/constants.js");

const GFB = self.GFB;
const REGISTERED_ID_PREFIX = "gfb-host-";

function scriptIdForHost(host) {
  return REGISTERED_ID_PREFIX + host;
}

/** 확장이 권한을 가진 호스트만 반환. */
function filterGrantedHosts(hosts) {
  return new Promise((resolve) => {
    chrome.permissions.getAll((perms) => {
      const origins = perms.origins || [];
      const granted = hosts.filter((h) => {
        const pattern = GFB.originPatternForHost(h);
        // 정확한 패턴 또는 더 넓은 패턴(https://*/*)이 있으면 허용으로 간주.
        return (
          origins.includes(pattern) ||
          origins.includes("https://*/*") ||
          origins.includes("<all_urls>")
        );
      });
      resolve(granted);
    });
  });
}

function getRegistered() {
  return new Promise((resolve) => {
    chrome.scripting
      .getRegisteredContentScripts()
      .then((scripts) =>
        resolve(scripts.filter((s) => s.id.startsWith(REGISTERED_ID_PREFIX)))
      )
      .catch(() => resolve([]));
  });
}

/** 저장된 enterpriseHosts 와 실제 등록 상태를 동기화. */
async function syncRegistrations() {
  const settings = await GFB.getSettings();
  const wantedHosts = await filterGrantedHosts(settings.enterpriseHosts || []);
  const wantedIds = new Set(wantedHosts.map(scriptIdForHost));

  const registered = await getRegistered();
  const registeredIds = new Set(registered.map((s) => s.id));

  // 더 이상 필요 없거나 권한 없는 것 해제
  const toUnregister = registered
    .filter((s) => !wantedIds.has(s.id))
    .map((s) => s.id);
  if (toUnregister.length) {
    try {
      await chrome.scripting.unregisterContentScripts({ ids: toUnregister });
    } catch (e) {
      /* ignore */
    }
  }

  // 새로 필요한 호스트 등록
  const toRegister = wantedHosts
    .filter((h) => !registeredIds.has(scriptIdForHost(h)))
    .map((h) => ({
      id: scriptIdForHost(h),
      matches: [GFB.originPatternForHost(h)],
      js: ["src/common/constants.js", "src/content/content.js"],
      css: ["src/content/content.css"],
      runAt: "document_idle"
    }));
  if (toRegister.length) {
    try {
      await chrome.scripting.registerContentScripts(toRegister);
    } catch (e) {
      /* ignore — 패턴 충돌 등 */
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  syncRegistrations();
});

chrome.runtime.onStartup.addListener(() => {
  syncRegistrations();
});

// 설정(enterpriseHosts) 변경 시 동기화
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[GFB.STORAGE_KEY]) {
    syncRegistrations();
  }
});

// 툴바 아이콘 클릭 시 옵션 페이지 열기 (default_popup 없음)
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// 옵션 페이지에서 권한 부여 직후 즉시 동기화를 요청할 수 있도록 메시지 핸들러 제공
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "gfb:sync-registrations") {
    syncRegistrations().then(() => sendResponse({ ok: true }));
    return true; // async response
  }
  return false;
});
