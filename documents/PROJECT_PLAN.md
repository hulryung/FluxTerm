# GoTerm - 웹 기반 시리얼/SSH 터미널 클라이언트

## 1. 프로젝트 개요

### 1.1 목적
SecureCRT, TeraTerm을 대체하는 웹 기반 터미널 클라이언트 개발

### 1.2 핵심 가치
- **크로스플랫폼**: Windows, Linux, macOS에서 동일하게 동작
- **포터블**: 단일 바이너리로 배포, 설치 불필요
- **웹 기반 UI**: 브라우저에서 접속, 어디서나 사용 가능
- **확장성**: 시리얼 → SSH → Telnet 순차 지원

### 1.3 주요 기능
| 기능 | Phase 1 (MVP) | Phase 2 | Phase 3 |
|------|---------------|---------|---------|
| 시리얼 통신 | ✅ | ✅ | ✅ |
| SSH 클라이언트 | - | ✅ | ✅ |
| Telnet | - | - | ✅ |
| 세션 관리 | ✅ | ✅ | ✅ |
| 로그 저장 | ✅ | ✅ | ✅ |
| 매크로/스크립트 | - | ✅ | ✅ |

---

## 2. 기능 요구사항

### 2.1 시리얼 통신 (Phase 1 - MVP)

#### 2.1.1 포트 관리
- 사용 가능한 COM 포트 자동 탐지 (Windows: COM*, Linux: /dev/tty*)
- 포트 설정:
  - Baudrate: 300 ~ 4000000 (커스텀 값 지원)
  - Data bits: 5, 6, 7, 8
  - Stop bits: 1, 1.5, 2
  - Parity: None, Odd, Even, Mark, Space
  - Flow control: None, RTS/CTS, XON/XOFF
- 포트 연결/해제
- DTR, RTS 수동 제어

#### 2.1.2 터미널 기능
- 실시간 데이터 송수신
- 표시 모드:
  - ASCII 텍스트
  - HEX 덤프
  - Mixed (ASCII + HEX)
- 줄바꿈 설정: CR, LF, CR+LF
- 로컬 에코 on/off
- 타임스탬프 표시
- ANSI 이스케이프 시퀀스 지원 (xterm-256color)

#### 2.1.3 데이터 송신
- 텍스트 직접 입력
- HEX 값 입력 (예: `0x55 0xAA 0x01`)
- 파일 전송 (바이너리, 텍스트)
- 자동 줄바꿈 추가 옵션

#### 2.1.4 로깅
- 세션 로그 자동/수동 저장
- 로그 포맷: Plain text, Timestamped, HEX dump
- 로그 파일 자동 회전 (크기/시간 기반)

### 2.2 세션 관리

#### 2.2.1 세션 프로파일
- 연결 설정 저장/불러오기
- 세션 그룹화 (폴더 구조)
- 빠른 연결 (최근 사용, 즐겨찾기)

#### 2.2.2 다중 세션
- 탭 기반 다중 세션
- 세션 간 빠른 전환
- 세션 복제

### 2.3 SSH 클라이언트 (Phase 2)

#### 2.3.1 인증
- Password 인증
- Public key 인증 (RSA, ECDSA, Ed25519)
- Keyboard-interactive
- Agent forwarding

#### 2.3.2 기능
- 터미널 에뮬레이션 (xterm-256color)
- 포트 포워딩 (Local, Remote, Dynamic/SOCKS)
- SCP/SFTP 파일 전송
- X11 Forwarding

### 2.4 웹 UI 기능

#### 2.4.1 터미널 뷰
- xterm.js 기반 터미널 렌더링
- 복사/붙여넣기
- 검색 (Ctrl+F)
- 폰트 크기 조절
- 테마 (다크/라이트/커스텀)

#### 2.4.2 설정 UI
- 포트/연결 설정 폼
- 세션 관리자
- 전역 설정

---

## 3. 기술 스택

### 3.1 Backend (Go)

| 분야 | 라이브러리 | 용도 |
|------|-----------|------|
| 웹 프레임워크 | `github.com/gin-gonic/gin` | REST API, 정적 파일 서빙 |
| WebSocket | `github.com/gorilla/websocket` | 실시간 터미널 통신 |
| 시리얼 통신 | `go.bug.st/serial` | 크로스플랫폼 시리얼 포트 |
| SSH | `golang.org/x/crypto/ssh` | SSH 클라이언트 |
| 설정 파일 | `github.com/spf13/viper` | YAML/JSON 설정 |
| 로깅 | `go.uber.org/zap` | 구조화된 로깅 |
| 임베딩 | `embed` (표준라이브러리) | 프론트엔드 파일 임베딩 |

