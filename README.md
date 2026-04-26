# FL Studio Palette Theme Generator

팔레트 색상 6개로 FL Studio `.flstheme` 파일을 자동 생성하는 웹 도구입니다.

## 주요 기능

- **단색 자동 생성** — 기준 색 하나를 입력하면 동일 색조 계열의 팔레트 5색을 자동 추천합니다.
- **팔레트 → 테마 자동 매핑** — 팔레트 밝기·채도 분석을 통해 Background, Selected, Highlight, Mute, Option, Step, Meter, Note 등 주요 색상을 자동으로 배치합니다.
- **FL Studio Adjustments 슬라이더** — Hue, Saturation, Lightness, Contrast, Text 전역 값을 직접 조정하고 미리보기에 실시간 반영합니다.
- **FL Studio 스타일 미리보기** — Channel Rack, Piano Roll, Playlist, Meter를 포함한 UI 미리보기를 제공합니다.
- **대비 자동 보정** — 텍스트 색상을 WCAG 기준으로 자동 선택해 가독성을 보장합니다.
- **다운로드** — 생성된 `.flstheme` 파일을 즉시 다운로드할 수 있습니다.

## 사용법

1. **팔레트 선택** — 내장 프리셋(Grape Night, Oxide Lime, Cold Signal) 또는 직접 입력한 HEX 색상 4~6개를 사용합니다.
   - 또는 단색 입력 후 **팔레트 생성** 버튼으로 자동 추천을 받을 수 있습니다.
2. **Adjustments 조정** (선택) — Hue, Saturation 등의 슬라이더를 움직여 미리보기를 확인합니다.
3. **Download** — 우측 상단 버튼으로 `.flstheme` 파일을 다운로드합니다.
4. **FL Studio 적용** — `Options > Theme` 에서 다운로드한 파일을 선택합니다.

## FL Studio 테마 적용 방법

1. `Options` (단축키 `F10`) → `Themes` 탭
2. 폴더 아이콘으로 다운로드한 `.flstheme` 파일을 선택
3. 변경 사항이 즉시 반영됩니다.

> **팁**: FL Studio가 이전 테마를 캐시할 수 있으므로, 변경이 반영되지 않으면 FL Studio를 재시작하세요.

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (로컬 네트워크 접근 포함)
npm run dev

# 테스트 실행
npm test

# 타입 검사
npm run lint

# 프로덕션 빌드
npm run build
```

## 기술 스택

| 분류 | 라이브러리 |
|---|---|
| UI 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite 6 |
| 스타일링 | Tailwind CSS v3 + shadcn/ui |
| 컴포넌트 | Radix UI (Slider, Tooltip, Separator 등) |
| 테스트 | Vitest + Testing Library |
| 색상 변환 | 직접 구현 (외부 의존성 없음) |

## 프로젝트 구조

```
src/
├── color.ts              # HEX ↔ RGB ↔ HSL 변환, 팔레트 생성
├── mapper.ts             # 팔레트 → ThemePatch 매핑 로직
├── themeFormat.ts        # .flstheme 파싱 / 패치 / 직렬화
├── download.ts           # 파일 다운로드 유틸
├── App.tsx               # 메인 UI
├── components/
│   ├── FLStudioPreview.tsx   # FL Studio 스타일 미리보기
│   └── ui/               # shadcn/ui 컴포넌트
└── fixtures/
    └── templates/
        └── Grape.flstheme    # 기반 템플릿
```

## .flstheme 포맷

FL Studio 테마 파일은 `Key=Value` 형식의 텍스트 파일입니다. 색상은 signed 24-bit RGB 정수로 표현됩니다.

```
# 변환 규칙
HEX → FL: n >= 0x800000 ? n - 0x1000000 : n
FL → HEX: (value & 0xFFFFFF).toString(16)

# 예시
#9A8CE5 → -6648603
#000000 → 0 (BackColor)
```

이 도구는 화이트리스트된 키(`Selected`, `Highlight`, `Mute`, `Option`, `StepEven`, `StepOdd`, `Meter0`~`5`, `NoteColor0`~`15`, `BackColor`, `PRGridback`, `PLGridback`, `EEGridback`, `Lightmode`, `PRGridCustom`, `PLGridCustom`, `EEGridCustom`, `Hue`, `Saturation`, `Lightness`, `Contrast`, `Text`)만 수정하고 나머지는 템플릿 값을 그대로 보존합니다.

## 알려진 한계

- FL Studio `.flstheme` 포맷의 공식 스펙이 공개되어 있지 않아 리버스 엔지니어링 기반으로 구현되었습니다.
- Adjustments 슬라이더의 값 범위는 공식 확인되지 않은 추정값입니다.
- 미리보기는 FL Studio UI의 완전한 재현이 아닌 색상 분위기 확인용입니다.
- FL Studio 버전에 따라 테마 적용 결과가 다를 수 있습니다.

## 라이선스

MIT
