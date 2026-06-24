# Chrome 웹스토어 제출 가이드

이 문서는 GitHub Floating Buttons를 Chrome Web Store에 등록할 때 필요한 체크리스트와,
개발자 대시보드에 그대로 붙여넣을 수 있는 문구를 모아둔 것입니다. (이 파일은 확장
패키지에 포함되지 않습니다.)

## 제출 전 체크리스트

- [ ] Chrome Web Store 개발자 등록 ($5 1회 결제)
- [ ] 제출용 zip 준비 — **릴리즈 워크플로 산출물** 사용
      (`github-floating-buttons-vX.Y.Z.zip`, `manifest.json`이 zip 루트에 위치).
      현재 `v0.0.1` 릴리즈의 zip이 그대로 업로드 가능합니다.
- [ ] 아이콘 — 128×128 포함 (`icons/icon128.png`) ✓
- [ ] 스크린샷 1장 이상 — **1280×800** 또는 640×400 (PNG/JPEG)
      예: GitHub PR 페이지 우측 하단 버튼 + 옵션 페이지
- [ ] 개인정보 처리방침 URL 입력 (아래)
- [ ] 데이터 사용 신고 — 모든 항목 "수집하지 않음"
- [ ] 권한 정당화 입력 (아래)

## 리스팅 정보

- **이름**: GitHub Floating Buttons
- **카테고리**: Developer Tools (개발자 도구)
- **언어**: 한국어 (필요 시 영어 추가)
- **개인정보 처리방침 URL**:
  `https://github.com/kost0806/github-floating-buttons/blob/main/PRIVACY.md`

### 상세 설명 (한국어)

```
GitHub 및 GitHub Enterprise 페이지 우측 하단에 자주 쓰는 동작을 위한 floating
버튼을 추가합니다.

• Pull Request 목록으로 바로 가기
• 페이지 맨 위로 스크롤
• 현재 PR의 리뷰창 열기 (옵션: Approve 자동 선택/제출)

각 버튼은 설정에서 켜고 끌 수 있고 순서를 바꿀 수 있습니다. GitHub Enterprise
호스트는 직접 여러 개 등록할 수 있습니다. 외부로 전송되는 데이터가 전혀 없습니다.
```

### 상세 설명 (English)

```
Adds handy floating buttons to the bottom-right of GitHub and GitHub Enterprise
pages.

• Jump to the Pull Request list
• Scroll to the top of the page
• Open the review panel of the current PR (optionally auto-select/submit Approve)

Each button can be toggled and reordered in settings. You can register your own
GitHub Enterprise hosts. No data ever leaves your browser.
```

## Single Purpose (단일 목적)

```
GitHub / GitHub Enterprise 페이지에서 자주 쓰는 동작(PR 목록 이동, 맨 위로 스크롤,
현재 PR 리뷰창 열기/approve)을 위한 floating 버튼을 제공합니다.
```

## 권한 정당화 (Permission justification)

대시보드의 각 권한 입력란에 그대로 붙여넣으세요.

- **storage**
  ```
  버튼 표시 여부·순서, 리뷰 동작 설정, 사용자가 추가한 Enterprise 호스트 목록 등
  사용자 환경설정을 저장/동기화하는 데만 사용합니다.
  ```
- **scripting**
  ```
  사용자가 옵션에서 직접 추가한 GitHub Enterprise 호스트에 버튼 콘텐트 스크립트를
  런타임으로 등록(registerContentScripts)하기 위해 사용합니다.
  ```
- **Host permission `https://github.com/*`**
  ```
  github.com 페이지에 floating 버튼 UI를 주입하기 위해 필요합니다. 페이지 콘텐츠를
  읽어 외부로 전송하지 않습니다.
  ```
- **Optional host permission `https://*/*`** (심사 노트에 강조)
  ```
  기본적으로 부여되지 않습니다. 사용자가 옵션 페이지에서 자신의 GitHub Enterprise
  도메인을 직접 입력해 추가할 때만, 그 도메인에 한해 chrome.permissions.request로
  권한을 개별 요청합니다. 임의의 웹사이트에 자동으로 접근하지 않으며, Enterprise
  도메인은 사전에 알 수 없으므로 broad optional 패턴이 불가피합니다.
  ```

## 데이터 사용 신고

- 개인 식별 정보, 건강 정보, 금융 정보, 인증 정보, 개인 통신, 위치, 웹 기록,
  사용자 활동 — **수집하지 않음**.
- 수집한 데이터를 제3자에게 판매하지 않음 / 신용도 평가나 대출 목적으로 사용하지
  않음 / 항목의 핵심 기능과 무관한 목적으로 사용하지 않음 — 모두 준수.

## 비고

- broad optional 호스트 권한 때문에 심사에서 추가 질의가 올 수 있습니다. 위
  "Optional host permission" 정당화 문구로 답변하세요.
- 확장 동작/기능 변경 없이 문서만 추가되었으므로, 현재 `v0.0.1` zip을 그대로
  제출할 수 있습니다.
