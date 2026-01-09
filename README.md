# FluxTerm

웹 기반 시리얼/SSH 터미널 클라이언트 (SecureCRT/TeraTerm 대체)

## 현재 상태: Phase 1 MVP (Backend)

### 완료된 기능
- ✅ 시리얼 포트 스캔 및 관리
- ✅ 시리얼 포트 연결/해제
- ✅ REST API (포트 목록, 연결 제어)
- ✅ WebSocket 실시간 통신
- ✅ 데이터 송수신 (Base64 인코딩)

### 진행 중
- 🔄 React 프론트엔드 개발
- 🔄 xterm.js 터미널 UI

## 빠른 시작

### 요구사항
- Go 1.21+
- Windows/Linux/macOS

### 빌드
```bash
# Windows
make build

# Linux/macOS
make build

# 수동 빌드
go build -o fluxterm ./cmd/fluxterm
```

### 실행
```bash
./fluxterm

# 또는 환경변수로 설정
HOST=0.0.0.0 PORT=8080 ./fluxterm
```

서버가 시작되면:
- HTTP: `http://localhost:8080`
- WebSocket: `ws://localhost:8080/ws`

## API 사용 예시

### 사용 가능한 포트 목록
```bash
curl http://localhost:8080/api/v1/ports
```

### 포트 열기
```bash
curl -X POST http://localhost:8080/api/v1/ports/open \
  -H "Content-Type: application/json" \
  -d '{
    "port": "COM3",
    "baud_rate": 115200,
    "data_bits": 8,
    "stop_bits": 1,
    "parity": "none",
    "flow_control": "none"
  }'
```

### WebSocket 연결
```javascript
const ws = new WebSocket('ws://localhost:8080/ws');

// 연결
ws.send(JSON.stringify({
  type: 'control',
  payload: {
    action: 'connect',
    params: {
      port: 'COM3',
      baud_rate: 115200
    }
  }
}));

// 데이터 송신
ws.send(JSON.stringify({
  type: 'data',
  payload: {
    data: btoa('Hello'),  // Base64
    encoding: 'base64'
  }
}));

// 데이터 수신
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'data') {
    console.log(atob(msg.payload.data));
  }
};
```

## 프로젝트 구조

```
fluxterm/
├── cmd/fluxterm/        # 메인 애플리케이션
├── internal/
│   ├── api/             # REST API 및 라우터
│   ├── core/
│   │   └── serial/      # 시리얼 포트 관리
│   ├── config/          # 설정 관리 (예정)
│   └── storage/         # 데이터 저장소 (예정)
├── pkg/
│   └── protocol/ws/     # WebSocket 프로토콜
├── web/                 # React 프론트엔드 (예정)
└── documents/           # 문서
```

## 다음 단계

1. React 프론트엔드 구현
2. xterm.js 터미널 통합
3. 세션 관리 UI
4. 로그 저장 기능
5. SSH 클라이언트 (Phase 2)

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

Copyright (c) 2026 HUCONN Corporation

## 기여

이슈와 PR은 언제나 환영합니다!
