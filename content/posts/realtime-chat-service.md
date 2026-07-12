---
title: "실시간 채팅 서비스 만들어보기"
date: "2023-09-28"
summary: "카카오톡 먹통 사태를 계기로 Spring Boot와 WebSocket, React를 활용하여 간단한 실시간 단체 채팅 서비스를 만들어보는 과정을 기록합니다."
tags: ["Kotlin", "Spring Boot", "WebSocket", "React", "TypeScript"]
---

## 계기
우리가 당연하게 사용하는 메신저인 카카오톡, 굳이 통계를 찾아보지 않더라도 국민 대다수가 사용하는 것은 체감할 수 있어요. 하지만 [나무위키-카카오톡/먹통](https://namu.wiki/w/%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1/%EB%A8%B9%ED%86%B5) 문서가 따로 있는 만큼 먹통이 되는 경우가 꽤 있었어요.

아래 사진은 실제로 카카오톡에 문제가 생겼을 때 대학 동기가 물어보는 메시지에요.
![카톡 안됨](/images/posts/realtime-chat-service/9ad27a7b-6df3-48a8-b4e5-bfdbaeff55a9_image.png)

저는 비슷한 문제가 발생했을 때 모일 수 있는 우리만의 아지트를 만들고 싶다는 생각을 했어요.

**그것이 이유에요. ~~멋있잖아요~~ **

</br>

## 뭘 만들까?
일단 문제 상황은 설명이 된 것 같으니 만들 서비스를 간단하게 구상해보려고 해요.
- `실시간 단체 대화 가능` : 우리만의 아지트이기 때문에 실시간 단체 대화가 가능해야 해요.
- `식별 가능` : 서로 다른 사용자가 각각 식별되어야 해요. 채팅 메시지만 오고 간다면, 혼자서 여러 사람인 척 할 수 있어요.
- `웹 서비스` : 가끔 사용할 서비스이기도 하고, 앱은 배포까지 비교적 오래 걸려요.

친구들끼리 모여서 실시간 단체 대화를 할 수 있으며 서로 식별될 수 있는 채팅 서비스를 만들려고 해요.

### 뭐로 만들까?
- `Kotlin`
- `Spring Boot`
- `WebSocket`
- `React`
- `TypeScript`


### 프로젝트 환경
```kotlin
Spring Boot:3.1.4
Kotlin:1.8.22

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'com.fasterxml.jackson.module:jackson-module-kotlin'
    implementation 'org.jetbrains.kotlin:kotlin-reflect'
    compileOnly 'org.projectlombok:lombok'
    developmentOnly 'org.springframework.boot:spring-boot-devtools'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

---

React:18.2.0
Node.js:20.5.1
TypeScript:4.9.5
"dependencies": {
  "@emotion/react": "^11.11.1",
  "@emotion/styled": "^11.11.0",
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/user-event": "^13.5.0",
  "@types/jest": "^27.5.2",
  "@types/node": "^16.18.54",
  "@types/react": "^18.2.23",
  "@types/react-dom": "^18.2.8",
  "axios": "^1.5.1",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-scripts": "5.0.1",
  "sockjs-client": "^1.6.1",
  "text-encoding": "^0.7.0",
  "typescript": "^4.9.5",
  "web-vitals": "^2.1.4",
  "websocket": "^1.0.34",
  "ws": "^8.14.2"
},
```

</br>

## Web Socket?
웹소켓(WebSocket)은 실시간으로 양방향 통신을 가능하게 하는 기술이에요. 이 기술을 이해하기 위해서는 먼저 웹의 전통적인 통신 방식에 대한 이해가 필요해요.

### HTTP와 그 한계
전통적으로 웹에서 데이터를 주고 받기 위해 [HTTP(Hypertext Transfer Protocol)](https://ko.wikipedia.org/wiki/HTTP)를 사용했어요. 사용자가 웹 페이지를 요청하면 서버는 해당 페이지의 HTML, CSS, JavaScript 등의 파일들을 클라이언트(사용자의 브라우저)에게 전송해요.

HTTP는 단방향 통신이에요. 즉, 클라이언트가 서버에게 요청을 보내고, 서버가 응답을 반환하는 구조에요. 따라서 실시간으로 변경되는 정보를 클라이언트에게 지속적으로 업데이트하려면 클라이언트가 주기적으로 서버에 데이터를 요청해야 하는데, 이러한 방식은 네트워크 자원을 낭비하며, 실시간성도 보장할 수 없어요.

### WebSocket 도입
WebSocket 프로토콜은 이런 문제를 해결하기 위해 만들어졌어요. WebSocket은 TCP 연결 위에서 작동하며, HTTP와 달리 [양방향 통신](https://ko.wikipedia.org/wiki/%EC%9D%B4%EC%A4%91%ED%86%B5%EC%8B%A0)을 지원해요.

클라이언트와 서버 사이에 WebSocket 연결(소켓)이 생성되면, 두 당사자 모두 상대방에게 직접 메시지를 보낼 수 있어요. 즉, 데이터가 변경될 때마다 서버가 클라이언트로 메시지를 보내 업데이트할 수 있으며 반대로 클라이언트도 필요할 때마다 메시지를 보낼 수 있어요.

### WebSocket 사용 사례
- `실시간 채팅` : 사용자 간의 대화 내용을 실시간으로 교환할 수 있어요.
- `멀티플레이어 게임` : 여러 플레이어 간의 게임 상태 정보를 실시간으로 공유할 수 있어요.
- `실시간 알림` : 시스템 상태, 주식 가격 등 실시간 정보를 사용자에게 알릴 수 있어요.

### 결론
실시간 채팅을 구현하기 위해 Web Socket을 사용할 예정이에요.

Web Socket은 추후 데이터베이스 엑세스를 염두하고 스프링 부트를 사용해서 구현하려고 해요. 언어는 요즘 공부하고 있는 코틀린으로 진행하려고 해요. (카카오 채팅 서버도 코틀린을 사용한다는 사실?!)

</br>

## Spring Boot 코드

패키지 구조에요.

```bash
chat
├── config
│   └── WebSocketConfig.kt
└── handler
    └── SocketHandler.kt
``` 

### SocketHandler.kt
스프링 부트에서 웹소켓을 사용하려면, 웹소켓 메시지를 처리하는 핸들러를 구현하고 등록해야 해요.
먼저 핸들러를 구현할게요.
```kotlin
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

@Component
class SocketHandler(
    private val sessionList: ArrayList<WebSocketSession> = ArrayList()
): TextWebSocketHandler() {

	...

}
```
`SocketHandler` 클래스는 [`TextWebSocketHandler`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/handler/TextWebSocketHandler.html) 클래스를 상속받았어요. `TextWebSocketHandler` 클래스는 텍스트 기반의 웹소켓 메시지를 처리하는 기본적인 기능을 제공해요.

추가로 현재 연결된 클라이언트 세션을 저장하는 sessionList가 존재해요. 이 리스트에 모든 연결된 세션 정보가 저장되어, 나중에 메시지 전송 작업 등에서 사용해요.

SocketHandler 클래스에는 아래와 같은 함수가 존재해요.

- `handleTextMessage()` : 클라이언트로부터 메시지가 도착하면 호출되는 메소드에요.
- `afterConnectionEstablished()` : 클라이언트가 서버로 연결되면 호출되는 메소드에요.
- `afterConnectionClosed()` : 클라이언트와 서버의 연결이 끊기면 호출되는 메소드에요.

#### handleTextMessage()
```kotlin
override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        sessionList.forEach { webSocketSession ->
            if (webSocketSession.isOpen) {
                webSocketSession.sendMessage(TextMessage(message.payload))
            }
        }
    }
```
이 메소드는 클라이언트로부터 메시지가 도착했을 때 호출돼요. 인자로 받은 session은 메시지를 보낸 클라이언트의 세션 정보를 나타내며, message는 클라이언트가 보낸 실제 메시지에요.

메소드 내부에서는 현재 연결된 모든 세션(sessionList)에 대해 반복작업을 수행해요. 이 반복작업에서 각 세션이 열려있다면(즉, 해당 클라이언트와의 연결이 유효하다면), 해당 세션을 통해 클라이언트로부터 받은 메시지(message.payload)를 다른 모든 연결된 클라이언트에게 전송해요.

즉, 어떤 한 클라이언트가 보낼 메시지는 서버에 도착한 후 다른 모든 연결된 클라이언트들에게 바로 전달되며, 이렇게 함으로써 실시간 채팅과 같은 기능을 구현할 수 있어요.

#### afterConnectionEstablished()
```kotlin
    override fun afterConnectionEstablished(session: WebSocketSession) {
        sessionList.add(session)
    }
```
새로운 클라이언트가 서버로 연결되면 호출돼요. 새롭게 연결된 클라이언트의 세션이 인자로 넘어오며, 함수 내부에서는 이 새로운 세션을 sessionList에 추가하여, 이후 메시지 전송 등의 작업에서 사용하도록 해요.

#### afterConnectionClosed
```kotlin
    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        sessionList.remove(session)
    }
```
클라이언트와 서버의 연결이 끊기면 호출돼요. 연결이 끊어진 클라이언트의 세션 정보가 인자로 넘어오며, 함수 내부에서는 해당 세션을 sessionList에서 제거하여, 더 이상 메시지를 보내지 않도록 해요.

### WebSocketConfig.kt
위에서 만든 구현체를 등록하는 과정이 필요해요.
`WebSocketConfig` 클래스를 통해 웹소켓 핸들러를 등록할게요.

```kotlin
import net.skhu.realtimechat.handler.SocketHandler
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class WebSocketConfig(
    private val socketHandler: SocketHandler
): WebSocketConfigurer {

   ...

}
```

- `@Configuration` : 이 어노테이션은 해당 클래스가 스프링의 구성(Configuration) 클래스임을 나타내요. 즉, 이 클래스가 애플리케이션의 설정을 담당하는 클래스라는 뜻이에요.
- `@EnableWebSocket` : 이 어노테이션이 붙은 경우, 스프링에게 웹소켓 기능을 활성화하도록 지시해요.

해당 클래스는 [`WebSocketConfigurer`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/config/annotation/WebSocketConfigurer.html) 해당 인터페이스를 구현해요.

#### registerWebSocketHandlers()
```kotlin
override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
    registry.addHandler(socketHandler, "/chat")
        .setAllowedOrigins("*")
}
```
해당 메소드는 웹소켓 핸들러를 등록하는 역할을 해요. 핸들러는 클라이언트와 서버 간의 웹소켓 통신을 처리하는 역할을 수행해요. 아까 위에서 작성한 `SocketHanlder` 클래스를 등록하려고 해요.

"/chat" 경로로 접속한 클라이언트에 대해 socketHandler 객체가 동작하도록 설정했으며, 만들면서 테스트하기 위해 모든 출처를 허용했어요. 이렇게 모든 출처를 허용하는 것은 좋지 않아요.

### 전체 코드

아래는 SocketHandler.kt의 전체 코드에요.
```kotlin
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

@Component
class SocketHandler(
    private val sessionList: ArrayList<WebSocketSession> = ArrayList()
): TextWebSocketHandler() {

    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        sessionList.forEach { webSocketSession ->
            if (webSocketSession.isOpen) {
                webSocketSession.sendMessage(TextMessage(message.payload))
            }
        }
    }

    override fun afterConnectionEstablished(session: WebSocketSession) {
        sessionList.add(session)
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        sessionList.remove(session)
    }

}
```

아래는 WebSocketConfig.kt의 전체 코드에요.
```kotlin
import net.skhu.realtimechat.handler.SocketHandler
import org.springframework.context.annotation.Configuration
import org.springframework.web.socket.config.annotation.EnableWebSocket
import org.springframework.web.socket.config.annotation.WebSocketConfigurer
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry

@Configuration
@EnableWebSocket
class WebSocketConfig(
    private val socketHandler: SocketHandler
): WebSocketConfigurer {

    override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
        registry.addHandler(socketHandler, "/chat")
            .setAllowedOrigins("*")
    }

}

```

</br>

## 테스트
저는 웹소켓 서버를 테스트하기 위해 [Simple WebSocket Client](https://chrome.google.com/webstore/detail/simple-websocket-client/pfdhoblngboilpfeibdedpjgfnlcodoo?hl=en)를 설치했어요.

![simple websocket client](/images/posts/realtime-chat-service/605494ce-a254-49fe-9bf1-60c6a7ba7ccb_image.png)
Server Location의 URL을 작성하는 부분을 보면 `ws://`로 시작하는 것을 볼 수 있어요. 

> 웹소켓 프로토콜을 사용할 때 URL은 일반적으로 `ws://` 또는 `wss://` (웹소켓 Secure, 즉 SSL/TLS를 통한 암호화된 연결)로 시작한다. 이는 HTTP 프로토콜의 URL이 `http://` 또는 `https://` 로 시작하는 것과 유사한 원리이다. 여기서 `ws://` 는 웹소켓 연결을 나타내며, 이를 통해 클라이언트와 서버 간에 전이중(full-duplex) 통신 채널을 열 수 있다. 즉, 웹소켓 프로토콜은 HTTP와 달리 실시간 양방향 데이터 전송을 가능하게 하므로, 실시간 채팅 애플리케이션과 같은 경우에 주로 사용된다. 따라서 서버 위치의 URL을 작성할 때 웹소켓 연결을 나타내기 위해 `ws://` 로 시작하는 것이다.  - `ChatGPT`

지금 스프링 부트를 로컬 환경에서 실행하고 웹소켓이 잘 되는지 확인해볼게요.
URL은 아까 socketHandler를 등록하면서 지정한 경로를 사용하면 돼요. `ws://localhost:8080/chat`

![urltest](/images/posts/realtime-chat-service/e0a100ca-a0d5-420c-9916-ea7e486075f7_image.png)

이렇게 접속한 후에 요청을 보내면 돼요. 안녕하세요~ 라는 요청을 보내볼게요.

![결과](/images/posts/realtime-chat-service/7d811578-80b3-49d0-9f1a-5f9f740fd052_image.png)

잘 작동하는 것을 볼 수 있어요. 이제 이 웹소켓 서버를 이용할 화면을 만들어볼게요.

</br>

## 화면 구성
화면은 React와 TypeScript를 사용하여 구성하려고 해요.

사실, 화면 구성은 Spring MVC 패턴과 템플릿 엔진을 사용하여 더 쉽게 구현할 수 있어요. 그러나 이번 학기에 React와 TypeScript를 사용하는 강의를 듣고 있는 저로서는, 배우고 있는 내용으로 직접 화면을 구성해보면서 그 과정에서 얻는 경험과 지식이 도움이 될 것 같아서 사용하게 되었어요.

### 컴포넌트 구상
- `이름 등록창` : 서로가 누구인지 알 수 있어야 해요.
- `메시지 입력창` : 보낼 메시지를 입력하고 전송할 수 있어야 해요.
- `채팅창` : 서로의 대화를 볼 수 있어야 해요. 메시지가 전송되지만 보이지 않는다면, 쓸모가 없을 거에요.

### 프로젝트 생성
```
npx create-react-app chat --template typescript
```
해당 명령어로 프로젝트를 생성했어요.

</br>

## React 코드

패키지 구조에요.

```bash
src
├── App.tsx
├── ChatComponent.tsx
├── ChatLogs.tsx
├── UserNameInput.tsx
└── MessageInput.tsx
``` 

### UserNameInput.tsx
```ts
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";

const divStyle = css`
  display: flex;
  height: 30px;
`;

const inputStyle = css`
  flex: 8;
`;

const buttonStyle = css`
  flex: 2;
`;

const UserNameInput: React.FC<{
  userNameInput: string;
  setUserNameInput: (value: string) => void;
  setUserName: (value: string) => void;
}> = ({ userNameInput, setUserNameInput, setUserName }) => {
  return (
    <div css={divStyle}>
      <input
        type="text"
        value={userNameInput}
        onChange={(e) => setUserNameInput(e.target.value)}
        placeholder="사용자명을 입력하세요."
        css={inputStyle}
      />
      <button
        onClick={() => userNameInput && setUserName(userNameInput)}
        css={buttonStyle}
      >
        이름 등록
      </button>
    </div>
  );
};

export default UserNameInput;
```
`UserNameInput` 컴포넌트는 사용자로부터 이름을 입력받아 등록하는 기능을 제공하며, 세 가지 prop을 받아요.
- `userNameInput` : 현재 입력 필드에 표시되는 사용자 이름이에요. 이 값은 상위 컴포넌트의 state에서 관리돼요.
- `setUserNameInput` : 사용자가 입력 필드에 새로운 값을 입력할 때마다 호출되는 함수에요. 이 함수는 상위 컴포넌트에서 정의되어 전달돼요.
- `setUserName` : "이름 등록" 버튼이 클릭될 때 호출되는 함수에요. 이 함수도 상위 컴포넌트에서 정의되어 전달돼요.

해당 컴포넌트의 주요 목적은 이름을 받아와서 상태(state)를 업데이트하는 것이에요.

### MessageInput.tsx
```ts
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";

const divStyle = css`
  display: flex;
  height: 30px;
`;

const inputStyle = css`
  flex: 8;
`;

const buttonStyle = css`
  flex: 2;
`;

const MessageInput: React.FC<{
  message: string;
  setMessage: (value: string) => void;
  sendMessage: React.MouseEventHandler<HTMLButtonElement>;
}> = ({ message, setMessage, sendMessage }) => {
  return (
    <div css={divStyle}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="보내실 메시지를 입력하세요."
        css={inputStyle}
      />
      <button onClick={sendMessage} css={buttonStyle}>
        보내기
      </button>
    </div>
  );
};

export default MessageInput;
```
`MessageInput` 컴포넌트는 사용자로부터 메시지를 입력받아 보내는 기능을 제공하며, 세 가지 prop을 받아요.
- `message` : 현재 입력 필드에 표시되는 메시지에요. 이 값은 상위 컴포넌트의 state에서 관리돼요.
- `setMessage` : 사용자가 입력 필드에 새로운 값을 입력할 때마다 호출되는 함수에요. 이 함수는 상위 컴포넌트에서 정의되어 전달돼요.
- `sendMessage` : "보내기" 버튼이 클릭될 때 호출되는 함수에요. 이 함수도 상위 컴포넌트에서 정의되어 전달돼요.

해당 컴포넌트의 주요 목적은 메시지를 받아와서 상태(state)를 업데이트하고, "보내기" 버튼을 이용하여 메시지를 보내는 것이에요.

### ChatLogs.tsx
```ts
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";

const chatBoxStyle = css`
  background-color: black;
  color: white;
  height: 500px;
  overflow-y: auto;
`;

const messageStyle = css`
  color: white;
`;

const ChatLogs: React.FC<{ logs: string[] }> = ({ logs }) => {
  return (
    <div css={chatBoxStyle}>
      {logs.map((logStr, i) => {
        const log = JSON.parse(logStr);
        return (
          <p key={`msg_${i}`} css={messageStyle}>
            {`${log.author} : ${log.message}`}
          </p>
        );
      })}
    </div>
  );
};

export default ChatLogs;
```
`ChatLogs` 컴포넌트는 채팅 메시지의 로그를 화면에 출력하는 역할을 해요. 하나의 prop을 받아요.
- `logs` : 채팅 메시지 로그들을 포함한 문자열 배열이에요. 각 문자열은 JSON 형식으로, author(작성자)와 message(메시지 내용) 필드를 가지고 있어요.

컴포넌트의 스타일링은 `@emotion/react` 라이브러리를 사용하여 `CSS-in-JS` 방식으로 작성했으며 간단한 디자인이에요.

### ChatComponent.tsx
```ts
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useEffect, useRef, useState } from "react";
import ChatLogs from "./ChatLogs";
import UserNameInput from "./UserNameInput";
import MessageInput from "./MessageInput";

const containerStyle = css`
  width: 500px;
  margin: 0 auto;
`;

const ChatComponent: React.FC = () => {
  const [userNameInput, setUserNameInput] = useState("");
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [chatLogs, setChatLogs] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (userName) {
      wsRef.current = new WebSocket(`ws://localhost:8080/chat`);

      wsRef.current.onopen = () => console.log("Connection opened");

      wsRef.current.onmessage = (event) =>
        setChatLogs((prevChatLogs) => [...prevChatLogs, event.data]);

      wsRef.current.onclose = (event) => {
        if (event.wasClean) {
          console.log(
            `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
          );
        } else {
          console.log("[close] Connection died");
        }
      };

      return () => wsRef.current?.close();
    }

    return undefined;
  }, [userName]);

  const sendMessage = () => {
    if (
      message.trim() !== "" &&
      userName.trim() !== "" &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      let payload = JSON.stringify({ author: userName, message: message });
      wsRef.current.send(payload);

      setMessage("");
    }
  };

  return (
    <div css={containerStyle}>
      <h1>아지트</h1>
      <ChatLogs logs={chatLogs} />
      {!userName ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (userNameInput) {
              setUserName(userNameInput);
            }
          }}
        >
          <UserNameInput
            userNameInput={userNameInput}
            setUserNameInput={setUserNameInput}
            setUserName={setUserName}
          />
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <MessageInput
            message={message}
            setMessage={setMessage}
            sendMessage={(e) => sendMessage()}
          />
        </form>
      )}
    </div>
  );
};

export default ChatComponent;
```
`ChatComponent` 컴포넌트는 채팅 애플리케이션의 메인 컴포넌트에요. 사용자 이름 입력, 메시지 입력, 그리고 채팅 로그 출력 등의 기능을 통합하고 관리하는 역할을 해요.
- useState를 사용해서 userNameInput, userName, message, chatLogs라는 네 가지 상태를 선언했어요.
- useRef를 사용해서 WebSocket 객체를 저장했으며, WebSocket 객체는 웹소켓 연결을 관리해요.
- useEffect를 사용해서 userName이 변경될 때마다 웹소켓 연결을 생성하거나 종료하는 작업을 수행하게 했어요.
- sendMessage 함수를 이용해서 현재 메시지와 사용자 이름을 웹소켓 서버에 전송해요.

해당 컴포넌트의 주요 목적은 채팅 애플리케이션의 모든 기능들을 조합하여 전체적인 동작을 구현하는 것이에요

### 실행
![1](/images/posts/realtime-chat-service/f0954d65-dd59-42dd-8273-7f3122aea5dd_image.png)

![2](/images/posts/realtime-chat-service/289d7da8-a9aa-4526-8f6e-39e4bc27812c_image.png)

사용자의 이름을 입력하면 웹소켓 서버와 연결되며, 메시지를 보내면 `사용자명 : 메시지` 형식으로 누가 어떤 메시지를 보냈는지 볼 수 있어요.

하지만, 이걸 나만 보는 것이 아니라 다른 사람도 실시간으로 볼 수 있어야 성공이에요. 그래서 다른 크롬 탭을 사용하여 테스트를 진행했어요.

![테스트](/images/posts/realtime-chat-service/c3edfe5c-63e1-468e-94b0-4fb603a25300_image.gif)

## 소감
학교에서 데이터 통신과 컴퓨터 네트워크 강의를 통해 배운 내용 덕분에 웹소켓 통신 과정을 쉽게 이해할 수 있었으며, 큰 문제 없이 구현할 수 있었던 것 같아요. 물론 채팅 서비스라고 하기에는 많은 문제가 있어요. 사용자명 중복 체크를 하지 않기 때문에 사칭할 수 있고, 이름을 입력해야 웹소켓 서버에 연결되기 때문에 늦게 들어오면 이전 채팅 기록을 볼 수 없어요. 다음 게시글에서 이런 문제들을 정의하고 해결해보려고 해요.

[깃허브](https://github.com/YehyeokBang/Chat-Server)

### 참고
[Web Socket](https://ko.wikipedia.org/wiki/%EC%9B%B9%EC%86%8C%EC%BC%93)
[WebSocketConfigurer](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/config/annotation/WebSocketConfigurer.html)
[TextWebSocketHandler](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/socket/handler/TextWebSocketHandler.html)
[Simple WebSocket Client](https://chrome.google.com/webstore/detail/simple-websocket-client/pfdhoblngboilpfeibdedpjgfnlcodoo?hl=en)
[스프링 부트 채팅](https://myhappyman.tistory.com/100)
[Emotion](https://emotion.sh/docs/@emotion/react)
