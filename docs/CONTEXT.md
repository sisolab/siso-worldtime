# SisoWorldtime 구현 컨텍스트

## 설계 결정

### 타임존 처리
- `Intl.DateTimeFormat` 사용 (native browser API) → DST 자동 처리
- IANA 타임존 ID 저장 (e.g. "Asia/Seoul", "America/New_York")
- UTC 오프셋은 런타임에 계산 (DST로 변동)

### 바 큐 로직
- fixed 바 = 상단 고정, unfixed 바 = 하단 슬라이딩
- 새 도시 추가 시 unfixed 바만 교체 (oldest first)
- 모두 fixed 시 토스트 알림 후 블록

### 업무시간/달력 모드
- 전체 바 중 하나에만 활성화 (mutually exclusive)
- activeMode: `{ type: 'none' | 'business' | 'calendar', barIndex, date? }`
- 하나 활성화하면 이전 것 자동 해제

### 9칸 바 표시
- 기본: 현재 시각 중심 ±4시간 (해당 도시 타임존 기준)
- 업무 모드: 09, 10, 11, 12, 13, 14, 15, 16, 17 고정
- 달력 모드: 선택 날짜/시각 기준 ±4시간
- 날짜 뱃지: 오늘과 다른 날이면 "+1", "-1", "M/D" 표시

### 오전 9시 기준선
- 현재 UTC 시각 기준으로 `targetOffset = 9 - utcHour` 계산
- 해당 오프셋 × 15° 경도에 파란 점선 표시
- 1시간마다 갱신 (setInterval 60초)

### Vite 버전
- Vite 8은 Rolldown(Rust bundler) 사용 → Windows 환경에서 번들링 단계 무음 실패 확인
- Vite 5로 다운그레이드 → Rollup(pure JS) → 정상 빌드

### Labnsoft-UI 통합
- 순수 CSS 디자인 시스템, npm 패키지 아님
- 프로젝트 내 복사 (src/assets/labnsoft-ui/)
- Vercel 배포 시 COMMON/ 디렉토리 접근 불가하므로 반드시 복사 필요
- tokens + components 전체 복사 필요 (@import 체인)

## 주요 파일 구조
```
src/
├── components/WorldMap.tsx   # react-simple-maps 지도
├── components/TimeBar.tsx    # 9칸 시간 바
├── data/cities.ts            # 65개 도시 데이터
├── store/useWorldTimeStore.ts # Zustand 상태
└── utils/timeUtils.ts        # 시간 계산 유틸
public/world-110m.json        # Natural Earth TopoJSON
```
