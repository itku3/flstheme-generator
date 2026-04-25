# PRD: FL Studio `.flstheme` 팔레트 생성기 MVP

## 결정

MVP는 React + TypeScript + Vite 기반 정적 웹앱으로 구현하고, UI는 shadcn/ui 컴포넌트로 구성한다. 사용자는 데스크톱 웹에서 팔레트를 선택하거나 입력하고, 앱은 고정된 known-good `Grape.flstheme` 템플릿의 허용된 색상 필드만 ordered line-token patching 방식으로 수정해 다운로드 가능한 `.flstheme` 파일을 생성한다.

## RALPLAN-DR 요약

### 원칙

- 검증된 템플릿을 최소 변경해 FL Studio 호환성 리스크를 낮춘다.
- `.flstheme`는 공개 표준이 불확실하므로 구조 재작성 대신 라인 토큰 패치만 허용한다.
- MVP는 개인용 데스크톱 웹 생성기에 집중하고 계정, 서버 저장, 공유, 업로드는 제외한다.
- UI는 shadcn/ui의 검증된 컴포넌트를 조합하되, `.flstheme` 생성 도메인 로직은 React와 분리된 순수 TypeScript 모듈로 유지한다.
- 테스트는 색상 계산뿐 아니라 생성 파일의 diff shape까지 검증한다.
- 실제 FL Studio 로드 테스트는 최종 완료 게이트로 남긴다.

### 결정 동인

1. 생성 파일이 실제 FL Studio에서 로드되어야 한다.
2. 원본 템플릿의 줄 순서, CRLF, 알 수 없는 필드를 보존해야 한다.
3. MVP 구현은 작고 검증 가능해야 한다.

### 비교 옵션

- 옵션 A: 템플릿 전체 문자열 치환
  - 장점: 구현이 빠르다.
  - 단점: 부분 문자열 오염, 중복 키 오처리, 줄 종결자 손상 위험이 있다.
  - 결론: 폐기.
- 옵션 B: ordered line-token patching
  - 장점: 원본 줄 순서, CRLF, 미지 필드 보존이 가능하고 diff 검증이 명확하다.
  - 단점: 파서와 golden 테스트가 필요하다.
  - 결론: 채택.
- 옵션 C: `.flstheme` 전체 재생성
  - 장점: 내부 모델이 단순하다.
  - 단점: 포맷 미확정 상태에서 호환성 리스크가 가장 크다.
  - 결론: MVP에서는 폐기.

## 범위

### 포함

- 팔레트 프리셋 선택
- 4-6개 HEX 색상 직접 입력/수정
- 팔레트 기반 자동 색상 매핑
- 텍스트 대비 자동 보정
- 분위기 중심 FL Studio mock preview
- `.flstheme` 생성과 다운로드
- 데스크톱 우선 단일 화면

### 제외

- 계정, 로그인, 서버 저장
- 공개 공유, 검색, 좋아요/댓글
- 이미지 배경 업로드
- 사용자 `.flstheme` 템플릿 업로드
- 모바일 최적화
- FL Studio UI의 완전한 실시간 재현

## 구현 구조

### 프로젝트 골격

- `package.json`: React, Vite, TypeScript, Tailwind, shadcn/ui 관련 의존성, Vitest 의존성.
- `index.html`: 정적 앱 진입점.
- `components.json`: shadcn/ui 프로젝트 설정.
- `src/main.tsx`: React 앱 진입점.
- `src/App.tsx`: 팔레트 입력, preview, 다운로드 화면 조합.
- `src/components/ui/*`: shadcn/ui CLI로 추가한 UI 컴포넌트.
- `src/components/*`: 앱 전용 조합 컴포넌트.
- `src/themeFormat.ts`: line-token parse/patch/serialize.
- `src/color.ts`: HEX 변환, RGB/HSL 유틸, 대비 계산.
- `src/mapper.ts`: 팔레트에서 `.flstheme` patch map 생성.
- `src/download.ts`: Blob 다운로드.
- `src/fixtures/templates/Grape.flstheme`: 고정 템플릿 fixture.
- `src/**/*.test.ts`: 단위/golden/diff-shape 테스트.
- `docs/manual-compatibility.md`: 실제 FL Studio 로드 테스트 기록 양식.

