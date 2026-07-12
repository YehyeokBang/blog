---
title: "실시간 채팅 서비스 만들어보기 2"
date: "2023-10-01"
summary: "이전에 만든 실시간 채팅 서비스의 문제점(사용자 이름 중복, 대화 기록 조회 불가 등)을 식별하고 개선하는 과정을 다룹니다."
tags: ["Kotlin", "Spring Boot", "WebSocket", "React", "TypeScript"]
---

## 이전 내용 
[실시간 채팅 서비스 만들어보기](/posts/realtime-chat-service)

</br>

## 식별된 문제점
저번에 완성한 채팅 애플리케이션을 테스트하면서 식별된 문제점을 나열해보려고 해요.

### 사용자 이름 중복 허용
현재는 사용자 이름을 누구나 동일하게 사용할 수 있어요.

어떤 이름으로 메시지가 전송되었다는 사실을 알 수 있지만, 누구나 그 이름을 사용할 수 있기 때문에, 사실은 서로 식별되지 않는 상황이 발생해요. 그래서 웹소켓에 연결된 세션마다 사용자 이름을 저장해두고 확인하는 로직을 추가하여 사용자 이름을 중복해서 사용할 수 없도록 변경하려고 해요.

### 대화 기록 조회 불가
이미 연결된 사용자라면 실시간으로 전송되는 메시지를 볼 수 있지만, 나중에 연결된 사용자의 경우 이전 대화 기록을 볼 수 없어요.

채팅방을 만들게 된 목적이 카카오톡을 사용할 수 없을 때 사용하는 우리만의 채팅방을 만드는 것이었어요. 하지만 그런 상황 속에서 이전 대화 기록을 보지 못한다면, 입장하는 사용자마다 "혹시 카톡 안되나요?" 라는 메시지를 계속해서 보내게 될거에요. 이를 방지하기 위해 연결되기 이전 대화 기록을 볼 수 있게 변경하려고 해요.

추가로 모든 채팅 기록을 불러오는 것은 불필요하기 때문에, 아예 초기화 개념을 도입하려고 해요.

### 대화 기록
지금 만들고 있는 채팅 서비스에서는 최근의 대화 기록들이 가장 중요해요. 

그 이유는 평소에 사용하는 채팅 서비스가 아니라, 일종의 대피소 개념의 서비스이기 때문에 모든 채팅을 기록할 이유가 없다고 생각했어요. 물론 대화 기록 자체가 아니라, 언제 채팅이 많이 일어났는가?는 필요한 정보가 될 수도 있기 때문에 고민하고 있어요.

암튼 모든 메시지를 저장할 필요가 없으며, 메시지가 없어져도 크게 중요하지 않다고 판단해서 메모리에 메시지를 저장해두고 하루에 한 번씩 초기화하는 전략을 선택하려고 해요. 이렇게 하면 크게 달라지는 부분 없이 구현 난이도가 많이 줄어요.

</br>

## 추가하고 싶은 기능
- `사용자 이름 중복 불가`
- `매일 오전 8시에 초기화`
- `이전 대화 기록 보여주기`
- `메시지에 현재 시간 포함 (포맷 10:13)`
- `약간의 디자인`

각 기능이 추가될 때마다 모든 코드를 작성하지 않고 핵심 코드만 작성하려고 해요.

## 사용자 이름 중복 불가
사용자 이름의 중복 여부를 언제 확인할 것인지에 대해 고민을 많이 했어요.

- `웹소켓 연결 초기에 첫 메시지로 사용자 이름을 전송하기`
- `사용할 이름을 먼저 HTTP 메소드로 확인하고 나서 웹소켓 연결하기`

저는 두 번째 방법을 선택했어요. 사용자 이름의 중복 문제를 해결하려면 결국 사용자 이름을 저장하고 관리해야 해요. 그래서 기존 웹소켓은 그대로 두고, 대화 내용만 전달하는 역할만 맡도록 했어요. 그리고 별도로 HTTP 메소드를 통해 사용자 이름의 중복 여부만 체크하도록 구조 분리했어요.