### 3.2 Frontend

| 분야 | 기술 | 용도 |
|------|------|------|
| 프레임워크 | React 18 + TypeScript | UI 구성 |
| 터미널 | xterm.js | 터미널 에뮬레이션 |
| 상태관리 | Zustand | 경량 상태관리 |
| 스타일 | Tailwind CSS | 유틸리티 CSS |
| 빌드 | Vite | 빠른 개발/빌드 |
| 아이콘 | Lucide React | 아이콘 |

### 3.3 빌드/배포

- 단일 바이너리: Go embed로 프론트엔드 포함
- 크로스 컴파일: `GOOS`/`GOARCH` 조합
- 대상 플랫폼:
  - Windows (amd64, arm64)
  - Linux (amd64, arm64)
  - macOS (amd64, arm64)

---

## 4. 아키텍처 설계

### 4.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              React Frontend                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │   │
│  │  │ Session │ │ Settings│ │   Terminal      │   │   │
│  │  │ Manager │ │   UI    │ │   (xterm.js)    │   │   │
│  │  └─────────┘ └─────────┘ └─────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Go Backend                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   HTTP Server                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │ REST API │  │ WebSocket│  │ Static Files │   │  │
│  │  │ Handler  │  │ Handler  │  │   (embed)    │   │  │
│  │  └──────────┘  └──────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 Core Services                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │ Session  │  │  Serial  │  │    SSH       │   │  │
│  │  │ Manager  │  │ Manager  │  │   Manager    │   │  │
│  │  └──────────┘  └──────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   Adapters                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │  Serial  │  │   SSH    │  │   Config     │   │  │
│  │  │  Port    │  │  Client  │  │   Storage    │   │  │
│  │  └──────────┘  └──────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
    ┌──────────────┐     ┌──────────────┐
    │  COM Port    │     │  SSH Server  │
    │  /dev/ttyUSB │     │  (Remote)    │
    └──────────────┘     └──────────────┘
```

### 4.2 핵심 컴포넌트

#### Backend 레이어

1. **HTTP Server Layer**
   - REST API: 세션/설정 CRUD
   - WebSocket: 실시간 터미널 I/O
   - Static: 임베딩된 프론트엔드

2. **Core Services**
   - SessionManager: 세션 생명주기 관리
   - SerialManager: 시리얼 포트 풀 관리
   - SSHManager: SSH 연결 풀 관리

3. **Adapters**
   - SerialPort: 실제 시리얼 통신
   - SSHClient: SSH 프로토콜 처리
   - ConfigStorage: 설정 파일 영속화

---

## 5. 디렉토리 구조

```
go-serial/
├── cmd/
│   └── goterm/
│       └── main.go              # 애플리케이션 진입점
│
├── internal/
│   ├── api/
│   │   ├── handler/
│   │   │   ├── serial.go        # 시리얼 관련 핸들러
│   │   │   ├── session.go       # 세션 관리 핸들러
│   │   │   ├── settings.go      # 설정 핸들러
│   │   │   └── websocket.go     # WebSocket 핸들러
│   │   ├── middleware/
│   │   │   ├── cors.go
│   │   │   └── logging.go
│   │   └── router.go            # 라우터 설정
│   │
│   ├── core/
│   │   ├── session/
│   │   │   ├── manager.go       # 세션 매니저
│   │   │   ├── session.go       # 세션 구조체
│   │   │   └── types.go         # 세션 타입 정의
│   │   ├── serial/
│   │   │   ├── manager.go       # 시리얼 매니저
│   │   │   ├── port.go          # 포트 래퍼
│   │   │   ├── scanner.go       # 포트 스캐너
│   │   │   └── config.go        # 시리얼 설정
│   │   └── ssh/                 # Phase 2
│   │       ├── manager.go
│   │       ├── client.go
│   │       └── config.go
│   │
│   ├── config/
│   │   ├── config.go            # 설정 구조체
│   │   ├── loader.go            # 설정 로더
│   │   └── defaults.go          # 기본값
│   │
│   ├── storage/
│   │   ├── profile.go           # 프로파일 저장소
│   │   └── log.go               # 로그 저장소
│   │
│   └── terminal/
│       ├── buffer.go            # 터미널 버퍼
│       ├── parser.go            # ANSI 파서
│       └── encoding.go          # 인코딩 처리
│
├── pkg/
│   ├── protocol/
│   │   └── ws/
│   │       ├── message.go       # WebSocket 메시지 타입
│   │       └── codec.go         # 메시지 인코딩/디코딩
│   └── utils/
│       ├── hex.go               # HEX 유틸리티
│       └── platform.go          # 플랫폼별 유틸리티
│
├── web/                         # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── Terminal/
│   │   │   │   ├── Terminal.tsx
│   │   │   │   ├── TerminalTabs.tsx
│   │   │   │   └── TerminalToolbar.tsx
│   │   │   ├── SessionManager/
│   │   │   │   ├── SessionList.tsx
│   │   │   │   ├── SessionForm.tsx
│   │   │   │   └── QuickConnect.tsx
│   │   │   ├── Settings/
│   │   │   │   ├── SerialSettings.tsx
│   │   │   │   ├── DisplaySettings.tsx
│   │   │   │   └── GeneralSettings.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Select.tsx
│   │   │       └── Modal.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useSerial.ts
│   │   │   └── useTerminal.ts
│   │   ├── stores/
│   │   │   ├── sessionStore.ts
│   │   │   ├── terminalStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── services/
│   │   │   ├── api.ts           # REST API 클라이언트
│   │   │   └── ws.ts            # WebSocket 클라이언트
│   │   ├── types/
│   │   │   ├── serial.ts
│   │   │   ├── session.ts
│   │   │   └── message.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── configs/
│   └── default.yaml             # 기본 설정 파일
│
├── scripts/
│   ├── build.sh                 # 빌드 스크립트
│   └── release.sh               # 릴리즈 스크립트
│
├── documents/
│   └── PROJECT_PLAN.md          # 이 문서
│
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## 6. 핵심 인터페이스 및 타입

