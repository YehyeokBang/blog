---
title: "복잡해지는 요구사항 속 도메인 간 강결합"
date: "2025-05-26"
excerpt: "변화하는 요구사항 속에서 도메인 간의 강결합 문제를 진단하고, 스프링 이벤트를 활용해 유연하고 독립적인 아키텍처를 설계하는 방법을 다룹니다."
---
소프트웨어의 요구사항은 시간이 지날수록 복잡해져요.

예전에는 많은 것을 예측하고 만드는 것이 잘 만들어진 소프트웨어라고 봤어요. 시장 흐름이 크게 복잡하지 않았고, 기술의 변화도 크지 않았기에 가능했던 것 같아요.

그러나 지금은 달라요. 사람들의 취향이나 트렌드는 하루만에 변하고, 기술은 끊임 없이 개발되어 우리를 놀라게 해요. AI 관련 기술만 보더라도 엄청난 속도를 체감할 수 있어요.

그래서 요즘은 예측도 중요하지만, `변화에 대응하는 것`을 더 중요하게 생각하는 것 같아요. 소프트웨어도 마찬가지로 읽기 좋은 코드, 확장 유연함 등을 중요하게 생각하면서 대응에 초점을 맞추는 것 같아요.

# 요구사항

> ### 요구사항(requirement)
> 
1.	사용자가 문제를 해결하거나 목표를 달성하기 위해 필요한 조건이나 능력
>	•	예: 사용자가 상품을 구매하기 위해 로그인 기능이 필요하다.
>
2.	시스템 또는 시스템 구성요소가 계약, 표준, 명세서 또는 기타 공식 문서를 만족하기 위해 갖추어야 할 조건이나 능력
>	•	예: “이 시스템은 하루 1,000건 이상의 요청을 처리할 수 있어야 한다”는 조건이 명세서에 명시되어 있다면, 그것이 요구사항이 된다.
3.	위 (1) 또는 (2)에 해당하는 조건이나 능력을 문서화한 것
> 	•	즉, 사용자 요구사항이든 시스템 요구사항이든, 그것을 문서로 작성한 것이 요구사항 문서이다.
>
> [출처: IEEE Standard Glossary of Software Engineering Terminology, p.62, requirement](https://www.informatik.htw-dresden.de/~hauptman/SEI/IEEE_Standard_Glossary_of_Software_Engineering_Terminology%20.pdf)

소프트웨어의 요구사항을 정리하면 `충족해야 할 조건이나 기능`으로 정리할 수 있어요.

## 빠르고 큰 변화

![](https://velog.velcdn.com/images/hyeok_1212/post/6789d3e0-1e09-4c1f-9121-b9664d4a5b74/image.png)

앞서 말한 것처럼 요즘은 변화가 큰 폭으로 자주 일어나기 때문에 `충족해야 할 조건이나 기능`이 계속해서 바뀌는 것 같아요. 예를 들어, 초기에는 `단순 예약 및 취소`만 필요했던 방탈출 예약 시스템에 갑자기 `예약 취소 시 대기 자동 승인` 기능이 필요해지고, 곧이어 `대기자에게 카카오톡 알림`을 보내는 기능, `예약 보증금 결제` 기능까지 추가되는 상황을 상상해 보세요.

이러한 관점으로 바라본 도메인 간 강결합에 대해 알아보려고 해요.

# 도메인 강결합?

방탈출 예약 애플리케이션을 예시로 살펴볼게요.

![](https://velog.velcdn.com/images/hyeok_1212/post/5dfbd86d-8ba3-4c27-bf5d-cbba70426a55/image.png)

사용자는 날짜, 테마, 시간을 선택하여 방탈출을 예약할 수 있어요.
만약, 해당 슬롯이 이미 예약된 경우 대기를 요청할 수 있어요.

## 자동 승인 기능 시나리오

![](https://velog.velcdn.com/images/hyeok_1212/post/ce5ec2cd-619e-43d8-a3d9-3e4b910a7051/image.png)

A 사용자가 예약을 하고, B 사용자가 동일한 슬롯에 대기를 요청했어요.

![](https://velog.velcdn.com/images/hyeok_1212/post/6e9451c4-8350-4135-8f9b-d7409d7e5cb0/image.png)

이후 A 사용자가 예약을 취소하면, B 사용자의 대기(첫 번째 대기)를 자동으로 승인하여 예약으로 전환해야 하는 시나리오를 살펴볼게요.

## 코드로 확인하기

```java
// ReservationService
public void cancel(Long reservationId) {
    reservationRepository.deleteById(reservationId);
}
```

식별자로 단순 예약 취소를 진행하던 코드에요. `자동 승인 기능`을 구현하기 위해 아래와 같이 작성할 수 있어요.

```java
public void cancel(Long reservationId) {
    reservationRepository.deleteById(reservationId);
    if (waitingRepository.exists()) {
        // 가장 먼저 등록된 대기자를 예약으로 전환
    }
}
```

이제 `자동 승인 기능`을 위해 예약 도메인이 대기 도메인을 알아야 해요...

예약이 대기를 알면 안 되는가? 아니요, 단순히 예약이 대기를 알면 안 된다는 건 아니에요.
다만, 저는 아래와 같은 관점에서 이 상황이 문제라고 인식될 수 있다고 생각했어요.

- 방탈출 예약 애플리케이션에서 `예약`은 가장 중요한 핵심 도메인이에요.
- 반면 `대기`라는 도메인은 없어질 수 있거나, 기능의 변경 빈도가 높을 것이라고 추측했어요.
  - 온라인 대기를 없애고 현장 대기로만 운영될 수 있다.
  - 특정 방탈출 슬롯은 대기를 지원하지 않을 수 있다.

이처럼 대기라는 도메인이 없어지거나 크게 변경되더라도 예약 기능에는 영향이 없어야 한다고 생각했어요. 정리하면 핵심 도메인이 변동성이 큰 도메인을 직접 알고 있다면, 변화에 대응하기 어려워질 것 같다는 의견이에요.

또한, 결제가 도입된다면, 또 다른 의존성이 추가될 수밖에 없어요.

```java
public void cancel(Long reservationId) {
    reservationRepository.deleteById(reservationId);
    if (waitingRepository.exists()) {
        // 대기 자동 승인
    }
    payment.cancel(); // 결제 취소 처리, 결제 도메인 알게 됨
}
```

결국 시간이 지나면, 예약 도메인이 다른 도메인(대기, 결제)과 강하게 결합돼요. `예약 취소 기능` 하나에 벌써 `자동 대기 승인`과 `결제 취소` 기능이 묶여있어요.

다른 관점으로는 새로운 기능이 추가될 때마다 기존 서비스에 변경이 일어나요. (OCP 위반 가능성) 결과적으로 기능 하나 하나가 비대해지고, 유지보수와 확장이 어려울 것 같다는 생각이 들었어요.

## 어떻게 해결했는가?

저는 도메인 복잡도를 낮추기 위해 `수동 승인`으로 구현했어요. 관리자가 직접 승인하는 구조에요.

![](https://velog.velcdn.com/images/hyeok_1212/post/aee91d6b-5dad-4023-8978-7a92601c24c2/image.png)

![](https://velog.velcdn.com/images/hyeok_1212/post/80437107-8dd6-41c0-bb3d-a48cdacc3b57/image.png)

- 좌: `자동 승인`, 우: `수동 승인`

이 방식은 대기 도메인이 변경되거나 없어지더라도, 제가 중요하게 생각한 예약 도메인에는 영향이 가지 않는다는 장점이 있어요. 핵심 도메인의 안정성을 지키면서 도메인 간의 직접적인 결합을 피했기에, 변화에 대응하기 쉬워졌다고 할 수 있어요.

도메인 복잡도가 감소하여, 변화에 대응하기 쉬워졌다고 할 수 있어요.

### 그러나...

제가 관리자라면, `수동 승인`보다는 `자동 승인`을 더 선호할 것 같아요. 도메인 복잡도를 감소시켜 개발 편의성을 높였지만, 그로 인해 사용자와 관리자의 편의성이 저하될 수 있어요. 과연 괜찮을까요?

시간이 지나면서, 예약의 안정성을 지키기 위해 결제 취소도 관리자가 직접 처리해야 하고, 대기자 알림도 시간마다 확인해서 보내거나 수동으로 전송해야 하는 등 운영상의 부담이 커질 수 있어요.

### 유연함을 위해서는 자동화를 포기해야 하는가?

`개발의 유연성`과 `사용자/운영의 편의성`을 모두 잡으려고 노력해야 해요.

기존 방식의 문제는 `도메인 간의 직접적인 의존성`에서 비롯되었어요. `ReservationService`가 `Waiting`과 `Payment` 등의 로직을 직접 호출하면서, `ReservationService`는 너무 많은 것을 알게 되고, 책임이 비대해졌죠. 마치 비행기가 관제탑 없이 서로 직접 통신하려 하는 것과 비슷했어요.

문제를 해결하기 위해, 저는 도메인 간의 직접적인 의존성을 끊고 간접적인 방식으로 소통하게 하는 방법들을 찾아봤어요. 그리고 그 해결책 중 하나로 이벤트 발행 및 수신에 대해 알게 되었어요.

# 이벤트?

프로그램에 의해 감지되고 처리될 수 있는 동작이나 사건을 말해요. 예를 들어, 사용자가 버튼을 클릭하는 행위, 파일 다운로드가 완료된 사건, 데이터베이스에 새로운 정보가 추가된 사건 등이 모두 이벤트가 될 수 있어요.

## 발행과 수신

이벤트 기반 아키텍처에서 핵심은 `이벤트 발행자(Publisher)`와 `이벤트 수신자(Subscriber)`에요.

- `이벤트 발행자(Publisher)`: 어떤 사건이 발생했음을 알리는 주체에요. 이벤트를 발생시키고, 자신에게 어떤 수신자가 이 이벤트를 처리할지는 전혀 알지 못해요. 그저 "나 이런 일 생겼어!"라고 외칠 뿐이에요.
- `이벤트 수신자(Subscriber)`: 특정 이벤트에 관심이 있어 해당 이벤트를 수신하고 처리하는 주체에요. 발행자가 어떤 객체인지는 알 필요가 없어요. 그저 "이런 이벤트가 발생하면 내가 처리해야지!"라고 기다릴 뿐이에요.

이벤트 발행자와 수신자는 서로에 대한 직접적인 참조나 의존성 없이 느슨하게 결합돼요. 마치 신문사(발행자)가 신문을 찍어내고, 독자(수신자)는 자신이 원하는 신문을 구독하는 것과 비슷해요. 신문사는 어떤 독자가 신문을 읽을지 모르고, 독자는 신문사가 어떤 방식으로 신문을 만드는지 모르는 것에 비유할 수 있어요.

## 스프링에서의 이벤트

스프링 프레임워크는 이벤트 기반 아키텍처를 쉽게 구현할 수 있게 도와줘요.

`스프링 이벤트(Spring Event)`는 애플리케이션 내부에서 특정 사건이 발생했을 때, 그 사건에 관심 있는 다른 컴포넌트들이 이를 인지하고 각자의 로직을 수행하도록 돕는 역할을 해요. 복잡한 설정을 할 필요 없이, 간단한 어노테이션 `@EventListener`만으로 이벤트 발행자와 수신자를 연결할 수 있어요.

- `이벤트 발행`: 특정 로직 수행 후, `ApplicationEventPublisher`를 통해 이벤트를 발행해요.
- `이벤트 수신`: 이벤트에 반응해야 하는 컴포넌트(서비스)는 발행된 이벤트를 받기 위해 `@EventListener` 어노테이션을 붙인 메서드를 정의해요. 스프링이 알아서 이벤트를 해당 메서드로 전달해줘요.

![](https://velog.velcdn.com/images/hyeok_1212/post/fd132b45-abc9-4171-b646-6441f3cbca6b/image.png)

`ReservationService`는 오직 예약을 취소하고 `취소 이벤트`만 발행하는 책임만 가지고, 다른 곳에서 이벤트를 수신받아 알아서 처리(자동 승인, 결제 취소 등)하면 돼요. 서로가 어떻게 구현되었는지 전혀 알 필요가 없어져요.

대기 자동 승인이나 결제 취소와 같은 기능이 추가되거나 수정될 때 예약 취소 기능에는 영향을 끼치지 않게 돼요.

# 코드로 알아보기

이벤트 발행 구독을 활용하여 느슨한 결합을 만드는 것을 목표로 간단하게 `자동 승인 기능`을 구현해볼게요.

## 발행할 이벤트

```java
public record ReservationCancelEvent(
        LocalDate reservationDate,
        Long reservationTimeId,
        Long themeId
) {
}
```

예약이 취소되는 경우 `날짜, 시간 id, 테마 id`를 담은 취소 이벤트를 발행하고 이를 통해 밖에서 로직을 수행해요. 간결하고 불변성을 보장하기 위해 record를 사용했어요.

> 스프링 4.2 이전에는 반드시 이벤트 클래스가 `ApplicationEvent`를 상속받아야 했어요. 하지만 4.2부터는 해당 클래스를 상속받지 않고도(어떤 타입이라도, Object) 이벤트로 사용할 수 있게 되었어요. 
>
![](https://velog.velcdn.com/images/hyeok_1212/post/5d412787-a8d5-4d19-a1da-d9085ceb9ff0/image.png)
> 덕분에 원하는 형태의 클래스를 정의하고 이벤트로 사용할 수 있어요.

## 예약 취소 기능 (이벤트 발행)

```java
@Service
@Transactional
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    public void cancelById(Long reservationId) {
        Reservation reservation = getReservation(reservationId);
        reservationRepository.delete(reservation);
        applicationEventPublisher.publishEvent(
                new ReservationCancelEvent(
                    reservation.getDate(),
                    reservation.getTime().getId(),
                    reservation.getTheme().getId()
                )
        ));
    }
}
```

`ApplicationEventPublisher#publishEvent`를 사용하여 예약 취소라는 사건을 시스템에 알리는 이벤트를 발행해요. `ReservationService`는 이제 대기나 결제 로직에 대해 아무것도 알 필요가 없어요. 그저 "예약이 취소되었다"는 사실만 알리면 돼요.

## 자동 승인 기능 (이벤트 수신 및 로직)

```java
@Component
@RequiredArgsConstructor
public class DeleteReservationEventListener {

    private final AutoWaitingPromotionService autoWaitingPromotionService;

    // 이벤트 수신
    @EventListener
    public void handle(ReservationCancelEvent reservationCancelEvent) {
        // 이벤트에서 값을 꺼내 전달
        autoWaitingPromotionService.promote(
                reservationCancelEvent.reservationDate(),
                reservationCancelEvent.reservationTimeId(),
                reservationCancelEvent.themeId()
        );
    }
}

@Service
@Transactional
@RequiredArgsConstructor
public class AutoWaitingPromotionService {

    private final WaitingRepository waitingRepository;
    private final ReservationRepository reservationRepository;

    // 로직 수행
    public void promote(LocalDate reservationDate, Long reservationTimeId, Long themeId) {
        // 대기 존재 여부를 확인하고 존재한다면, 가장 첫 대기를 예약으로 승인
    }
}
```

`@EventListener` 어노테이션이 붙은 `handle()` 메서드는 `ReservationCancelEvent`가 발행되면 자동으로 호출돼요. `DeleteReservationEventListener`는 이벤트 발행자와 수신자 사이에서 중개자 역할을 하며, 실제 비즈니스 로직은 `AutoWaitingPromotionService`가 담당하고 있어요. 

덕분에 `ReservationService`와 `AutoWaitingPromotionService`는 서로의 존재를 모르고 독립적으로 동작할 수 있게 돼요.

## 만약 이벤트 수신이 많아지면?

이제 `@EventListener`를 사용하여 어디서든 `ReservationCancelEvent`를 수신하고 필요한 로직을 처리할 수 있게 되었어요. 덕분에 시스템의 결합도를 낮추고 유연성을 높일 수 있었어요.

하지만, 만약 취소 이벤트를 수신하고 처리하는 로직이 많아지거나, 그 로직 자체가 오래 걸리는 작업이라면 어떻게 될까요? 아래에서 이메일 전송 중 문제가 발생하여 30초간 기다리는 시나리오를 생각해 볼게요.

```java
@EventListener
@Transactional
public void handle(ReservationCancelEvent reservationCancelEvent) {
    // 예시: 이메일 전송 중 문제가 발생하여 30초간 대기하는 시나리오
    // emailSender.send(...);
    // 30초 대기
    try {
        Thread.sleep(30_000);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException("Thread was interrupted", e);
    }
}
```

이때, 취소 이벤트를 발행한 메서드를 호출한 사용자는 30초 넘게 응답을 받지 못하게 돼요. 사용자에게 시스템이 느리거나 멈춘 것처럼 느껴지게 하여 불만족스러운 경험을 제공할 수 있어요.

### 동기 vs 비동기 이벤트 처리

기본적으로 스프링의 `@EventListener`는 이벤트를 발행한 곳과 같은 스레드에서 `동기(Synchronous)` 방식으로 처리해요.

예를 들어, A라는 서비스에서 이벤트를 발생시키면, 이 이벤트를 처리하는 `@EventListener` 메서드도 A 서비스의 스레드에서 바로 실행돼요. 이렇게 되면 모든 이벤트 리스너의 작업이 완료될 때까지 A 서비스의 응답이 지연돼요. (그래서 30초 넘게 응답을 받지 못했어요)

만약 이메일 발송처럼 당장 보내는 것을 기다리지 않아도 되는 부가적인 작업이라면, 비동기 방식을 사용할 수 있어요. 스프링은 `@Async` 어노테이션을 통해 이를 간단하게 지원하고 있어요.

먼저, 스프링 애플리케이션에 비동기 기능을 활성화 해줘야 해요. 보통 메인 애플리케이션 클래스나 별도의 설정 클래스에 `@EnableAsync` 어노테이션을 추가하는 방식으로 활성화 해요.

```java
@EnableAsync // 비동기 기능 활성화
@SpringBootApplication
public class RoomEscapeApplication {
}
```

```java
@Async
@EventListener
@Transactional
public void handle(ReservationCancelEvent reservationCancelEvent) {
    // 취소 관련 이메일 전송 로직 수행
}
```

![](https://velog.velcdn.com/images/hyeok_1212/post/230f6125-dff6-4eae-a5d6-6b78f7d7443b/image.png)

이렇게 비동기 처리하면, 예약 취소의 응답 속도가 빨라지는 장점이 있어요. 예약 취소 요청이 빠르게 처리되고, 부가적인 작업은 백그라운드에서 진행되니까요.

하지만, 만약 이벤트 처리를 다른 스레드에서 비동기적으로 하고 싶다면 주의해야 할 문제가 있어요. 새로운 스레드에서는 원래 스레드의 `ThreadLocal`이나 `MDC(Mapped Diagnostic Context)` 정보가 기본적으로 전달되지 않아요.

> ### 컨텍스트 전파(Context Propagation)
>
>ThreadLocal에는 현재 로그인한 사용자 정보, 요청 ID, 트랜잭션 ID 등 중요한 컨텍스트 정보가 저장되는 경우가 많아요. MDC는 로깅에 사용되어 특정 요청에 대한 모든 로그를 추적할 수 있게 해주죠. 이벤트가 다른 스레드에서 처리될 때 이러한 컨텍스트 정보가 전파되지 않으면, 로그에 사용자 정보가 누락되거나, 특정 요청의 흐름을 추적하기 어려워지는 등의 문제가 발생할 수 있어요. 스프링은 이러한 문제를 해결하기 위한 기술(예: CompletableFuture, TaskDecorator 등을 활용한 컨텍스트 전파)을 제공하고 있어요.
>
[Application Events and @EventListener, Spring Docs](https://docs.spring.io/spring-framework/reference/integration/observability.html#observability.application-events)

# @EventListener는 publishEvent가 수행되는 즉시 동작?

또 다른 중요한 문제가 있어요. 현재 `@EventListener`는 `publishEvent()`가 호출되는 즉시 동작해요.

방탈출 예약 취소를 수행하고, 중간에 `publishEvent()`로 취소 이벤트를 발행하는 순간 `@EventListener`가 동작해요.

```java
@Service
@Transactional
public class ReservationService {
    // ...
    public void cancelById(Long reservationId) {
        Reservation reservation = getReservation(reservationId);
        reservationRepository.delete(reservation); // (1) 예약 삭제 시도
        applicationEventPublisher.publishEvent(new ReservationCancelEvent(...)); // (2) 이벤트 발행
        // ... (3) 만약 여기서 예상치 못한 예외가 발생한다면?
    }
}
```

만약 (3)번 위치에서 예상치 못한 예외가 발생하여 `ReservationService`의 트랜잭션이 롤백되었다면 어떻게 될까요? 

예약 삭제 작업은 롤백되지만, 리스너는 이미 (2)번 시점에서 동작했기 때문에 첫 번째 대기를 승인하려고 할 거예요. 예약은 취소되지 않았는데 대기는 승인되어버리는 상황이기 때문에 심각한 데이터 불일치를 야기할 수 있어요.

## @TransactionalEventListener

이러한 데이터 불일치 문제를 해결하기 위해 스프링에서는 트랜잭션의 완료 시점에 따라 이벤트가 동작하도록 특별히 설계된 `@TransactionalEventListener`를 제공해요.

`@TransactionalEventListener`는 이름 그대로 트랜잭션에 묶여 동작하는 이벤트 리스너예요. 일반 `@EventListener`와 달리, 이벤트 발행 시 바로 실행되지 않고, 이벤트가 발행된 트랜잭션의 특정 단계(Phase)에서만 실행되도록 설정할 수 있어요.

### phase 속성

- `AFTER_COMMIT` (기본값): 트랜잭션이 성공적으로 커밋된 후에 이벤트가 실행돼요. 가장 일반적이고 중요한 설정으로, ReservationService의 트랜잭션이 성공해야만 대기 자동 승인 로직이 동작하도록 할 수 있어요.
- `BEFORE_COMMIT`: 트랜잭션이 커밋되기 직전에 실행돼요.
- `AFTER_ROLLBACK`: 트랜잭션이 롤백된 후에 실행돼요. (예: 특정 작업 실패 시 로그 기록, 보상 트랜잭션 등)
- `AFTER_COMPLETION`: 트랜잭션이 커밋되든 롤백되든 완료된 후에 실행돼요.

> 트랜잭션이 없는 경우, 즉 이벤트를 발행한 스레드에서 트랜잭션이 실행 중이 아니라면 `@TransactionalEventListener`는 기본적으로 호출되지 않아요. 이는 트랜잭션과 연동되어야 하는 리스너의 본래 목적 때문이에요. 만약 트랜잭션이 없더라도 리스너가 동작해야 한다면 `fallbackExecution = true` 속성을 사용할 수 있지만, 이 경우 트랜잭션 연동의 이점은 사라지므로 신중하게 선택해야 해요.
>
> [Transaction-bound Events, Spring Docs](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)

## 예약 취소가 정말 되었을 때만 대기를 승인하자 (최종 개선)

```java
@Async
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void promoteWaitingAfterReservationCanceled(ReservationCancelEvent reservationCancelEvent) {
    LocalDate date = reservationCancelEvent.reservationDate();
    Long reservationTimeId = reservationCancelEvent.reservationTimeId();
    Long themeId = reservationCancelEvent.themeId();
    autoWaitingPromotionService.promote(date, reservationTimeId, themeId);
}
```

이제 이 리스너는 예약 취소 트랜잭션이 성공적으로 커밋된 이후에만 동작해요.

### 질문 1: @TransactionalEventListener를 @Async와 함께 사용할 수 있나요?

네, `@TransactionalEventListener`와 `@Async`는 함께 사용할 수 있으며, 실제로 많이 권장되는 조합이라고 해요.

두 어노테이션은 서로 다른 목적을 가지고 상호 보완적으로 작동해요.

`@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`은 **언제** 이벤트 리스너가 실행될지를 제어해요. 즉, 이벤트 발행 트랜잭션(여기서는 예약 취소 트랜잭션)이 성공적으로 커밋된 후에만 이 리스너가 동작하도록 보장해요.

`@Async`는 **어떻게** 이벤트 리스너가 실행될지를 제어해요. 리스너의 로직을 이벤트를 발행한 스레드가 아닌, 별도의 스레드에서 비동기적으로 실행되도록 만들어요. 덕분에 오래 걸릴 수 있는 작업이 메인 스레드를 블로킹하지 않아 애플리케이션의 응답 속도를 개선할 수 있어요.

두 어노테이션을 함께 사용하면, **예약 취소 트랜잭션이 확정된 후 (데이터 정합성 보장), 부가적인 대기 승인 로직이 별도의 스레드에서 빠르게 처리(성능 향상)**되는 시나리오를 구현할 수 있어요.

> `BEFORE_COMMIT`는 발행 트랜잭션과 동일한 스레드에서 실행되므로, `@Async`와 함께 사용할 수 없어요. `@Async`를 사용하면 별도의 스레드가 생성되어 트랜잭션 컨텍스트가 분리되기 때문이에요.

### 질문 2: 트랜잭션은 하나의 스레드에서만 보장되는 것 아니었나요?

예리한 질문이에요. 스프링의 기본 트랜잭션(JPA, JDBC 등)은 기본적으로 하나의 스레드에 묶여 동작해요. 그러나 잘 살펴보면 이벤트 리스너가 트랜잭션이 `종료된 후`에 동작한다는 부분을 알 수 이어요.

1. `예약 취소 트랜잭션 (메인 스레드)`: ReservationService에서 예약 취소 로직이 실행될 때 트랜잭션이 시작되고, 이 트랜잭션은 해당 요청을 처리하는 스레드에 묶여요. 이 스레드에서 `ReservationCancelEvent`가 발행돼요.

2. `리스너의 대기`:
`@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`가 붙은 리스너는 이 이벤트를 즉시 처리하지 않아요. 대신, 이벤트가 발행된 트랜잭션이 성공적으로 커밋될 때까지 대기하고 있어요.

3. `트랜잭션 커밋 후 비동기 실행`:
ReservationService의 트랜잭션이 성공적으로 커밋되면, 예약 삭제와 같은 모든 핵심 변경 사항이 데이터베이스에 영구적으로 반영된 상태에요. 이때 리스너의 실행 조건이 충족되고, 리스너 메서드에 `@Async`가 붙어 있으므로, 이 로직은 메인 스레드와는 별개의 새로운 스레드에서 비동기적으로 시작돼요.

## 단점

되게 좋은 것 같지만, (예상되는) 단점도 꽤나 명확한 것 같아요.

### 이벤트 추적 및 관리 어려움

시간이 지날수록 어떤 이벤트가 발행되고 수신되고 있는지 파악하기 어려워질 것 같아요.

> GPT: 분산 트레이싱(Distributed Tracing) 도구(예: Zipkin, Jaeger)나 APM(Application Performance Management) 툴을 활용하여 이벤트 흐름을 추적하고 가시성을 확보할 수 있습니다.

### 트랜잭션 관리 어려움

의존성을 과하게 분리하거나 비동기 작업이 많아진다면, 트랜잭션을 관리하는 것이 어려워질 것 같아요. 

> GPT: @TransactionalEventListener와 리스너 메서드에 @Transactional을 함께 사용하는 것은 이러한 독립적인 비동기 트랜잭션을 효과적으로 관리하는 방법 중 하나입니다. 각 트랜잭션의 범위를 명확히 인지하고 설계해야 합니다.

### 순서 보장이 필요하다면?

순서 보장이 필요하지 않은 작업만 이 구조를 가져가면 좋을 것 같다는 생각을 했어요. 만약 순서 보장이 필요한 경우에 이벤트 발행-수신 구조를 가져간다면, 얻는 이점 대비 복잡성이 더 늘 것 같아요.

정리하면 `복잡도 증가`인 것 같아요. 개발 블로그의 마무리에 꽃인 상황에 따른 적절한 선택이 필요할 것 같아요.

> GPT: 이 경우 메시지 큐의 순서 보장 기능(예: 카프카의 파티션 내 순서)을 활용하거나, 단일 소비자 패턴을 고려해야 합니다.

## 마무리: 유연성과 편의성을 모두 잡는 구조

예측보다는 변화에 대응하는 것이 중요해진 현대 소프트웨어 개발 환경에서, 도메인 간의 강결합 문제를 알아봤어요. 그리고 이를 해결하기 위해 `이벤트 발행-수신` 구조를 살펴보며, 특히 스프링 이벤트가 이러한 문제를 어떻게 해결해 줄 수 있는지 코드로 직접 확인해봤어요.

핵심은 `느슨한 결합으로 유연한 대처 가능`, `비동기 처리로 응답 속도 개선`, `트랜잭션 연동으로 데이터 정합성 보장`이었어요.

결론적으로, 개발 유연성이라는 목표 아래 도메인 간의 직접적인 의존성을 끊어내고, 이벤트 기반의 비동기 트랜잭션 연동 방식으로 소통하게 함으로써, 사용자와 관리자의 편의성을 동시에 잡는 아키텍처를 구축할 수 있음을 살펴봤어요.

처음 접하는 방식이라 재밌었어요. 어렵긴 하더라구요 ㅎㅎ.. 더 학습해보겠습니다!

긴 글 읽어주셔서 감사합니다.

### 더 궁금한 내용

- 서버 간 이벤트 발행?
- 이벤트 발행-수신 구조에서 실패 복구 전략
- 느슨한 결합을 위한 다른 구조
- 성능 성능 성능
- 이벤트 테스트 전략
