# Test Spec: FL Studio `.flstheme` 팔레트 생성기 MVP

## 검증 목표

생성기가 팔레트 기반 색상 매핑을 정확히 수행하는지뿐 아니라, 원본 `.flstheme` 템플릿 구조를 보존해 FL Studio 로드 가능성을 해치지 않는지 검증한다.

## Automated Tests

### Color Unit Tests

- `hexToFlColor("#9A8CE5")` returns `-6648603`.
- `flColorToHex(-6648603)` returns `#9A8CE5`.
- 0x800000 이상 RGB 값은 signed 24-bit 음수로 변환된다.
- invalid HEX 입력은 명확한 validation error를 반환한다.

### Contrast Unit Tests

- 밝은 배경에는 어두운 `TextColor`가 선택된다.
- 어두운 배경에는 밝은 `TextColor`가 선택된다.
- contrast threshold 미달 조합은 보정된다.
- 보정 결과는 주요 preview background와 최소 contrast threshold를 만족한다.

### Mapper Unit Tests

- 같은 팔레트 입력은 항상 같은 patch map을 만든다.
- patch map key는 exact whitelist의 subset이다.
- `Hue`, `Saturation`, `Lightness`, `Contrast`, `Text`는 patch map에 포함되지 않는다.
- `Meter0`-`Meter5`는 낮음에서 높음으로 읽히는 강도 배열을 만든다.
- `NoteColor0`-`NoteColor15`는 팔레트 기반 variant를 만들고 유효한 signed 24-bit 값만 반환한다.

### Format Layer Tests

- `parseThemeLines`는 `Grape.flstheme`의 라인 수와 순서를 유지하는 token array를 만든다.
- CRLF line terminator가 감지된다.
- `Key=Value`가 아닌 라인이 있어도 raw line은 보존된다.
- `patchThemeTokens`는 exact whitelist 키만 patch한다.
- missing required key fixture는 실패한다.
- duplicate whitelisted key fixture는 실패한다.
- whitelist 밖 key patch 요청은 실패한다.
- `serializeThemeLines`는 CRLF와 trailing newline policy를 유지한다.

### Golden / Diff-Shape Tests

원본 fixture와 생성 파일을 line-level로 비교한다.

- 라인 수가 바뀌지 않는다.
- 라인 순서가 바뀌지 않는다.
- 변경된 라인은 exact whitelist의 `Key=Value` 라인뿐이다.
- 변경 금지 키는 byte-equivalent하게 유지된다.
- 알 수 없는 키와 non-target raw line은 byte-equivalent하게 유지된다.
- 출력 전체가 CRLF line terminator를 사용한다.
- `Hue`, `Saturation`, `Lightness`, `Contrast`, `Text`는 원본 값과 같다.
- `PRGridCustom`, `PRGridContrast`, `PLGridCustom`, `PLGridContrast`, `EEGridCustom`, `EEGridContrast`는 원본 값과 같다.

### UI Behavior Tests

- shadcn/ui 기반 control surface가 렌더링된다.
- 프리셋 팔레트를 선택하면 preview와 generated patch summary가 갱신된다.
- HEX 입력을 수정하면 preview가 갱신된다.
- invalid HEX 입력 시 다운로드 버튼은 비활성화된다.
- invalid HEX 입력은 shadcn `Alert` 또는 field validation 상태로 표시된다.
- valid palette 상태에서 다운로드 action은 `.flstheme` Blob을 생성한다.
- 다운로드 파일명은 ASCII-safe 문자열이다.

### Build Verification

- `npm test` passes.
- `npm run build` passes.
- TypeScript diagnostics are clean.

## Manual Compatibility Gate

최종 완료 전 `docs/manual-compatibility.md`에 다음을 기록한다.

- FL Studio edition/version/build
- OS
- fixture source path
- generated file name
- palette/preset name
- test timestamp
- load result: pass/fail
- visual result: preview와 실제 테마의 분위기, 강조색, 텍스트 가독성 비교
- failure evidence: 에러 메시지, 증상, 스크린샷 또는 관찰 메모

### Pass Criteria

- 생성된 `.flstheme` 파일이 FL Studio에서 로드된다.
- 로드 후 앱 crash 또는 theme parse 오류가 없다.
- 전체 분위기와 강조색이 preview와 대략 일치한다.
- 주요 텍스트가 판독 가능하다.

### Fail Criteria

- FL Studio에서 파일 로드가 실패한다.
- 로드 후 색상이 깨지거나 기본 테마로 fallback된다.
- 주요 텍스트가 판독 불가능하다.
- preview와 실제 적용 결과가 현저히 다르다.

### Failure Fallback

1. 생성 파일과 fixture의 diff-shape 테스트 결과를 확인한다.
2. patch whitelist를 더 작은 핵심 키 집합으로 줄인다.
3. 전역 조정값과 non-target key 보존 여부를 재확인한다.
4. 사용자가 선택한 다른 known-good `.flstheme`로 fixture를 교체한다.
5. fixture provenance, exact whitelist, golden tests를 갱신한다.

## Completion Evidence

완료 보고에는 다음을 포함한다.

- 통과한 test/build 명령
- 생성 파일 diff-shape 검증 요약
- manual compatibility gate 상태: 완료 또는 남은 사용자-side verification
- 변경 파일 목록
- 남은 리스크
