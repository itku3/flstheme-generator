# 실행 스펙: FL Studio `.flstheme` 팔레트 생성 서비스

## 메타데이터

- 프로필: Standard
- 라운드 수: 7
- 최종 ambiguity: 13%
- 목표 ambiguity: 20% 이하
- 컨텍스트 유형: Greenfield
- 컨텍스트 스냅샷: `.omx/context/flstheme-palette-service-20260422T182949Z.md`
- 인터뷰 기록: `.omx/interviews/flstheme-palette-service-20260422T182949Z.md`

## 의도

사용자는 직접 사용할 수 있는 FL Studio 테마 생성기를 원한다. 장기적으로는 다른 FL Studio 유저들이 쉽게 테마를 제작하고 공유할 수 있는 서비스로 확장하고 싶지만, 첫 번째 버전은 개인용 생성기에 집중한다.

## 원하는 결과

데스크톱 웹에서 사용자가 팔레트를 선택하면 서비스가 `.flstheme` 주요 색상 필드를 자동으로 매핑하고, 미리보기 이미지를 보여준 뒤, FL Studio에서 로드 가능한 `.flstheme` 파일을 다운로드할 수 있어야 한다.

## 범위

MVP에 포함한다:

- 팔레트 선택 또는 팔레트 입력
- 팔레트 기반 자동 색상 매핑
- 텍스트 가독성 자동 보정
- 이미지 중심 테마 미리보기
- `.flstheme` 파일 생성
- `.flstheme` 파일 다운로드
- 데스크톱 웹 우선 지원

## 비목표

MVP에서 제외한다:

- 계정
- 로그인
- 서버 저장
- 공개 공유
- 검색
- 좋아요/댓글
- 이미지 배경 업로드
- 사용자 `.flstheme` 템플릿 업로드
- 모바일 최적화
- FL Studio UI의 완전한 실시간 재현

## 결정 경계

구현자가 결정해도 되는 것:

- 팔레트 색상을 `.flstheme` 필드에 자동 배치하는 규칙
- `TextColor` 대비 보정 방식
- `Selected`, `Highlight`, `Mute`, `Option` 색상 선택 방식
- `StepEven`, `StepOdd`, `Meter0`~`Meter5`, `NoteColor0`~`NoteColor15` 파생 방식
- 초기 MVP에서 `Hue`, `Saturation`, `Lightness`, `Contrast`, `Text` 전역 조정값을 템플릿 값으로 유지할지 여부
- 미리보기 이미지의 구체적 레이아웃

사용자 확인이 필요한 것:

- 기본 템플릿으로 사용할 `.flstheme` 파일 최종 선택
- 실제 FL Studio 로드 테스트에 사용할 FL Studio 버전
- 공유/커뮤니티 기능을 시작할 후속 단계의 범위

## 제약

- `.flstheme` 포맷은 공식 공개 표준으로 확인되지 않았다.
- 분석한 `Grape.flstheme`는 텍스트 `Key=Value` 파일이며, 색상은 signed 24-bit RGB 정수로 보인다.
- MVP는 검증된 템플릿 기반 생성이 안전하다.
- 생성된 파일은 CRLF 줄바꿈을 유지하는 편이 안전하다.
- 인터뷰/계획 문서는 한국어로 작성한다.

## 파일 포맷 근거

샘플 분석 결과:

- `Selected=-6648603` → `#9A8CE5`
- `Highlight=-2328689` → `#DC778F`
- `Mute=-59021` → `#FF1973`
- `Option=-1570713` → `#E80867`
- `TextColor=-12304286` → `#444062`
- `BackColor=-16777216` → `#000000`

색상 변환 규칙:

```js
function hexToFlColor(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return n >= 0x800000 ? n - 0x1000000 : n;
}

function flColorToHex(value) {
  return "#" + (value & 0xffffff).toString(16).padStart(6, "0").toUpperCase();
}
```

## 수용 기준

- 사용자는 데스크톱 웹에서 팔레트를 선택할 수 있다.
- 서비스는 팔레트에 맞춰 주요 `.flstheme` 색상 필드를 자동으로 지정한다.
- 텍스트가 읽기 어려운 조합은 자동으로 보정된다.
- 미리보기 이미지는 전체 분위기, 강조색, 텍스트 가독성을 판단할 수 있어야 한다.
- 미리보기의 버튼/패널 위치가 실제 FL Studio와 완전히 같을 필요는 없다.
- 다운로드한 `.flstheme` 파일은 FL Studio에서 정상 로드되어야 한다.
- 실제 FL Studio에서 적용한 테마의 분위기가 미리보기와 대략 일치해야 한다.

## 노출된 가정과 해소

- 가정: 사용자는 세부 필드를 하나씩 지정하고 싶어할 수 있다.
  - 해소: 사용자는 주요 색상이 팔레트에 맞게 자동 지정되길 원한다.

- 가정: MVP부터 공유 기능이 필요할 수 있다.
  - 해소: 첫 버전은 개인용 생성기로 충분하다.

- 가정: FL Studio와 동일한 실시간 미리보기가 필요할 수 있다.
  - 해소: 이미지 중심 미리보기로 시작해도 된다.

## 압박 질문 결과

이전 답변의 “미리보기 이미지 중심” 결정을 다시 확인했다. 사용자는 실제 FL Studio와 버튼/패널 위치가 달라도 괜찮으며, 전체 분위기·강조색·텍스트 가독성이 맞으면 충분하다고 확인했다.

## 후속 권장 경로

다음 단계로는 `$ralplan`을 권장한다. 이 스펙을 기반으로 기술 구조, 자동 매핑 알고리즘, 테스트 전략, UI 흐름을 계획하면 된다.