### 6.1 Go Backend

```go
// === internal/core/session/types.go ===

type SessionType string

const (
    SessionTypeSerial SessionType = "serial"
    SessionTypeSSH    SessionType = "ssh"
    SessionTypeTelnet SessionType = "telnet"
)

type SessionState string

const (
    StateDisconnected SessionState = "disconnected"
    StateConnecting   SessionState = "connecting"
    StateConnected    SessionState = "connected"
    StateError        SessionState = "error"
)

type Session struct {
    ID        string       `json:"id"`
    Name      string       `json:"name"`
    Type      SessionType  `json:"type"`
    State     SessionState `json:"state"`
    Config    any          `json:"config"` // SerialConfig | SSHConfig
    CreatedAt time.Time    `json:"created_at"`
}

// === internal/core/serial/config.go ===

type SerialConfig struct {
    Port        string      `json:"port"`
    BaudRate    int         `json:"baud_rate"`
    DataBits    int         `json:"data_bits"`
    StopBits    StopBits    `json:"stop_bits"`
    Parity      Parity      `json:"parity"`
    FlowControl FlowControl `json:"flow_control"`
}

type StopBits float32

const (
    StopBits1   StopBits = 1
    StopBits1_5 StopBits = 1.5
    StopBits2   StopBits = 2
)

type Parity string

const (
    ParityNone  Parity = "none"
    ParityOdd   Parity = "odd"
    ParityEven  Parity = "even"
    ParityMark  Parity = "mark"
    ParitySpace Parity = "space"
)

type FlowControl string

const (
    FlowNone   FlowControl = "none"
    FlowRTSCTS FlowControl = "rtscts"
    FlowXONOFF FlowControl = "xonxoff"
)

// === internal/core/serial/manager.go ===

type SerialManager interface {
    // 사용 가능한 포트 목록 조회
    ListPorts() ([]PortInfo, error)

    // 포트 열기
    Open(config SerialConfig) (Port, error)

    // 포트 닫기
    Close(portName string) error

    // 열린 포트 조회
    GetPort(portName string) (Port, bool)
}

type Port interface {
    // 데이터 읽기 (논블로킹)
    Read(buf []byte) (int, error)

    // 데이터 쓰기
    Write(data []byte) (int, error)

    // 포트 설정 변경
    SetConfig(config SerialConfig) error

    // DTR 핀 제어
    SetDTR(value bool) error

    // RTS 핀 제어
    SetRTS(value bool) error

    // 포트 닫기
    Close() error
}

type PortInfo struct {
    Name         string `json:"name"`
    Description  string `json:"description"`
    IsUSB        bool   `json:"is_usb"`
    VID          string `json:"vid,omitempty"`
    PID          string `json:"pid,omitempty"`
    SerialNumber string `json:"serial_number,omitempty"`
}

// === internal/core/session/manager.go ===

type SessionManager interface {
    // 새 세션 생성
    Create(name string, sessionType SessionType, config any) (*Session, error)

    // 세션 연결
    Connect(sessionID string) error

    // 세션 연결 해제
    Disconnect(sessionID string) error

    // 세션 삭제
    Delete(sessionID string) error

    // 세션 조회
    Get(sessionID string) (*Session, bool)

    // 전체 세션 목록
    List() []*Session

    // 데이터 송신
    Write(sessionID string, data []byte) error

    // 데이터 수신 채널
    Subscribe(sessionID string) (<-chan []byte, error)
}

// === pkg/protocol/ws/message.go ===

type MessageType string

const (
    MsgTypeData       MessageType = "data"
    MsgTypeControl    MessageType = "control"
    MsgTypeStatus     MessageType = "status"
    MsgTypeError      MessageType = "error"
)

type WSMessage struct {
    Type      MessageType `json:"type"`
    SessionID string      `json:"session_id,omitempty"`
    Payload   any         `json:"payload"`
    Timestamp int64       `json:"timestamp"`
}

type DataPayload struct {
    Data     []byte `json:"data"`      // Base64 인코딩
    Encoding string `json:"encoding"`  // "raw" | "base64"
}

type ControlPayload struct {
    Action string         `json:"action"` // "connect" | "disconnect" | "resize"
    Params map[string]any `json:"params,omitempty"`
}

type StatusPayload struct {
    State   SessionState `json:"state"`
    Message string       `json:"message,omitempty"`
}
```

