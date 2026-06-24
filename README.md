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
manifest.json                  # MV3 매니페스트
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

## 주의

- GitHub 의 DOM 구조 변경 시 "리뷰창 열기"의 셀렉터가 맞지 않을 수 있습니다.
  셀렉터는 `src/common/constants.js` 의 `SELECTORS` 한 곳에 모아 두어 쉽게
  업데이트할 수 있습니다.
