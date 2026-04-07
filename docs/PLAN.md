# SisoWorldtime 구현 계획

## 개요
업무 목적 세계 시각 비교 도구. 지도에서 도시 선택 → 3개 시간 바로 시간대 비교.

## 우선순위

### ✅ 1단계: 핵심 기능 (완료)
- [x] Vite + React 19 + TypeScript 프로젝트 초기화
- [x] Labnsoft-UI 디자인 시스템 적용
- [x] 65개 주요 도시 데이터 (IANA 타임존 + 좌표)
- [x] 세계지도 컴포넌트 (react-simple-maps)
  - [x] 국가 외곽선
  - [x] 타임존 구분선 (UTC-12 ~ UTC+14)
  - [x] 오전 9시 기준선 (파란 점선)
  - [x] 도시 마커 (클릭으로 바 등록)
- [x] 3개 시간 바 컴포넌트
  - [x] 9칸 (현재 시각 ±4시간)
  - [x] Pin/삭제/업무시간/날짜지정 아이콘
  - [x] 날짜 뱃지 (+1/-1)
  - [x] 업무 모드 (09~18시 고정)
  - [x] 달력 모드 (날짜/시각 선택)
- [x] Zustand 스토어
  - [x] Fix 우선순위 로직 (fixed 바 상단)
  - [x] 슬라이딩 큐 (unfixed 바만 교체)
  - [x] 모든 바 fix 시 알림 토스트
  - [x] 업무가방/달력 mutual exclusive
- [x] 빌드 성공 (Vite 5, dist/ 생성)
- [x] git 초기 커밋

### 🔲 2단계: Vercel 배포
- [ ] GitHub 레포지토리 생성 및 push
- [ ] Vercel 프로젝트 연결 (vite 자동 감지)
- [ ] 배포 확인

### 🔲 3단계: 개선 사항 (추후)
- [ ] 지도 zoom/pan 지원
- [ ] 타임존 툴팁 (도시 hover 시 현재 시각 표시)
- [ ] 반응형 레이아웃
- [ ] 도시 검색 기능

## 실행 순서
1. 기능 개발 → 완료
2. Vercel 배포

## 의존성
- react-simple-maps → react, d3-geo, topojson-client
- world-atlas → TopoJSON 세계지도 데이터 (public/)
- Labnsoft-UI → CSS 디자인 시스템 (src/assets/labnsoft-ui/)