### 6.2 TypeScript Frontend

```typescript
// === types/serial.ts ===

export interface SerialConfig {
  port: string;
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 1.5 | 2;
  parity: 'none' | 'odd' | 'even' | 'mark' | 'space';
  flowControl: 'none' | 'rtscts' | 'xonxoff';
}

export interface PortInfo {
  name: string;
  description: string;
  isUSB: boolean;
  vid?: string;
  pid?: string;
  serialNumber?: string;
}

// === types/session.ts ===

export type SessionType = 'serial' | 'ssh' | 'telnet';
export type SessionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Session {
  id: string;
  name: string;
  type: SessionType;
  state: SessionState;
  config: SerialConfig | SSHConfig;
  createdAt: string;
}

// === types/message.ts ===

export type MessageType = 'data' | 'control' | 'status' | 'error';

export interface WSMessage {
  type: MessageType;
  sessionId?: string;
  payload: DataPayload | ControlPayload | StatusPayload | ErrorPayload;
  timestamp: number;
}

export interface DataPayload {
  data: string;  // Base64
  encoding: 'raw' | 'base64';
}

export interface ControlPayload {
  action: 'connect' | 'disconnect' | 'resize';
  params?: Record<string, unknown>;
}

export interface StatusPayload {
  state: SessionState;
  message?: string;
}
```

---

## 7. API 설계

### 7.1 REST API

```
Base URL: http://localhost:8080/api/v1

# 시리얼 포트
GET    /ports                    # 사용 가능한 포트 목록
GET    /ports/:name              # 포트 상세 정보

# 세션 관리
GET    /sessions                 # 세션 목록
POST   /sessions                 # 새 세션 생성
GET    /sessions/:id             # 세션 상세
PUT    /sessions/:id             # 세션 수정
DELETE /sessions/:id             # 세션 삭제
POST   /sessions/:id/connect     # 연결
POST   /sessions/:id/disconnect  # 연결 해제

# 프로파일 (저장된 설정)
GET    /profiles                 # 프로파일 목록
POST   /profiles                 # 프로파일 저장
GET    /profiles/:id             # 프로파일 상세
PUT    /profiles/:id             # 프로파일 수정
DELETE /profiles/:id             # 프로파일 삭제

# 설정
GET    /settings                 # 전역 설정 조회
PUT    /settings                 # 전역 설정 수정
```

### 7.2 WebSocket API

```
Endpoint: ws://localhost:8080/ws

# 클라이언트 → 서버

## 데이터 송신
{
  "type": "data",
  "session_id": "uuid",
  "payload": {
    "data": "SGVsbG8=",  // Base64
    "encoding": "base64"
  }
}

## 제어 명령
{
  "type": "control",
  "session_id": "uuid",
  "payload": {
    "action": "connect",
    "params": { "port": "COM3", "baud_rate": 115200 }
  }
}

## 터미널 리사이즈
{
  "type": "control",
  "session_id": "uuid",
  "payload": {
    "action": "resize",
    "params": { "cols": 120, "rows": 40 }
  }
}

# 서버 → 클라이언트

## 수신 데이터
{
  "type": "data",
  "session_id": "uuid",
  "payload": {
    "data": "SGVsbG8gV29ybGQ=",
    "encoding": "base64"
  },
  "timestamp": 1704787200000
}

## 상태 변경
{
  "type": "status",
  "session_id": "uuid",
  "payload": {
    "state": "connected",
    "message": "Connected to COM3"
  },
  "timestamp": 1704787200000
}

## 에러
{
  "type": "error",
  "session_id": "uuid",
  "payload": {
    "code": "PORT_BUSY",
    "message": "Port COM3 is already in use"
  },
  "timestamp": 1704787200000
}
```

