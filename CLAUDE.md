# SisoWorldtime — Claude 프로젝트 가이드

## 프로젝트 개요
비즈니스 세계 시각 비교 도구. MapLibre GL 지도 + 시간대별 컬러링 + 3도시 시간 비교.

## 핵심 파일
- `src/components/WorldMap.tsx` — 지도 + 레이어 + 도시 마커 (~210줄)
- `src/components/CityTimeBar.tsx` — 24시간 바 컴포넌트
- `src/components/DateStrip.tsx` — 날짜 선택 스트립
- `src/constants/map.ts` — MAP_STYLE, TZ_ABBR_MAP, 도시 목록
- `src/utils/labelPlacement.ts` — 라벨 겹침 해결 알고리즘
- `src/store/useWorldTimeStore.ts` — Zustand 스토어 (3슬롯 + localStorage)
- `scripts/colorize-admin1.cjs` — GeoJSON 시간대 색상 빌드 스크립트

## GeoJSON 데이터 (public/)
- `ne_admin1.geojson` (1.3MB) — 시간대별 dissolve된 31개 그룹, tzColor 포함
- `coastline.geojson` (0.88MB) — 모든 땅 merge한 해안선
- `tz-boundaries.geojson` (0.18MB) — 시간대 경계선만

GeoJSON 색상 재생성: `node scripts/colorize-admin1.cjs`

## 해결해야 할 문제
→ `docs/PLAN.md` 참조

## 배포
- **라이브**: https://siso-worldtime.vercel.app
- **수동 배포**: `npx vercel --prod`
- **자동 배포**: 미설정 (sisolab GitHub org에 Vercel App 설치 필요)