### 템플릿 fixture

- 원본: `/mnt/c/Users/sonju/Documents/Image-Line/FL Studio/Settings/Themes/Grape.flstheme`
- 대상: `src/fixtures/templates/Grape.flstheme`
- 알려진 속성: 879 bytes, ASCII text, CRLF line terminators, `SPEC.md`의 분석 샘플과 일치.
- 사용자가 다른 템플릿을 최종 선택하면 fixture provenance, whitelist, golden 테스트를 함께 갱신한다.

### Format Layer

- `parseThemeLines(templateText)`
  - 원본 줄 종결자와 trailing newline 정책을 감지한다.
  - 각 줄을 `{ raw, key?, value?, lineIndex }` 토큰으로 보존한다.
  - `Key=Value` 형식만 patch 대상 후보로 본다.
- `patchThemeTokens(tokens, orderedPatch)`
  - exact whitelist에 포함된 키만 변경한다.
  - 키별 정확히 1개 라인만 허용한다.
  - 필수 키 누락 또는 중복 키는 실패 처리한다.
  - wildcard, substring, regex 기반 광범위 치환은 금지한다.
- `serializeThemeLines(tokens, newlinePolicy)`
  - 원본 줄 순서, CRLF, trailing newline 정책을 유지한다.

### Exact Patch Whitelist

변경 허용:

- `Selected`, `Highlight`, `Mute`, `Option`
- `StepEven`, `StepOdd`
- `TextColor`
- `Meter0`, `Meter1`, `Meter2`, `Meter3`, `Meter4`, `Meter5`
- `NoteColor0` through `NoteColor15`
- `PRGridback`, `PLGridback`, `EEGridback`
- `BackColor`

변경 금지:

- `Hue`, `Saturation`, `Lightness`, `Contrast`, `Text`
- `Lightmode`, `OverrideClips`
- `PRGridCustom`, `PRGridContrast`
- `PLGridCustom`, `PLGridContrast`
- `EEGridCustom`, `EEGridContrast`
- `BackMode`, `BackPicFilename`, `BackHTMLFileName`
- whitelist에 없는 모든 키와 라인

### 팔레트 매핑

- 가장 어두운 색: `BackColor`, grid background 계열.
- 대표 색: `Selected`.
- 고채도 또는 높은 대비 색: `Highlight`, `Mute`, `Option`.
- 중간 톤 파생: `StepEven`, `StepOdd`.
- `Meter0`-`Meter5`: 낮음에서 높음으로 강도가 증가하는 그라데이션.
- `NoteColor0`-`NoteColor15`: 팔레트 기반 hue/brightness variant.
- `TextColor`: 배경 대비 기준으로 자동 선택하고 부족하면 보정.
- 전역 조정값 `Hue`, `Saturation`, `Lightness`, `Contrast`, `Text`는 MVP에서 템플릿 값을 유지한다.

### UI 구현 규칙

- shadcn/ui 스킬 지침에 따라 먼저 필요한 컴포넌트를 CLI로 추가하고 문서를 확인한다.
- 예상 컴포넌트: `button`, `card`, `input`, `label` 또는 `field`, `tabs` 또는 `toggle-group`, `badge`, `separator`, `tooltip`, `alert`.
- 팔레트 입력은 shadcn form/input 계열 컴포넌트로 구성한다.
- 프리셋 선택은 `ToggleGroup` 또는 `Tabs`로 구성한다.
- 다운로드, validation, 상태 표시는 `Button`, `Alert`, `Badge`를 우선 사용한다.
- 색상 preview와 FL Studio mock preview는 앱 도메인에 특화된 custom component로 만들되, 외곽 UI와 control surface는 shadcn 컴포넌트 composition을 따른다.
- shadcn 컴포넌트 스타일은 semantic token을 우선 사용하고, 도메인 색상 preview에만 팔레트 HEX 값을 inline style/CSS variable로 제한적으로 사용한다.

## ADR

### Decision

React + TypeScript + Vite + shadcn/ui + Vitest로 정적 MVP를 만들고, `Grape.flstheme` fixture를 ordered line-token patching 방식으로 수정해 파일을 생성한다.

### Drivers

