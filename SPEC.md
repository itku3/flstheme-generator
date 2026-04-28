# FL Studio 테마 생성기 작업 명세

## 목적

이 프로젝트는 적은 수의 HEX 팔레트 색상으로 실제 FL Studio에서 사용할 수 있는 `.flstheme` 파일을 생성하는 브라우저 기반 테마 생성기다.

초기 MVP 단계는 지나갔고, 지금부터는 다음 세 가지가 중요하다.

- FL Studio 테마 파일의 색상 인코딩을 더 정확하게 이해한다.
- 샘플 테마를 항상 같은 방식으로 재생성할 수 있게 만든다.
- 여러 AI가 서로 다른 영역을 병렬로 맡아도 같은 조사를 반복하지 않도록 근거와 작업 범위를 문서화한다.

## 용어 표기 원칙

- 설명 문장은 한국어로 작성한다.
- FL Studio의 실제 필드명, 컨트롤명, UI 영역명은 영어 원문을 유지한다.
- `Adjustments` 영역에 표시되는 용어는 모두 영어 원문을 유지한다.
- 예: `Adjustments`, `Hue`, `Saturation`, `Brightness`, `Contrast`, `Text`, `Selection`, `Highlight`, `Mute`, `Option`, `Steps`, `Meters`, `Waves`
- 파일 포맷 필드명도 영어 원문을 유지한다. 예: `Selected`, `TextColor`, `StepEven`, `StepOdd`, `Meter0`, `WaveClr0`
- UI 영역명도 영어 원문을 유지한다. 예: `Browser`, `Playlist`, `Piano Roll`, `Settings`
- 사용자가 말하는 `Brightness`는 FL Studio 테마 파일 안에서는 주로 `Lightness` 필드와 연결해서 검토한다.
- 코드 식별자와 파일 포맷 키는 번역하지 않는다.

## 현재 제품 상태

- React/Vite 앱에서 4-6개의 HEX 색상으로 `.flstheme` 파일을 생성한다.
- UI에는 팔레트 프리셋, 커스텀 색상 생성, 로컬 팔레트 히스토리, 라이트 모드 중심의 앱 테마, 전역 조정값, FL Studio 스타일 미리보기가 있다.
- 테마 생성은 `src/fixtures/templates/Grape.flstheme`를 기본 템플릿으로 사용한다.
- 샘플 테마는 `npm run generate:samples`로 재생성한다.
- 현재 기준 검증 명령은 다음과 같다.

```bash
npm run generate:samples
npm test
npm run lint
npm run build
```

## 현재까지 확인한 인코딩 규칙

이 규칙은 다음 근거를 바탕으로 정리했다.

- 로컬에서 생성한 샘플 테마
- 사용자가 FL Studio에서 직접 확인한 결과
- `/mnt/c/Users/sonju/Desktop/song/FLTHMSETUPv2 [@MAJORMZA]`에 있는 외부 테마 셋업 도구
- Image-Line 공식 매뉴얼
- `sample/Fl Studio Themes`에 추가된 외부 테마 파일들

### Raw RGB로 저장해야 하는 필드

현재 생성기에서는 다음 필드를 raw RGB 계열 정수로 저장한다.

- `Selected`
- `TextColor`

이 처리는 `src/mapper.ts`의 `themeColorCodec`에 모아져 있다.

중요한 버그 기록:

- `Selected=#E4B4C9`를 BGR 방식으로 저장했을 때 FL Studio에서는 `#C9B4E4`처럼 보라색 계열로 표시됐다.
- 따라서 `Selected`는 BGR/COLORREF가 아니라 raw RGB로 유지해야 한다.

### BGR/COLORREF로 저장하는 필드

현재 생성기에서는 다음 필드를 BGR/COLORREF 계열 signed 24-bit 값으로 저장한다.

- `Highlight`
- `Mute`
- `Option`
- `StepEven`
- `StepOdd`
- `Meter0`부터 `Meter5`
- `BackColor`
- `PRGridback`
- `PLGridback`
- `EEGridback`
- `NoteColor0`부터 `NoteColor15`

중요한 버그 기록:

