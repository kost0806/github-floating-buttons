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
GitHub를 매일 쓰다 보면 반복되는 동작이 있습니다. PR 목록으로 돌아가기, 긴 파일의
위아래로 이동하기, 리뷰 팝업 열고 Approve 클릭하기, PR 병합하기. GitHub Floating
Buttons는 이런 동작을 페이지 우측 하단의 버튼으로 빠르게 처리할 수 있게 해줍니다.

■ 주요 기능
• PR 목록으로 이동 — 현재 레포의 Pull Request 목록 페이지로 바로 이동합니다.
• 맨 위/아래로 스크롤 — 어느 페이지에서든 부드럽게 최상단 또는 최하단으로 이동합니다.
• 리뷰창 열기 — PR의 Files 탭에서 리뷰 팝오버를 자동으로 열고 Approve를 선택합니다.
  (선택 사항) 자동 approve: 코멘트 입력 후 제출까지 한 번에 처리합니다. 여러
  코멘트가 있으면 그중 하나를 무작위로 골라 입력합니다.
• Merge commit — 확인 후 현재 PR을 merge commit 방식으로 병합합니다.
• Squash merge — 확인 후 현재 PR을 squash 방식으로 병합합니다.

■ 자유롭게 커스텀
• 각 버튼을 개별로 켜고 끌 수 있습니다.
• 드래그하거나 ↑/↓ 버튼으로 순서를 바꿀 수 있습니다.
• Chrome UI 언어에 따라 설정 페이지와 알림 메시지가 한국어 또는 영어로 자동 표시됩니다.

■ GitHub Enterprise 지원
• 설정 페이지에서 사내 GitHub Enterprise 호스트(예: github.mycompany.com)를 직접
  추가할 수 있습니다.
• 추가한 호스트에서도 동일한 버튼이 동작합니다.

개인정보와 사용 데이터를 수집하거나 외부로 전송하지 않습니다.
```

### 상세 설명 (English)

```
Adds handy floating buttons to the bottom-right of GitHub and GitHub Enterprise
pages.

• Jump to the Pull Request list
• Smoothly scroll to the top or bottom of the page
• Open the review panel of the current PR (optionally auto-select/submit Approve)
• Merge the current PR with a merge commit after confirmation
• Squash and merge the current PR after confirmation

Each button can be toggled and reordered in settings. Auto-approve can randomly
pick from multiple saved comments. The settings page and notifications support
Korean and English. You can also register your own GitHub Enterprise hosts. No
data ever leaves your browser.
```

## Single Purpose (단일 목적)

```
GitHub / GitHub Enterprise 페이지에서 자주 쓰는 동작(PR 목록 이동, 위아래 스크롤,
현재 PR 리뷰/approve, merge commit 및 squash merge)을 위한 floating 버튼을
제공합니다.
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