### UserNameController.kt
```kotlin
import net.skhu.realtimechat.app.UserNameService
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController

@RestController
class UserNameController(
    private val userNameService: UserNameService
) {

    @GetMapping("/user/{userName}")
    @CrossOrigin(origins = ["*"])
    fun isUserNameDuplicated(@PathVariable userName: String) =
        userNameService.isUserNameDuplicated(userName)

}
```
- `@GetMapping("/user/{userName}")` : 해당 경로로 GET 메소드 요청을 보내면 중복 여부를 응답해요.
- `@CrossOrigin(origins = ["*"])` : 테스트를 위해 모든 도메인으로부터 크로스 오리진 요청을 허용했어요.
- `isUserNameDuplicated()` : 사용자 이름을 인자로 받고 `userNameService.isUserNameDuplicated(userName)`의 반환 값을 반환해요.

### UserNameService.kt
```kotlin
import org.springframework.stereotype.Service

@Service
class UserNameService(
    private val userNameList: MutableList<String> = mutableListOf()
) {

    fun isUserNameDuplicated(userName: String): Boolean {
        return if (userNameList.contains(userName)) {
            true
        } else {
            userNameList.add(userName)
            false
        }
    }

}
```
- `userNameList` : 지금까지 연결했던 사용자의 이름을 저장해요.
- `isUserNameDuplicated()` : 사용자 이름을 인자로 받고 중복되었는지 확인해요. 중복되지 않는다면 userNameList에 추가하고 false 반환, 중복된다면 true를 반환해요.


### ChatComponent.tsx

`ChatComponent` 내에 작성했던 `useEffect` 부분에 다음과 같은 코드를 추가하여 만약 중복되는 이름을 사용하려고 할 때 다시 입력하라는 메시지와 함께 userName 상태를 초기화하고 종료하도록 했어요.
```tsx
...

useEffect(() => {
    if (userName) {
      // 만약 true이면 사용자 이름 중복이니 다시 입력하라는 메시지를 띄워주고, userName을 초기화
      axios.get(`http://localhost:8080/user/${userName}`).then((res) => {
        if (res.data) {
          alert("이미 존재하는 사용자 이름입니다.");
          setUserName("");
          return;
        }
      });

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

...
```

하지만 이렇게 구현했을 때 문제가 발생했어요. 이름 중복 결과와 상관없이 웹소켓 연결이 되는 경우가 발생하는 문제였어요. 

이미 존재하는 사용자 이름인지 확인 후에 결과에 따라서 웹소켓 연결이 이루어지는 것을 기대했어요. 즉, 이미 존재하는 사용자 이름을 입력한 경우 웹소켓 연결이 이루어지면 안되어야 하죠. 하지만 로그를 확인해보면 연결된 것을 볼 수 있어요.

결과와 상관없이 웹소켓 연결 코드가 실행된 것이에요.

![문제](/images/posts/realtime-chat-service-2/f538abb7-0666-41a5-8e3e-13830fb97696_image.webp)

찾아보니 axios로 서버에 요청을 보내 응답을 받는 과정은 비동기적으로 수행되기 때문에, 이미 존재하는 사용자 이름인지 결과가 나오기 전에 웹소켓 연결 코드가 실행될 수 있는 환경이라는 것을 알 수 있었어요.

그러면 결과가 나올 때까지 기다려야 하는데, 무작정 1초간 기다리기와 같은 방법은 좋지 않은 것 같아서 검색 후 해결방법을 찾을 수 있었어요.

아래는 수정된 코드에요.
```tsx
...