- FL Studio 기본 테마에서 `NoteColor0`만 `#FFB7CE`로 바꿔 export한 `sample/note pink.flstheme`의 값은 `NoteColor0=13547519`였다.
- `13547519 = 0xCEB7FF`이며, BGR/COLORREF 방식으로 읽으면 `#FFB7CE`가 된다.
- 따라서 `.flstheme` 안의 `NoteColor*`는 raw RGB나 ARGB가 아니라 BGR/COLORREF로 저장해야 한다.

### `.ncp` 형식은 `.flstheme`의 `NoteColor*`와 분리해서 다룬다

외부 테마의 `.ncp` 파일은 `AARRGGBB` 텍스트 형식을 쓴다.

예시:

```txt
sample/Fl Studio Themes/Midnight Pro/Midnight Pro.flstheme
NoteColor4=-13880833 -> 0xFF2C31FF
```

같은 테마의 `.ncp` 파일에는 다음 값이 있다.

```txt
Color4=FF2C31FF
```

이것은 `.ncp`가 `AARRGGBB` 형식을 쓴다는 근거다.

단, 사용자가 직접 export한 `note pink.flstheme` 기준으로 `.flstheme`의 `NoteColor*`는 BGR/COLORREF로 확인됐다. 따라서 `.ncp`의 `AARRGGBB` 규칙을 `.flstheme`의 `NoteColor*`에 적용하면 안 된다.

## 전역 조정값 규칙

`.flstheme`의 전역 조정 필드는 단순 색상 인코딩이 아니라 FL Studio 내부에서 후처리처럼 작동하는 값으로 보인다.

- `Hue`
- `Saturation`
- `Lightness`
- `Contrast`
- `Text`

현재 모델:

