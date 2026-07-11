# GitHub Floating Buttons

GitHub 및 GitHub Enterprise 페이지 **우측 하단**에 자주 쓰는 동작을 위한 floating
버튼을 추가하는 Chrome 확장입니다. 빌드 도구 없이 바닐라 JS + Manifest V3 로
작성되어 그대로 로드해 사용할 수 있습니다.

## 기능

기본 제공 버튼 3개:

1. **Pull Request 목록으로 가기** — 현재 레포의 `/{owner}/{repo}/pulls` 로 이동
2. **맨 위로 스크롤** — 페이지 최상단으로 부드럽게 스크롤
3. **현재 PR 리뷰창 열기** — PR 의 Files 탭 리뷰 팝오버를 열고 Approve 를 선택.
   설정에 따라 코멘트 입력 + 제출까지 자동으로 수행(자동 approve)

각 버튼은 **켜고 끌 수 있고**, **순서를 바꿀 수 있습니다**. GitHub Enterprise
호스트는 설정에서 **여러 개 등록**할 수 있습니다.

## 설치 (개발자 모드)

1. `chrome://extensions` 접속 → 우측 상단 **개발자 모드** 켜기
2. **압축해제된 확장 프로그램 로드** 클릭 → 이 저장소 루트 폴더 선택
3. 툴바의 확장 아이콘을 클릭하면 **설정 페이지**가 열립니다

## 설정

툴바 아이콘 클릭 또는 `chrome://extensions` → 이 확장의 **세부정보 → 확장 옵션**:

- **버튼**: 체크박스로 on/off, 드래그(⠿) 또는 ↑/↓ 버튼으로 순서 변경. 변경은
  즉시 저장되어 열려 있는 GitHub 탭에도 바로 반영됩니다.
- **리뷰 동작**:
  - *리뷰창만 열기* (기본값): Approve 옵션 선택까지만 하고, 제출은 직접 합니다.
  - *자동 approve*: Approve 선택 + 코멘트 입력 + 제출까지 자동 수행합니다.
    이때 사용할 코멘트 문구를 지정할 수 있습니다.
- **GitHub Enterprise 호스트**: `github.mycompany.com` 형태로 추가. 추가 시 해당
  사이트 접근 권한을 요청하며, 승인하면 그 호스트에서도 버튼이 동작합니다.
  `github.com` 은 기본 지원됩니다.

> ⚠️ 자동 approve 는 되돌리기 번거로운 동작이라 **기본값은 "리뷰창만 열기"** 입니다.
> 자동 제출을 원하면 설정에서 명시적으로 켜세요.

## 구조

```
manifest.json                  # MV3 매니페스트 (i18n 메시지 참조)
_locales/{en,ko}/messages.json # Chrome 네이티브 언어별 메시지 카탈로그
src/
  common/constants.js          # 공유 상수/헬퍼 (globalThis.GFB)
  content/content.js           # floating 버튼 렌더 + 동작
  content/content.css          # 버튼/툴팁/토스트 스타일
  background/service-worker.js # Enterprise 호스트 동적 등록, 아이콘 클릭→옵션
  options/                     # 설정 페이지 (html/js/css)
icons/                         # 16/48/128 아이콘
```

- 콘텐트 스크립트는 `constants.js` → `content.js` 순으로 로드되어 같은 전역
  스코프(`globalThis.GFB`)를 공유합니다(번들러 불필요).
- Enterprise 호스트는 `optional_host_permissions` + `chrome.scripting`
  `registerContentScripts` 로 런타임에 등록/해제됩니다.

## 권한

이 확장이 요청하는 권한과 이유입니다. 외부로 전송되는 데이터는 전혀 없습니다.

| 권한 | 용도 |
| --- | --- |
| `storage` | 버튼 on/off·순서, 리뷰 설정, Enterprise 호스트 목록 등 환경설정 저장 |
| `scripting` | 사용자가 추가한 Enterprise 호스트에 버튼 스크립트를 런타임 등록 |
| `host_permissions: https://github.com/*` | github.com 페이지에 버튼 주입 |
| `optional_host_permissions: https://*/*` | **기본 미부여.** 사용자가 옵션에서 Enterprise 호스트를 직접 추가할 때만 해당 도메인 권한을 개별 요청. 임의 사이트에 자동 접근하지 않음 |

> Enterprise 도메인은 사전에 알 수 없으므로 선택적 host 권한에 broad 패턴
> (`https://*/*`)을 선언하지만, 실제 부여는 사용자가 추가한 호스트에 한해서만
> 일어납니다.

## 개인정보 / 웹스토어

- 개인정보 처리방침: [PRIVACY.md](./PRIVACY.md) — 개인정보·사용 데이터를 수집하지
  않으며 외부 전송이 없습니다.
- Chrome 웹스토어 제출 가이드(체크리스트·정당화 문구): [STORE.md](./STORE.md)

## 주의

- GitHub 의 DOM 구조 변경 시 "리뷰창 열기" 및 Merge 버튼의 셀렉터가 맞지 않을 수
  있습니다. 셀렉터는 `src/common/constants.js` 의 `SELECTORS` 한 곳에 모아 두어
  쉽게 업데이트할 수 있습니다.
