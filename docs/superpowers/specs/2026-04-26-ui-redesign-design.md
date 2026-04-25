# UI 전면 재설계 디자인 스펙

- 날짜: 2026-04-26
- 상태: 승인됨

## 목표

현재 2열 고정 레이아웃을 "클린 SaaS" 방향으로 전면 재설계한다. 개선 대상은 전체 레이아웃, 팔레트 UX, 미리보기 품질, 시각적 완성도 4가지 영역 전부이며, 라이트/다크 모드 토글을 추가한다.

## 구현 방식

전체 재설계(Approach A): `App.tsx` 레이아웃 전면 재작성 + `FLStudioPreview.tsx` 개선 + 다크/라이트 모드 추가. 기존 핵심 로직(`color.ts`, `mapper.ts`, `themeFormat.ts`, `download.ts`)은 변경하지 않는다.

## 레이아웃 구조

B+C 혼합 레이아웃:

```
┌─────────────────────────────────────────────────────────────┐
│ Header: 제목 / 스텝 인디케이터 / 다크모드 토글 / Download 버튼  │
├─────────────────────────────────────────────────────────────┤
│ Palette 섹션 (컴팩트, 가로 배치)                              │
│  [Grape Night ●●●] [Oxide Lime ●●] [Cold Signal ●●]  │  [●#9A8CE5] [●#DC778F] [●#FF1973] [+]  │
├─────────────────────────────────────────────────────────────┤
│ Preview 섹션 (전체 폭, 더 크게)                               │
│  FL Studio 미리보기                                           │
└─────────────────────────────────────────────────────────────┘
```

### 헤더

- 좌측: 뱃지("FL Studio .flstheme") + 제목("Palette Theme Generator") + 설명
- 중앙: 스텝 인디케이터 — ① 팔레트 선택 → ② 미리보기 → ③ 내보내기 (현재 단계 강조, 클릭 이동 없음, 시각적 진행 표시만)
- 우측: 다크/라이트 토글 + Download 버튼

### 팔레트 섹션

가로 배치 2구역:

1. **프리셋 pills** (좌측, divider로 구분): 각 프리셋을 가로 pill로 표시. pill 안에 해당 팔레트의 모든 색상을 겹친 원형 스와치로 표시. 선택 시 indigo 테두리 + 배경 강조.
2. **색상 입력** (우측): 현재 팔레트의 각 색상을 인라인 카드로 표시 (`[■ #HEX]`). 카드는 두 가지 조작을 지원한다 — 스와치(■)를 클릭하면 숨겨진 `<input type="color">`가 열려 네이티브 컬러피커로 색상 선택 가능, HEX 텍스트 영역은 직접 타이핑 가능(기존 `<input type="text">` 유지). 마지막에 [+ 추가] 카드. 4~6개 범위 유지.

### 미리보기 섹션

- 팔레트 섹션 바로 아래, 전체 폭 카드
- 우측 상단에 "Contrast X.X:1 · Template: Grape.flstheme" 메타 텍스트
- `FLStudioPreview` 컴포넌트를 더 넓은 영역에서 렌더링 (현재 고정 높이 제거 또는 확장)
- 피아노 롤 그리드 패턴을 12음계 기반으로 수정. 현재 `index % 5 === 0` → `[false,true,false,true,false,false,true,false,true,false,true,false][index % 12]`(흰건반=false, 검은건반=true). 검은건반 셀은 `selected` 색상, 흰건반 셀은 반투명 배경.

## 다크/라이트 모드

- `useState`로 `isDark` 상태 관리, 초기값은 `window.matchMedia('(prefers-color-scheme: dark)').matches`
- 토글 시 `document.documentElement.classList.toggle('dark')` 호출
- shadcn/ui는 이미 `.dark` 클래스 기반 CSS 변수를 지원하므로 추가 CSS 불필요
- 토글 버튼: 헤더 우측, Sun/Moon 아이콘(lucide-react)

## 버그 수정 (이번 작업에 포함)

- `download.ts`: Firefox 호환성 — `anchor`를 `document.body.appendChild` 후 클릭, `removeChild`로 정리

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/App.tsx` | 레이아웃 전면 재작성 |
| `src/App.test.tsx` | 새 UI 동작 반영 |
| `src/components/FLStudioPreview.tsx` | 피아노 롤 패턴 수정 |
| `src/download.ts` | Firefox anchor 버그 수정 |
| `src/index.css` | `.dark` 블록 CSS 변수 추가 (다크 모드 실제 작동에 필수) |

변경하지 않는 파일: `color.ts`, `mapper.ts`, `themeFormat.ts`, `main.tsx`, 모든 테스트 파일(App.test.tsx 제외), `tailwind.config.ts`.

## 수용 기준

- 라이트/다크 모드 토글이 동작한다.
- 팔레트 섹션이 가로 한 줄로 컴팩트하게 표시된다.
- 미리보기가 전체 폭을 사용하고 현재보다 더 크게 표시된다.
- 피아노 롤 건반 패턴이 12음계 기반으로 정확하다.
- 기존 14개 테스트가 모두 통과한다.
- Firefox에서 다운로드가 동작한다.