- `.flstheme` 포맷 표준 불확실성
- CRLF, 줄 순서, 미지 필드 보존 필요
- 빠른 MVP와 수동 FL Studio 검증 필요
- 사용자가 shadcn/ui 기반 UI 구현을 선호함

### Alternatives Considered

- Vanilla TypeScript + Vite: 의존성은 적지만 shadcn/ui를 사용할 수 없고 UI 품질/일관성을 직접 구현해야 한다.
- 전체 문자열 치환: 구현은 쉽지만 diff-shape 보장이 어렵다.
- 전체 파일 재생성: 내부 구조는 깔끔하지만 FL Studio 호환성 리스크가 크다.

### Why Chosen

핵심 리스크는 여전히 파일 호환성이므로 `.flstheme` 생성 로직은 React 밖의 순수 TypeScript 모듈로 유지한다. 다만 사용자가 shadcn/ui 기반 UI를 원하고, 팔레트 입력/프리셋/상태 표시/다운로드 control surface는 shadcn 컴포넌트 조합으로 더 일관되게 만들 수 있다. React, Tailwind, shadcn/ui, Vite, Vitest는 greenfield 웹앱과 테스트 실행을 위한 명시적 의존성 예외로 기록한다.

### Consequences

- Vanilla TS보다 초기 의존성과 scaffold 단계가 늘어난다.
- shadcn/ui 컴포넌트는 프로젝트 소스에 추가되므로, 추가된 컴포넌트 파일을 검토하고 프로젝트 alias/import를 확인해야 한다.
- 후속 공유/커뮤니티 기능 또는 복잡한 편집기가 필요해질 때 UI 확장 비용이 낮아진다.
- 파일 생성 도메인 로직은 UI 프레임워크와 분리해 유지해야 한다.

## 수용 기준

- 사용자는 데스크톱 웹에서 팔레트를 선택하거나 4-6개 HEX 색상을 입력할 수 있다.
- UI control surface는 shadcn/ui 컴포넌트를 우선 사용한다.
- 잘못된 HEX 입력은 다운로드를 막고 명확한 오류 상태를 표시한다.
- 생성기는 exact whitelist의 색상 값만 ordered line-token patching으로 변경한다.
- CRLF, 라인 수, 라인 순서, 변경 금지 키, 알 수 없는 키가 보존된다.
- 텍스트 대비가 낮은 팔레트는 자동 보정된다.
- 미리보기에서 전체 분위기, 강조색, 텍스트 가독성을 판단할 수 있다.
- `.flstheme` 파일을 브라우저에서 다운로드할 수 있다.
- 최종 완료 전 FL Studio version/build, OS, 생성 파일명, pass/fail evidence를 기록한다.

## 실행 가이드

### Ralph 경로

- 권장: 단일 `executor`가 구현하고 `verifier` 성격으로 자체 검증 루프를 수행한다.
- Reasoning: `executor` high, `verifier` high.
- 순서:
  1. React + Vite + TypeScript + Vitest scaffold
  2. shadcn/ui 초기화와 필요한 컴포넌트 추가
  3. `Grape.flstheme` fixture 복사
  4. format/color/mapper 도메인 로직과 테스트
  5. shadcn 기반 UI, preview, download
  6. golden/diff-shape 테스트
  7. build/test 실행과 manual compatibility checklist 작성

### Team 경로

- 사용 가능한 agent types: `planner`, `architect`, `executor`, `test-engineer`, `verifier`, `critic`, `writer`, `build-fixer`.
- 추천 배치:
  - `executor`: React/Vite app scaffold, shadcn/ui 구성, preview, download
  - `test-engineer`: parser/patcher/golden diff-shape tests
  - `writer`: `docs/manual-compatibility.md` 작성
  - `verifier`: build/test/manual gate 판정
- Launch hint: `$team` 또는 `omx team`으로 3-4 lane 구성.
- Team verification path: automated test evidence, build evidence, generated sample diff, manual FL Studio gate 상태를 `verifier`가 종합한다.

## Follow-ups

- 실제 FL Studio edition/version/build 확인.
- manual load-test evidence 저장.
- 템플릿 교체 시 fixture provenance, exact whitelist, golden tests 갱신.