- `Hue`는 팔레트 배경색의 hue(°)를 기준으로 단일 선형 공식으로 자동 계산한다.
  ```
  fileHue = round(-(bgHsl.h - 202) * (63 / 69))
  ```
  - 중립점 202°(청록-차트러스 경계)에서 fileHue=0
  - h=340° (warm pink, #FFB7CE) → fileHue=-126 (knob=0.15)
  - h=151° (mint green, #A9D9C2) → fileHue=+47 (knob≈0.630)
  - h=215° (blue-gray, #D0DAE6) → fileHue=-13 (knob≈0.464)
- `Grape` 조정 프리셋은 다음 값을 사용한다.
  - `Saturation=256`
  - `Lightness=132`
  - `Contrast=64`
  - `Text=-191`
- zero adjustment 비교값은 실제 UI에서 제거했다.
- 비교가 필요하면 테스트나 임시 diagnostics에서만 다룬다.

`#FFB7CE`에 대한 사용자 관찰:

- `Selected` 자체가 핵심 문제는 아니었다.
- FL Studio 안의 브라우저와 전체 UI 색상을 입력한 핑크에 더 가깝게 보이게 하려면 `Hue`는 낮추고 `Brightness/Lightness`는 올려야 했다.
- 현재 공식으로 `#FFB7CE`(h≈340°)는 `Hue=-126`을 자동 계산한다.

중요 원칙:

- 전역 조정값 문제를 해결하려고 개별 색상 필드의 인코딩 방식을 섣불리 바꾸면 안 된다.

## 외부 테마 분석 결과 요약

외부 `.flstheme` 파일 분석을 통해 확인한 주요 사항:

- 대부분은 49개 키 구조를 갖지만, 33~47줄짜리 테마도 유효하다.
- `PRGridCustom`, `PLGridCustom`, `EEGridCustom` 값은 테마마다 다르다.
- 일부 테마에는 `WaveClr0`~`WaveClr5`, `WaveSpc0`~`WaveSpc5`가 있다.
- 몇몇 테마는 현재 생성기가 patch하려는 키를 모두 갖고 있지 않다. 향후 importer 구현 시 누락된 키를 허용해야 한다.
- `.ncp` 포맷 검증 픽스처는 `src/fixtures/midnight-pro.ncp`에 보관한다.

## 현재 생성 샘플

생성 샘플은 `sample/` 아래에 있으며 다음 명령으로 재생성한다.

```bash
npm run generate:samples
```

현재 정의된 샘플:

- `Grape.flstheme` — `grape-night` 프리셋, 기본 조정값
- `sky-fresh.flstheme` — `#89CFF0` 단색 생성, `INPUT_COLOR_ADJUSTMENTS`
- `bb.flstheme` — `#FFB7CE` 단색 생성, `INPUT_COLOR_ADJUSTMENTS`, `Hue=-126`

샘플 목록은 `src/sampleThemes.ts`에서 관리한다.

## 주요 리스크

- FL Studio 테마 포맷은 코드베이스 안에 공식 스펙으로 존재하지 않는다.
- Image-Line 공식 매뉴얼은 UI 동작은 설명하지만 숫자 인코딩 방식은 자세히 설명하지 않는다.
- 어떤 값은 signed 24-bit처럼 보이고, 어떤 값은 signed 32-bit처럼 보인다.
- FL Studio는 `Browser`, `Playlist`, `Piano Roll`, `Settings`, clip 영역에서 색상을 서로 다르게 혼합하거나 후처리할 수 있다.
- 앱 미리보기는 근사값 확인에는 유용하지만, 실제 FL Studio에서의 관찰 결과가 우선이다.
- 특정 필드 하나에서 확인한 인코딩 규칙을 모든 필드에 일반화하면 안 된다.

## 구현 원칙

- 필드별 인코딩 규칙은 한곳에 모은다.
- 생성되는 `.flstheme` 파일은 CRLF를 유지한다.
- 명확히 필요하지 않으면 새 의존성을 추가하지 않는다.
- 샘플 파일은 손으로 고치기보다 생성 스크립트로 재생성한다.
- FL Studio에서 발견한 동작은 회귀 테스트로 고정한다.
- `Selected`, `TextColor`는 BGR/COLORREF 필드와 분리해서 다룬다.
- `NoteColor*`는 `sample/note pink.flstheme` 근거에 따라 BGR/COLORREF로 유지한다.
- 전역 조정값 보정과 개별 필드 색상 매핑은 섞지 않는다.

## 다음 마일스톤 수용 기준

- 같은 팔레트에서 `.flstheme`과 `.ncp`를 함께 생성할 수 있다.
- `NoteColor*` 동작은 테스트와 외부 테마 근거로 설명 가능하다.
- 샘플은 한 명령으로 재생성할 수 있다.
- 최소 하나 이상의 짧은 외부 테마를 테스트에서 파괴적 변경 없이 파싱한다.
- `Selected`는 raw RGB로 유지되며 BGR 회귀가 없다.
- `#FFB7CE` 샘플은 `Hue=-126`, `Lightness=132` 기준을 유지한다.
- 다음 검증이 모두 통과한다.

```bash
npm run generate:samples
npm test
npm run lint
npm run build
```

## 아직 열린 질문

- `.ncp`를 실제 FL Studio에서 따로 import해야 하는가, 아니면 `.flstheme`만으로 note color가 충분히 반영되는가?
- FL Studio가 `0xFFRRGGBB`의 alpha 값을 실제로 의미 있게 쓰는가, 아니면 단순히 허용만 하는가?
- `Browser` 배경, `Browser` 선택 행, `Browser` 텍스트에 각각 영향을 주는 필드는 정확히 무엇인가?
- `Lightmode`는 사용자가 선택해야 하는가, 팔레트 밝기에서 자동 추론해야 하는가?
- `GridContrast`는 팔레트에서 계산해야 하는가, 기본 템플릿 값을 보존해야 하는가?

## 회귀 금지 항목

- `Selected`를 BGR/COLORREF로 저장하지 않는다.
- 새로운 FL Studio 근거 없이 `TextColor`를 BGR/COLORREF로 바꾸지 않는다.
- 새로운 FL Studio 근거 없이 `.flstheme`의 `NoteColor*`를 ARGB/raw RGB로 바꾸지 않는다.
- 손으로 수정한 샘플과 생성 스크립트 기반 샘플을 섞어 관리하지 않는다.
- 전역 H/S/B 조정값과 개별 필드 색상 인코딩을 혼동하지 않는다.
- 모든 실제 `.flstheme` 파일이 모든 키를 갖고 있다고 가정하지 않는다.
