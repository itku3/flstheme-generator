# Manual Compatibility Check

이 문서는 생성된 `.flstheme` 파일을 실제 FL Studio에서 로드한 결과를 기록하기 위한 양식이다.

## Environment

- FL Studio edition/version/build:
- OS:
- Fixture source path: `/mnt/c/Users/sonju/Documents/Image-Line/FL Studio/Settings/Themes/Grape.flstheme`
- Generated file name:
- Palette/preset name:
- Test timestamp:

## Result

- Load result: pending
- Visual result:
- Failure evidence:

## Pass Criteria

- 생성된 `.flstheme` 파일이 FL Studio에서 로드된다.
- 로드 후 앱 crash 또는 theme parse 오류가 없다.
- 전체 분위기와 강조색이 preview와 대략 일치한다.
- 주요 텍스트가 판독 가능하다.

## Failure Fallback

1. 생성 파일과 fixture의 diff-shape 테스트 결과를 확인한다.
2. patch whitelist를 더 작은 핵심 키 집합으로 줄인다.
3. 전역 조정값과 non-target key 보존 여부를 재확인한다.
4. 다른 known-good `.flstheme` fixture를 선택하고 golden tests를 갱신한다.