useEffect(() => {
    const checkUserNameDuplicate = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/user/${userName}`
        );
        if (response.data) {
          alert("이미 존재하는 사용자 이름입니다.");
          setUserName("");
        } else {
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
        }
      } catch (error) {
        console.error("Error checking username duplicate:", error);
      }
    };

    if (userName.trim() !== "") {
      checkUserNameDuplicate();
    }

    return () => wsRef.current?.close();
  }, [userName]);

...

```
`checkUserNameDuplicate` 함수를 async 함수로 선언했어요. 이렇게 하면 await axios.get(...) 코드가 실행될 때까지 웹소켓 연결 코드의 실행이 지연되므로, 이제는 userName의 중복 여부 확인 후 웹소켓 연결을 시도하게 돼요. 이제 원하는 순서대로 동작할 수 있어요.

### 결과
![이름중복결과](/images/posts/realtime-chat-service-2/1d344fa2-191d-4389-92bd-9abd994ea5ca_image.webp)

**해당 코드의 개선으로 중복된 사용자 이름을 사용할 수 없게 되었고, 한 명의 사용자를 유일하게 구분할 수 있게 되었어요.** 

</br>

## 이전 대화 기록 보기
기존에는 웹소켓에 연결된 시점부터 대화 기록을 볼 수 있어요. 즉, 입장 전 대화 기록은 볼 수 없었어요.

간단한 서비스이기 때문에 큰 문제가 아니라고 생각할 수 있지만, 생각보다 큰 문제였어요. 이 서비스를 일종의 대피소라고 본다면, 대피해서 온 사람마다 "카톡 안되나요?"를 물어볼 수밖에 없을 거에요. 그래서 입장 전 대화 기록을 보여주려고 해요.

### Message.kt
```kotlin
class Message(
    var author: String? = null,
    var message: String? = null
) {

    companion object {
        fun write(author: String, message: String): Message =
            Message(author, message)
    }

}
```
메시지 작성자와 내용을 필드로 가지는 메시지 객체로 저장하려고 `Message` 클래스를 생성했어요.

### SocketHandler.kt
```kotlin
import net.skhu.realtimechat.data.Message
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

@Component
class SocketHandler(
    private val sessionList: ArrayList<WebSocketSession> = ArrayList(),
    private val messageList: ArrayList<Message> = ArrayList()
): TextWebSocketHandler() {

    override fun handleTextMessage(session: WebSocketSession, textMessage: TextMessage) {
        sessionList.forEach { webSocketSession ->
            if (webSocketSession.isOpen) {
                webSocketSession.sendMessage(TextMessage(textMessage.payload))

                val author = textMessage.payload.substringBefore(":")
                val message = textMessage.payload.substringAfter(":")
                messageList.add(Message.write(author, message))
            }
        }
    }

    override fun afterConnectionEstablished(session: WebSocketSession) {
        sessionList.add(session)

        messageList.forEach { message ->
            session.sendMessage(TextMessage("${message.author}: ${message.message}"))
        }
    }
    
    ...
    
}
```

- `messageList` : 메시지 객체를 담아주는 리스트를 만들었어요.
- `handleTextMessage()` : 기존 메시지를 받아서 모든 사용자에게 전송하던 과정 이후에 그 메시지 정보를 `messageList`에 담는 과정을 추가했어요.
- `afterConnectionEstablished()` : 웹소켓 연결 후 세션 정보를 `sessionList`에 저장한 후에 지금까지 쌓인 메시지들을 연결된 세션에게 모두 전송해요. 즉 이전까지 쌓인 메시지를 세션 연결과 동시에 볼 수 있어요.

### 결과
![이전기록결과](/images/posts/realtime-chat-service-2/9d7a0483-4e1e-4e20-b80d-5ef99d1965f6_image.webp)

**해당 코드의 개선으로 사용자가 채팅방에 참여하면 그동안의 대화 내용도 함께 볼 수 있게 되었어요.**

</br>

## 하루에 한 번 초기화
모든 대화 기록을 저장할 필요가 없다고 판단했기 때문에 데이터베이스를 사용하지 않으려고 해요. 그래서 오랜 시간이 지나면, 데이터베이스보다는 용량 문제가 발생할 수도 있어요.

사실상 필요하지 않은 메시지들을 계속해서 가지고 있는 것이 아니라, 일정 시간마다 초기화를 통해 메모리를 비우는 방법을 사용하려고 해요.


해당 채팅 서비스는 단기간 동안만 필요한 정보를 다루는 특수한 목적을 가지고 있기 때문에 모든 대화 기록을 저장할 필요가 없다고 판단했어요. 그래서 데이터베이스를 사용하지 않고 메모리에 메시지를 저장하려고 해요.

데이터베이스를 사용하지 않고 메모리에 정보를 저장하는 것은 빠른 응답 속도와 더 적은 시스템 리소스 사용을 의미해요. 그러나 오랜 기간 동안 이 데이터를 메모리에 보관하면 시간이 흘러 용량 문제가 발생할 수 있어요.

그래서 하루에 한 번 초기화를 통해 메모리를 비우기로 결정했어요. 이렇게 하면 불필요한 메시지들을 계속해서 보관하고 있을 필요가 없으며, 시스템이 최적의 성능을 유지할 수 있게 된다고 생각했어요.

### Application.kt
```kotlin
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

@EnableScheduling
@SpringBootApplication
class RealTimeChatApplication

fun main(args: Array<String>) {
    runApplication<RealTimeChatApplication>(*args)
}
```
일정 시간마다 초기화하는 기능을 구현하기 위해 `@EnableScheduling`을 사용하여 스케줄링 기능을 활성화 했어요.

### SocketHandler.kt
```kotlin
@Component
class SocketHandler(
    private val sessionList: ArrayList<WebSocketSession> = ArrayList(),
    private val messageList: ArrayList<Message> = ArrayList()
): TextWebSocketHandler() {

    @Scheduled(cron = "0 0 6 * * ?")
    fun clearSystem() {
        sessionList.forEach { it.close() }
        sessionList.clear()
        messageList.clear()
    }
    
    ...
    
}
```
- `@Scheduled(cron = "0 0 6 * * ?")` : 스프링 프레임워크에서 스케줄링 작업을 지정하는 Cron 표현식이에요. 이 표현식은 초, 분, 시, 일, 월, 요일 순서로 나뉘어져 있으며, 각각의 위치에는 해당 값을 나타내는 숫자나 특수 문자를 사용하여 스케줄링이 실행될 시간을 지정할 수 있어요. 따라서 이 표현식은 "매일 오전 6시에 실행"을 의미해요.
- `clearSystem()` : 연결된 모든 세션 종료 및 세션 정보와 메시지 기록을 초기화 해요.

### ChatComponent.tsx
```tsx
...

wsRef.current.onclose = (event) => {
    if (event.wasClean) {
      console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      console.log("[close] Connection died");
    }

    // 아래의 코드 추가
    alert("서버와의 연결이 종료되었습니다. 재연결합니다.");
    setUserNameInput("");
    setChatLogs([]);
    setUserName("");
};

...
```
세션 종료를 감지하면 대화 기록 및 사용자 이름 상태를 초기화해서 초기 화면으로 만들어요. 즉, 서비스 사용 중 6시가 된다면, 다시 사용자 이름을 입력하고 웹소켓 연결일 시도해야 해요.

오전 6시에 해당 서비스를 이용할 일은 거의 없다고 판단하고 이렇게 구현했어요.

### 결과
![초기화결과](/images/posts/realtime-chat-service-2/d73abe9f-f5d7-49bc-a5ee-c3b44afda92e_image.webp)


**해당 코드의 개선으로 서비스 구현이 간단해지고, 용량 걱정이 줄어들게 되었어요.**

</br>

## 메시지가 전송된 시간 보기
간단하게 리액트에서 메시지가 추가될 때마다 현재 시간을 같이 보여주도록 구현하려고 했지만, 그렇게 하면 이전 대화 기록의 시간을 볼 수 없기 때문에 메시지를 보낼 때 시간도 함께 보내고 시간 정보까지 저장하는 방식을 사용했어요.

### ChatComponent.tsx
```tsx
...

const sendMessage = () => {
  if (
    message.trim() !== "" &&
    userName.trim() !== "" &&
    wsRef.current &&
    wsRef.current.readyState === WebSocket.OPEN
  ) {
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let time = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    let payload = JSON.stringify({
      author: userName,
      message: message,
      time: time,
    });
    wsRef.current.send(payload);

    setMessage("");
  }
};

...
```
메시지 전송을 담당하는 `sendMessage` 함수에서 메시지 정보에 해당하는 `payload` 에다가 시간 정보를 추가했어요. 시간 정보에 해당하는 `time` 에는 시:분 포맷으로 현재 시간이 저장되어 있어요. 대신 분 단위가 10 미만인 경우 앞에 0을 붙여주도록 했어요. (예시: 12:05, 12시 5분)

### Message.kt
```kotlin
class Message(
    var author: String? = null,
    var message: String? = null,
    var time: String? = null
) {

    companion object {
        fun write(author: String, message: String, time: String): Message =
            Message(author, message, time)
    }

    fun toJson(): String =
        "{\"author\":\"$author\",\"message\":\"$message\",\"time\":\"$time\"}"

}
```
먼저 저장될 객체를 만들 `Message` 클래스에 시간 정보를 추가했어요.

추가로 메시지 객체를 참조해서 payload로 만들 때 편의성을 위해 `toJson()` 메소드를 추가했어요.

### SocketHandler.kt
```kotlin
...

override fun handleTextMessage(session: WebSocketSession, textMessage: TextMessage) {
    sessionList.forEach { webSocketSession ->
        if (webSocketSession.isOpen) {
            webSocketSession.sendMessage(TextMessage(textMessage.payload))

            val author = textMessage.payload.substringAfter("\"author\":\"").substringBefore("\"")
            val message = textMessage.payload.substringAfter("\"message\":\"").substringBefore("\"")
            val time = textMessage.payload.substringAfter("\"time\":\"").substringBefore("\"")
            messageList.add(Message.write(author, message, time))
        }
    }
}

...
```
`handleTextMessage()` 에서 메시지 정보를 `messageList`에 저장할 때 시간도 함께 저장하도록 수정했어요. 정규식을 통해 값을 파싱했어요.

하지만 `handleTextMessage()` 메소드는 메시지가 전송되면 관련 작업을 해야하는데, JSON 형태의 문자열에서 값을 추출하는 일도 하고 있어요. 만약 Message 정보가 추가되거나 변경된다면 해당 코드도 변경해야 해요. 이런 상황을 방지하기 위해 다음과 같이 수정했어요.

```kotlin
...

override fun handleTextMessage(session: WebSocketSession, textMessage: TextMessage) {
    sessionList.forEach { webSocketSession ->
        if (webSocketSession.isOpen) {
            webSocketSession.sendMessage(TextMessage(textMessage.payload))

            val (author, message, time) = extractMessageInfo(textMessage.payload) ?: return
            messageList.add(Message.write(author, message, time))
        }
    }
}

...

// 값 추출 메소드 추가
fun extractMessageInfo(payload: String): Triple<String, String, String>? {
    val regex = """\{"author":"(.*?)","message":"(.*?)","time":"(.*?)"}""".toRegex()
    val matchResult = regex.find(payload)
    return matchResult?.let {
        val (author, message, time) = it.destructured
        Triple(author, message, time)
    }
}
...
```
값을 추출하는 메소드를 따로 만들어서 의존도를 낮췄어요.

이제 시간을 각 채팅마다 보여줄 차례에요.

### ChatLogs.tsx
```tsx
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
            {`${log.author} : ${log.message} - ${log.time}`}
          </p>
        );
      })}
    </div>
  );
};

export default ChatLogs;
```
`작성자 : 메시지 - 시간:분` 포맷으로 메시지를 주고 받을 수 있게 되었어요.

### 결과
![시간결과](/images/posts/realtime-chat-service-2/888a2291-2727-4d0d-839a-8cd169125014_image.webp)

**해당 코드의 개선으로 이제 각 메시지가 언제 전송되었는지 확인할 수 있어요.**


</br>

## 디자인
```tsx
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";

const chatBoxStyle = css`
  background-color: black;
  color: white;
  height: 500px;
  overflow-y: auto;
`;

const userNameStyle = css`
  color: white;
  margin-left: 8px;
`;

const messageStyle = css`
  color: white;
  display: inline-block;
  background-color: gray;
  padding: 7px;
  border-radius: 10px;
  margin-top: 5px;
`;

const timeStyle = css`
  color: white;
  font-size: 10px;
  margin-left: 5px;
  margin-right: 5px;
  margin-bottom: 5px;
  display: inline-block;
  vertical-align: bottom;
`;

const ChatLogs: React.FC<{ logs: string[] }> = ({ logs }) => {
  return (
    <div css={chatBoxStyle}>
      {logs.map((logStr, i) => {
        const log = JSON.parse(logStr);
        return (
          <p key={`msg_${i}`} css={userNameStyle}>
            {`${log.author}`} <br />
            <div css={messageStyle}>{`${log.message}`}</div>
            <span css={timeStyle}>{`${log.time}`}</span>
          </p>
        );
      })}
    </div>
  );
};

export default ChatLogs;
```

어느정도 채팅창 같은 느낌을 내기 위해서 디자인을 변경했어요.
![디자인1](/images/posts/realtime-chat-service-2/5e45c872-a9ff-4164-bfed-12827da3d189_image.webp)

하지만 약간 아쉬운 부분이 있어요. 자신과 상대방 메시지 모두 왼쪽에서 출력되는 부분이에요. 자신의 메시지는 오른쪽에서, 나머지는 왼쪽에서 출력되도록 수정하려고 해요.

### ChatLogs.tsx
```tsx
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React from "react";

const chatBoxStyle = css`
  background-color: black;
  color: white;
  height: 500px;
  overflow-y: auto;
`;

const userNameStyle = css`
  color: white;
  margin-left: 8px;
`;

const myMessageStyle = css`
  text-align: right;
  margin-right: 8px;
`;

const myMessageTextStyle = css`
  color: white;
  display: inline-block;
  background-color: #3f51b5;
  padding: 7px;
  border-radius: 10px;
  margin-top: 5px;
`;

const otherMessageTextStyle = css`
  color: white;
  display: inline-block;
  background-color: #666666;
  padding: 7px;
  border-radius: 10px;
  margin-top: 5px;
`;

const timeStyle = css`
  color: white;
  font-size: 10px;
  margin-left: 5px;
  margin-right: 5px;
  margin-bottom: 5px;
  display: inline-block;
  vertical-align: bottom;
`;

const ChatLogs: React.FC<{ logs: string[]; userName: string }> = ({
  logs,
  userName,
}) => {
  return (
    <div css={chatBoxStyle}>
      {logs.map((logStr, i) => {
        const log = JSON.parse(logStr);
        const isMine = log.author === userName;
        return (
          <p key={`msg_${i}`} css={userNameStyle}>
            {isMine ? (
              <div css={myMessageStyle}>
                {`${log.author}`} <br />
                <span css={timeStyle}>{`${log.time}`}</span>
                <div css={myMessageTextStyle}>{`${log.message}`}</div>
              </div>
            ) : (
              <div>
                {`${log.author}`} <br />
                <div css={otherMessageTextStyle}>{`${log.message}`}</div>
                <span css={timeStyle}>{`${log.time}`}</span>
              </div>
            )}
          </p>
        );
      })}
    </div>
  );
};

export default ChatLogs;
```
해당 컴포넌트 props에 userName을 추가했어요. 이렇게 추가된 userName은 메시지의 author와 비교되어 해당 메시지가 누구의 메시지인지 확인하는 용도로 사용돼요.

그리고 `isMine` 변수가 true인 경우에는 자신이 전송한 메시지라는 의미에요. 해당 변수와 조건부 연산자를 통해 현재 처리하고 메시지에 따라 동적으로 스타일을 다르게 적용시키도록 구현했어요.

### ChatComponent.tsx
```tsx
return (
    <div css={containerStyle}>
      <h1>아지트</h1>
      <ChatLogs logs={chatLogs} userName={userName} />
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
```
기존 logs와 함께 userName을 props로 전달하여 ChatLogs 컴포넌트를 사용해요. 이렇게 전달한 userName은 앞서 설명한 것처럼 메시지가 자신의 메시지인지 아닌지 확인하는 용도로 사용돼요.

### 결과

![](/images/posts/realtime-chat-service-2/985215e3-7d38-4d6e-8584-05310ce73ed0_image.webp)

**디자인 변경으로 좀 더 우리가 평소에 사용하는 채팅 서비스와 가까워지게 되었어요.**

</br>

## 마무리
이번 채팅 웹서비스를 만들어보면서 일상에서 마주친 문제를 소프트웨어로 해결하는 경험을 하게 되었어요. 또한 사용자의 입장에서 생각하며 기능을 구현하는 순간이 가장 흥미로웠던 것 같아요. 각 기능은 단순히 코드 몇 줄에 불과할 수 있지만, 그것이 사용자의 어떤 필요성에서 비롯되었는지, 어떻게 사용될 것인지를 고민하며 구현하는 것은 프로젝트 진행에 있어서 상당히 중요한 과정이라고 느끼게 되었어요.

코드 한 줄 한 줄에는 결국 이유가 있어야 하며, 그 이유는 바로 '문제 해결'을 위해서에요. 따라서 앞으로 개발 작업을 할 때도 항상 '왜 이런 방식으로 코드를 작성하는가?'라는 질문을 스스로에게 던져볼 예정이에요.

[프론트 코드](https://github.com/YehyeokBang/Chat-Web)
[백엔드 코드](https://github.com/YehyeokBang/Chat-Server)
</br>

## 참고
[Components and props](https://ko.legacy.reactjs.org/docs/components-and-props.html)
[Axios Docs](https://axios-http.com/kr/docs/intro)