---

## 8. 마일스톤 및 개발 단계

### Phase 1: MVP (시리얼 터미널)

**목표**: 기본적인 시리얼 통신 및 터미널 기능

1. **프로젝트 초기 설정**
   - Go 모듈 초기화
   - React 프로젝트 생성
   - 기본 디렉토리 구조 구축

2. **시리얼 백엔드 핵심**
   - 포트 스캐너 구현
   - 시리얼 매니저/포트 래퍼
   - 기본 REST API

3. **WebSocket 통신**
   - WebSocket 핸들러
   - 메시지 프로토콜 구현
   - 세션 별 데이터 라우팅

4. **프론트엔드 기본**
   - xterm.js 터미널 컴포넌트
   - 포트 선택 UI
   - 연결 설정 폼

5. **통합 및 빌드**
   - 프론트엔드 임베딩
   - 단일 바이너리 빌드
   - 기본 테스트

**산출물**: COM 포트 연결/통신이 가능한 웹 터미널

---

### Phase 2: 기능 확장

**목표**: 실용적인 터미널 클라이언트

1. **세션 관리**
   - 다중 세션 (탭)
   - 세션 프로파일 저장/불러오기
   - 세션 그룹화

2. **터미널 기능 강화**
   - HEX 뷰 모드
   - 검색 기능
   - 로그 저장

3. **SSH 클라이언트**
   - SSH 연결 구현
   - 인증 (password, public key)
   - 터미널 리사이즈

4. **UI/UX 개선**
   - 테마 지원
   - 단축키
   - 설정 UI

---

### Phase 3: 고급 기능

**목표**: SecureCRT 수준의 기능

1. **고급 SSH**
   - 포트 포워딩
   - SCP/SFTP
   - SSH 터널

2. **자동화**
   - 매크로 녹화/재생
   - 스크립트 지원
   - 자동 응답

3. **협업/원격**
   - 원격 접속 (외부 브라우저)
   - 세션 공유
   - 권한 관리

---

## 9. 설정 파일 예시

```yaml
# configs/default.yaml

server:
  host: "127.0.0.1"
  port: 8080

serial:
  default_baud_rate: 115200
  default_data_bits: 8
  default_stop_bits: 1
  default_parity: "none"

terminal:
  default_encoding: "utf-8"
  scrollback_lines: 10000
  font_family: "Consolas, monospace"
  font_size: 14

logging:
  enabled: true
  directory: "./logs"
  max_size_mb: 10
  max_files: 5

ui:
  theme: "dark"
  locale: "ko-KR"
```

---

## 10. 검증 계획

### 10.1 단위 테스트
- 시리얼 매니저: 포트 열기/닫기, 데이터 송수신
- 세션 매니저: 세션 생명주기
- WebSocket: 메시지 인코딩/디코딩

### 10.2 통합 테스트
- REST API 엔드포인트
- WebSocket 연결 및 메시지 교환
- 프론트엔드 ↔ 백엔드 통신

### 10.3 E2E 테스트
- 실제 시리얼 장치 연결 테스트
- 다중 세션 동시 운영
- 크로스플랫폼 빌드 검증

### 10.4 수동 테스트 시나리오
1. COM 포트 목록 조회
2. 포트 연결 및 데이터 송수신
3. 연결 해제 및 재연결
4. 설정 변경 (baudrate 등)
5. 로그 저장 확인

---

## 11. 참고 자료

### 라이브러리 문서
- [go.bug.st/serial](https://pkg.go.dev/go.bug.st/serial)
- [gorilla/websocket](https://pkg.go.dev/github.com/gorilla/websocket)
- [xterm.js](https://xtermjs.org/)
- [Gin Web Framework](https://gin-gonic.com/)

### 참고 프로젝트
- [ttyd](https://github.com/tsl0922/ttyd) - 웹 기반 터미널
- [gotty](https://github.com/yudai/gotty) - Go 웹 터미널
- [web-serial-console](https://nickoala.github.io/web-serial-console/) - 웹 시리얼 콘솔
