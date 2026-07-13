---
title: '[Java] Stream을 List로 수집하기'
date: '2023-10-05'
tags:
  - Java
  - Stream
  - Backend
description: >-
  Java Stream API에서 리스트로 수집할 때 사용되는 collect(Collectors.toList())와 Java 16에 추가된
  Stream.toList()의 차이점과 적절한 사용 상황을 알아봅니다.
---

## 궁금증
GDSC 활동을 하면서 미니 스터디인 `자바잡아-심화반`에서 강의하게 되었어요. 부족한 부분이 많지만 [강의 자료](https://velog.io/@hyeok_1212/%EC%9E%90%EB%B0%94%EC%9E%A1%EC%95%84-%EC%8B%AC%ED%99%94%EB%B0%98)에요. 해당 스터디를 준비하면서 궁금한 부분이 생겼어요.

아래는 ArrayList로 만든 list 객체에 여러 문자열(과일)들을 삽입하고 문자열의 길이가 5보다 큰 것들만 리스트로 모아서 result 변수에 담아서 출력까지 진행하는 코드에요.

![궁금증](/images/posts/java-stream-to-list/4dc70779-4202-4dc5-940c-6073ab4ebd13_image.webp)

인텔리제이로 코드를 작성하면 다음과 같은 안내문이 나타나요.
`'collect(toList())' can be replaced with 'toList()'`

toList()로 바꾸게 되면 다음과 같이 코드가 간결해져요.

```java
List<String> result = list.stream()
                .filter(fruit -> fruit.length() > 5)
                .toList();
```

처음엔 그냥 바꾼 후 "인텔리제이가 똑똑하네 더 간단하게 만들어주네~" 라고 생각했어요. 하지만 GDSC 멤버 중 한 명이 `두 코드의 차이점이 있나요?` `완전히 동일한 코드인가요?` 라고 물어봤어요. 바로 답은 못했고, 저도 궁금해져서 찾아보기로 했어요.

</br>

## collect() 방법
기존 사용하던 방법이에요.

### collect()
`collect()` 는 Java 스트림 API에서 제공하는 메소드이며, 스트림의 요소들을 원하는 결과 형태로 수집하는데 사용돼요. 이 메소드는 스트림 파이프라인의 마지막에 위치하는 최종 연산(소비)이며, 스트림의 요소를 처리하고 그 결과를 반환해요. 

[Collector 인터페이스](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Collector.html)에 정의된 다양한 정적 팩토리 메소드 및 유틸리티 메소드(Collectors 클래스)를 활용하여 원하는 기능 및 작업 흐름에 맞게 스트림 요소들을 그룹화하거나 집계할 수 있어요.

### Collectors.toList()
`Collector`는 Java의 Stream API에서 제공하는 인터페이스로, 스트림의 요소들을 어떤 방식으로 수집할지 정의해요. 주로 `collect()` 와 함께 사용되어 스트림의 요소를 특정한 방식으로 변환하거나 집계하는데 사용돼요.

추가로 Java에서는 [`Collectors`](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Collectors.html) 라는 유틸리티 클래스를 제공하여 다양한 종류의 `Collector`를 쉽게 생성할 수 있도록 돕고 있습니다. 예를 들어, Collectors.toList() 메서드는 스트림의 모든 요소들을 리스트로 수집하는 `Collector` 객체를 생성하며, 이와 비슷하게 Collectors.toSet(), Collectors.toMap() 등은 각각 세트나 맵으로 요소들을 수집하는 `Collector` 객체를 생성해요.

```java
List<String> result = list.stream()
                .filter(fruit -> fruit.length() > 5)
                .collect(Collectors.toList());
```

- `Collectors.toList()` : 스트림의 요소들을 리스트로 수집하겠다!
- `collect()` : 원하는 결과 형태로 수집 후 결과 반환

`filter()` 의 반환값인 스트림을 리스트 형태로 수집 후 반환해요.

![Collectors](/images/posts/java-stream-to-list/84a36b33-d8e5-43c7-a6e6-edd17235eced_image.webp)

`Collectors.toList()` 의 설명이에요. 여기서 중요하게 봐야할 부분은 다음과 같아요.

> There are no guarantees on the type, mutability, serializability, or thread-safety of the List returned.

반환된 리스트는 리스트의 타입, 가변성, 직렬화 가능성, 또는 스레드 안전성에 대한 보장은 안된다는 말이에요.

</br>

## toList() 방법
위에서 봤던 `Collectors.toList()` 와는 다른 메소드에요.

![toList](/images/posts/java-stream-to-list/a8273e76-4adf-4c86-b7f9-f0664921a020_image.webp)

해당 메소드는 스트림 인터페이스에 존재하는 default 메소드에요. 설명에서 중요하게 봐야할 부분은 다음과 같아요.

> The returned List is unmodifiable; calls to any mutator method will always cause UnsupportedOperationException to be thrown.

스트림 인터페이스에 존재하는 `toList()` 로 반환된 리스트는 수정할 수 없으며, 어떠한 변경 메소드를 호출하더라도 항상 `UnsupportedOperationException`이 발생한다는 말이에요.

</br>

## 테스트
그러면 두 코드의 가장 큰 차이인 `수정 가능성` 에 대해서 테스트해보려고 해요.

### collect(Collectors.toList()) 반환 리스트 수정하기
```java
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class StreamExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();

        list.add("Apple");
        list.add("Strawberry");
        list.add("Banana");
        list.add("Orange");
        list.add("Mango");
        list.add("Watermelon");

        List<String> result = list.stream()
                .filter(fruit -> fruit.length() > 5)
                .collect(Collectors.toList());

        result.add("Pineapple");

        for (String fruit : result) {
            System.out.println(fruit);
        }
    }
}
```
`collect(Collectors.toList())` 로 반환된 리스트에 "Pineapple" 문자열을 삽입하는 코드를 추가했고, 정상적으로 실행됐어요.

### toList() 반환 리스트 수정하기
```java
public class StreamExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();

        list.add("Apple");
        list.add("Strawberry");
        list.add("Banana");
        list.add("Orange");
        list.add("Mango");
        list.add("Watermelon");

        List<String> result = list.stream()
                .filter(fruit -> fruit.length() > 5)
                .toList();

        result.add("Pineapple");

        for (String fruit : result) {
            System.out.println(fruit);
        }
    }
}
```
스트림 인터페이스에 존재하는 `toList()` 로 반환된 리스트에 "Pineapple" 문자열을 삽입하려고 할 때 다음과 같이 `UnsupportedOperationException` 이 발생했어요.

![](/images/posts/java-stream-to-list/32cd9c0e-076e-4ce2-8ccc-d67a24510445_image.webp)

</br>

## 둘은 다르다!
테스트 결과 두 방식은 달랐어요.

- `collect(Collectors.toList())` : 수정이 가능해요.
- `toList()` : 수정이 불가능해요.

그러면 인텔리제이는 어느 상황에서나 `toList()` 로 바꿀 수 있다는 것을 안내할까? 갑자기 궁금해져서 확인해봤더니 다음과 같이 `collect()` 로 반환된 컬렉션이 이후에 변경되는 코드가 있을 때는 인텔리제이가 `toList()` 로 변경할 수 있다는 안내를 표시하지 않네요. (똑똑하네요...)
```java
public class StreamExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();

        list.add("Apple");
        list.add("Strawberry");
        list.add("Banana");
        list.add("Orange");
        list.add("Mango");
        list.add("Watermelon");

        List<String> result = list.stream()
                .filter(fruit -> fruit.length() > 5)
                .collect(Collectors.toList());

        result.add("Pineapple");

        for (String fruit : result) {
            System.out.println(fruit);
        }
    }
}
```

</br>

## 생각하기
멀티스레딩 환경일 때 여러 스레드에서 같은 리스트를 수정하려고 시도한다면 예상치 못한 결과나 오류가 발생할 수 있어요. 이런 경우 `Collectors.toList()` 로 생성된 리스트는 `thread-safe` 하지 않기 때문에 문제가 될 수 있어요.

반면, `toList()` 로 생성된 리스트는 수정 불가능(unmodifiable)하기 때문에 여러 스레드에서 동시에 접근하더라도 문제가 되지 않아요. 그러나 이 메서드로 생성된 리스트에 추가적인 요소를 추가하거나 삭제하는 등의 변경 작업을 할 수 없어요.

그래서 저는 반환된 리스트를 수정할 일이 없다면 `toList()` 를 사용하고 수정해야 한다면 `collect(Collectors.toList())` 를 사용할 것 같아요.

저는 항상 인텔리제이가 제안하는 방식을 따르는 편이었는데, 무작정 쓰다보면 이런 차이를 모르고 쓸 수도 있겠다는 생각이 들었어요. 앞으로도 어떠한 구현을 위해 다른 방법들이 있다면 비교를 통해 제 상황에 어울리는 최선의 선택을 해야겠다는 생각을 했어요.
