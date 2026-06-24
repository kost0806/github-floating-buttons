# 개인정보 처리방침 (Privacy Policy)

**확장 프로그램**: GitHub Floating Buttons
**최종 업데이트**: 2026-06-24

## 요약

GitHub Floating Buttons는 **어떠한 개인정보나 사용 데이터도 수집·저장·전송하지
않습니다.** 외부 서버로 보내는 데이터가 전혀 없으며, 분석(analytics) 도구나 추적
기술을 사용하지 않습니다.

## 저장하는 정보

확장은 다음 **사용자 환경설정만** 브라우저의 `chrome.storage.sync`에 저장합니다:

- 버튼 표시 여부(on/off) 및 순서
- 리뷰 동작 설정(`리뷰창만 열기` / `자동 approve`)과 approve 코멘트 문구
- 사용자가 직접 추가한 GitHub Enterprise 호스트 목록

이 데이터는 **사용자 자신의 브라우저(및 로그인한 Google 계정의 Chrome 동기화)에만**
저장되며, 개발자나 제3자에게 전송되지 않습니다.

## 권한 사용 목적

- **storage** — 위의 환경설정을 저장/동기화하기 위해 사용합니다.
- **scripting** — 사용자가 추가한 Enterprise 호스트에 버튼 스크립트를 런타임으로
  등록하기 위해 사용합니다.
- **host 권한 (`https://github.com/*`)** — github.com 페이지에 floating 버튼을
  표시하기 위해 사용합니다. 페이지 내용을 읽어 외부로 보내지 않습니다.
- **선택적 host 권한 (`https://*/*`)** — 기본적으로 부여되지 않습니다. 사용자가
  설정에서 Enterprise 호스트를 **직접 추가할 때만** 해당 호스트에 대한 권한을
  개별적으로 요청하며, 임의의 사이트에 자동으로 접근하지 않습니다.

## 제3자 공유

없습니다. 데이터를 수집하지 않으므로 공유할 데이터도 없습니다.

## 문의

문의나 신고는 이 저장소의 이슈 트래커를 이용해 주세요:
https://github.com/kost0806/github-floating-buttons/issues
