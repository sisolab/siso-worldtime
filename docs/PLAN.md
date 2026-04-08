# SisoWorldtime 구현 계획

## 개요
업무 목적 세계 시각 비교 도구. 지도에서 도시 선택 → 3개 시간 바로 시간대 비교.
- **라이브**: https://siso-worldtime.vercel.app
- **GitHub**: https://github.com/sisolab/siso-worldtime

## 완료된 작업

### ✅ 1단계: 핵심 기능
- [x] Vite + React 19 + TypeScript + Zustand
- [x] MapLibre GL 지도 (admin-1 시간대 컬러링, 해안선, 국경선, 시간대 경계선)
- [x] 바다 밤/낮 오버레이 (4단계: 아침/오후/저녁/밤)
- [x] 14개 대표 도시 마커 + 라벨 (겹침 자동 해결)
- [x] 하단 패널: 24시간 바 × 3슬롯, 날짜 스트립, 호버 동기화
- [x] 시간대 약어 표시 (PST/PDT, JST 등)
- [x] 도시 선택 localStorage 저장
- [x] Noto Sans 폰트

### ✅ 2단계: 배포
- [x] GitHub push (sisolab/siso-worldtime)
- [x] Vercel 배포 (수동, siso-worldtime.vercel.app)

### ✅ 3단계: 리팩토링
- [x] 죽은 파일/패키지 제거 (14파일, 11패키지, 2.3MB)
- [x] WorldMap.tsx 분할 (493줄 → 210줄 + CityTimeBar + DateStrip)
- [x] 스토어/유틸 정리

---

## 🔲 해결해야 할 문제

### 높음
- [ ] **#9 도시 토글 시 라벨 재계산**: 현재 `onMapLoad`에서만 겹침 감지 실행. 도시 추가/제거 시에도 `computeAboveCities` 재실행 필요
- [ ] **#7 모바일 대응**: 고정 900px 레이아웃, 모바일에서 잘림. 가로 스크롤 허용 또는 반응형 추가

### 중간
- [ ] **#3 DST 정밀도**: `getUtcOffsetHours`에 `activeTime` 전달 완료. 단, GeoJSON 색상은 빌드 시점 DST 고정 — 극단적 케이스(12월 선택 시)에서 지도 색상 미세 차이 가능
- [ ] **#14 번들 크기**: maplibre-gl 1MB. `React.lazy` + dynamic import로 코드 스플릿 가능
- [ ] **#4 날짜 계산 edge case**: 비-레퍼런스 바 첫 셀 날짜가 `h > 12`로 판단 — 정밀 UTC 변환으로 개선 필요

### 낮음
- [ ] **#6 날짜변경선 통과 지역**: Alaska, Chukotka, Fiji 미표시 (polygon split 필요)
- [ ] **#10 날짜 스트립 스크롤**: offset 교체 방식 → 순수 슬라이드 스크롤로 개선
- [ ] **#11 런타임 지도 색상**: GeoJSON 색상 빌드 고정 → MapLibre expression으로 런타임 변경 가능하나 복잡도 대비 이득 적음
- [ ] **#1 Vercel 자동 배포**: `sisolab` GitHub org에 Vercel GitHub App 설치 필요 (현재 수동 배포)

---

## 기술 스택

| 역할 | 라이브러리 |
|------|------------|
| 프레임워크 | Vite + React 19 + TypeScript |
| 상태 관리 | Zustand 5 |
| 지도 | MapLibre GL (react-map-gl/maplibre) |
| 타일 | OpenFreeMap (무료, API 키 불필요) |
| 타임존 계산 | `Intl.DateTimeFormat` (native, DST 자동) |
| 폰트 | Noto Sans (Google Fonts) |
| 배포 | Vercel |
