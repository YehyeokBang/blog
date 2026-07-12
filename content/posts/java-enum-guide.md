---
title: "[Java] Enum 사용하시나요?"
date: "2024-11-05"
description: "Java 5에서 도입된 Enum(열거형)의 기본적인 특징과 동작 원리, 기존 상수 정의 방식(정수형 열거형)의 한계점 극복, 그리고 싱글톤 보장 메커니즘과 고급 활용법(상태/행위 추가 및 익명 클래스 활용)을 공식 문서를 통해 알아봅니다."
tags: ["Java", "Enum", "Backend", "Object-Oriented"]
---

![](/images/posts/java-enum-guide/b3e3030d-d958-4a77-b623-1aab4db60563_image.webp)

우아한테크코스의 프리코스 3주 차 프로그래밍 요구 사항이에요. Enum 없이도 원하는 기능을 만들 수는 있었기 때문에 학습할 필요를 느끼기 힘들었는데, 이번 기회에 Enum에 대해 학습하고 이유를 알아보려고 해요.

구글에 검색할 때 가장 먼저 보이는 것은 이동욱 님의 [Java Enum 활용기 포스팅](https://techblog.woowahan.com/2527/)이에요. 간단하게 Enum을 소개하고 실제 적용한 예시를 보여주면서 enum의 장점을 체감할 수 있게 해주는 블로그라서 Enum을 처음 접하시는 경우 읽어보시면 도움이 될 것 같아요.

> - Enum을 통해 확실한 부분과 불확실한 부분을 분리할 수 있었습니다. 
> - 특히 가장 실감했던 장점은 문맥(Context)을 담는다는 것이었습니다.
> 
> [Java Enum 활용기 포스팅 中](https://techblog.woowahan.com/2527/)

저는 학습을 시작할 때 블로그 글로 간단한 개념과 예시로 장단점을 익히고 공식 문서를 확인하는 편이에요. 영어로 작성되어 있기 때문에 다소 시간이 걸리지만, 직관적인 설명과 링크로 이어진 방대한 자료로 더 넓게 이해할 수 있는 것 같아요. 이번에도 공식 문서를 위주로 학습해 보려고 해요.

# Enum?

> Enum은 2004년 9월 Java 5(1.5)에 추가되었어요.  
이때 부터 1.x 표기가 아닌 x로 표기하기 시작했어요. [Version 1.5.0 vs 5.0?](https://docs.oracle.com/javase/1.5.0/docs/relnotes/version-5.0.html)

열거형(Enumeration), 줄여서 `Enum`은 개발자가 미리 정의된 상수 집합을 변수로 정의할 수 있게 해주는 Java의 특별한 데이터 타입이에요. 

Enum이 새롭고 화려한 개념이고, 언제나 꼭 사용해야 하는 것이다! 보다는 코드의 신뢰성과 가독성을 높여주는 개선 도구라고 이해하면 좋을 것 같아요.

먼저 Enum 추가 이전의 상수 사용 방식을 먼저 확인하고, Enum의 필요성에 대해 알아보려고 해요.

## 이전에는

```java
// int 타입 열거형 예시
public static final int SEASON_WINTER = 0;
public static final int SEASON_SPRING = 1;
public static final int SEASON_SUMMER = 2;
public static final int SEASON_FALL   = 3;
```

이는 Enum 추가 전에 final 키워드를 이용해 변수를 상수화 하여 사계절을 구분짓는 일반적인 패턴이었어요. 아래와 같이 상수를 사용할 수 있어요.

```java
public static void main(String[] args) {
    int currentSeason = SEASON_FALL; // 가을로 지정, 사실은 3이에요.

    switch (currentSeason) {
        case SEASON_WINTER:
            System.out.println("겨울이다!");
            break;
        case SEASON_SPRING:
            System.out.println("봄이다!");
            break;
        case SEASON_SUMMER:
            System.out.println("덥다..");
            break;
        case SEASON_FALL:
            System.out.println("가을이다!");
            break;
        default:
            System.out.println("알 수 없는 계절이에요.");
    }
}
```

이런 방식에는 문제가 있어요.

- `타입 안전성 부족` : 계절이 단순히 정수(int)로 표현되기 때문에 계절이 필요한 곳에 다른 정수를 전달하거나 두 계절을 더하는 등의 잘못된 사용이 가능해요. (다양한 사람이 함께 작업하는 환경에서 의도와 잘못된 사용이 가능하다는 것은 큰 문제가 될 수 있어요.)

- `이름 지정(?) 부족` : 정수형 열거형의 상수는 다른 정수형 열거형 타입과의 충돌을 피하기 위해 문자열(SEASON_)로 접두사를 붙이는 작업이 필요해요.

- `취약성` : 정수형 열거형은 `컴파일 타임 상수`이기 때문에 이를 사용하는 클라이언트에 컴파일되어 포함돼요. 만약 기존 상수 사이에 새로운 상수가 추가되거나 순서가 변경되면, 클라이언트는 다시 컴파일해야 해요. (안해도 실행은 가능하지만, 원하는대로 동작되지 않을 수 있어요.)

- `깡통 출력값` : 단순히 정숫값이기 때문에 출력할 경우 숫자만 나타나며, 그 숫자가 무엇을 나타내는지, 어떤 유형인지에 대한 정보는 전혀 제공되지 않아요.

이러한 문제를 해결하기 위해 `Type-Safe-Enum Pattern`을 사용할 수 있지만, 이 패턴은 코드가 너무 길어지는 문제가 있고, 특히 이 패턴으로 만든 상수는 `switch 문`에서 사용할 수 없다는 단점이 있어요.

## 그래서!

Java 프로그래밍 언어는 5 버전에서 열거형 타입에 대한 언어적 지원을 추가했어요. 그것이 Enum이에요.

```java
enum Season { WINTER, SPRING, SUMMER, FALL }
```

![](/images/posts/java-enum-guide/729265a9-fe85-4149-8210-34e4f2d619e1_image.webp)

가장 간단한 형태의 Enum을 보면 다른 언어(C, C++, C#)와 유사하게 보여요. 그러나 [공식 문서](https://docs.oracle.com/javase/1.5.0/docs/guide/language/enums.html)에서는 Java의 Enum은 다른 언어의 열거형보다 훨씬 강력하다고 소개해요.

## 강력한 Java의 Enum

다른 언어의 열거형은 단순히 나열된 정수에 불과하지만, Java의 Enum은 완전한 기능을 갖춘 클래스에요. 위에서 확인한 모든 문제를 해결하면서도 아래의 이점을 누릴 수 있어요.

- `완전한 클래스!` : Java에서 Enum을 정의하면, 단순한 값의 목록이 아니라 `기능이 있는 클래스`를 만들게 됩니다. 이 클래스는 메서드와 필드를 가질 수 있어, 다양한 동작을 수행할 수 있어요.

- `임의의 메서드와 필드 추가 가능!` : Enum에 원하는 메서드와 변수를 추가할 수 있어요. 예를 들어, 계절(Enum Season)에 대한 메서드를 추가하여 각 계절의 특징을 설명할 수 있게 만들 수 있어요.

- `인터페이스 구현 가능!` : Enum은 다른 클래스와 마찬가지로 인터페이스를 구현할 수 있어요. 이를 통해 Enum의 기능을 더욱 확장하고 유연하게 사용할 수 있어요.

- `Object 메서드를 Enum에 맞게!` : Java의 Enum은 `equals()`, `hashCode()`, `toString()`과 같은 Object 클래스의 메서드를 더 Enum 특성에 맞게 만들어줘요. Enum 값들을 비교하거나 출력할 때 편하게 사용할 수 있어요.

- `Comparable과 Serializable` : Java의 Enum은 `Comparable`과 `Serializable` 인터페이스를 구현하여, Enum 값들을 쉽게 비교하고 저장할 수 있어요.


### 채찍피티의 비교

![](/images/posts/java-enum-guide/4c9dd4e5-b3c4-4a89-9354-cbfb5ff21c8e_image.webp)

### 추가적인 장점

- `switch 문`에서도 사용할 수 있어요.
- IDE의 지원이 좋아요. (자동완성, 오타검증, 텍스트 리팩토링 등)
- 리팩토링시 변경 범위가 줄어들어요. Enum에 정의하고 다른 곳에서 사용하기 때문에 Enum에만 변경이 일어나요.

# Enum 구조

Enum은 `enum` 키워드를 사용해 선언되며, Enum 선언은 아래와 같은 구조를 가져요.
```
{ClassModifier} enum TypeIdentifier [ClassImplements] EnumBody
```

- `ClassModifier` : 클래스의 접근 제어자 및 기타 수정자를 지정해요. (예: public, private 등)
- `TypeIdentifier` : Enum의 이름이에요.
- `ClassImplements` : 필요한 경우 구현할 인터페이스를 지정할 수 있어요.
- `EnumBody` : 열거 상수 및 추가 메서드, 필드를 정의할 수 있어요.

> ### Enum 관례
>
> - Enum 명은 클래스처럼 첫 문자를 대문자로하고 나머지는 소문자로 구성해요.
> - 열거 상수는 모두 대문자로 작성하며, 여러 단어로 구성된 경우 단어 사이에 언더바(_)를 사용해요.

[공식 문서](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Enum.html)에서 각 메서드에 대한 자세한 구현 내용을 확인할 수 있어요.

이제 예제 코드를 보며 Enum의 구조와 사용 예시를 살펴볼게요.

## 예시

```java
public enum Season { WINTER, SPRING, SUMMER, FALL }
```

- 사계절을 구성하는 Season Enum이며, 각 상수(WINTER ~ FALL)는 Season Enum의 `인스턴스`에요.
- Enum 상수는 고정된 값을 가지며, 외부에서 변경할 수 없어요.
- Enum 클래스는 기본적으로 `values()`와 `valueOf(String name)` 메서드가 제공돼요.
	- `values()` : Enum의 모든 상수를 배열로 반환해요.
	- `valueOf(String name)` : 해당 이름을 가진 Enum 상수를 반환해요.


```java
public static void main(String[] args) {
    Season season = Season.FALL; // Enum 타입도 객체!

    switch (season) {
        case WINTER:
            System.out.println("겨울이다!");
            break;
        case SPRING:
            System.out.println("봄이다!");
            break;
        case SUMMER:
            System.out.println("덥다..");
            break;
        case FALL:
            System.out.println("가을이다!");
            break;
    }
}
```

사계절 예제를 Enum을 사용하여 바꾸면 위와 같이 작성할 수 있어요. 기존에는 정수 상수를 사용하여 계절을 표현했지만, 잘못된 값(예: 4)이 입력될 위험이 있었어요. Enum을 사용하면 이러한 위험 없이 정의된 값만 사용하게 되어, 안전성과 가독성을 동시에 확보할 수 있어요.

또한, Enum은 정의된 상수 이외의 값이 입력되면 컴파일 시 에러를 발생시켜, 오류를 초기에 잡아낼 수 있도록 해줘요.

![](/images/posts/java-enum-guide/7b2d7753-4c32-4c7e-a9ce-8b8c1d0843c7_image.webp)

다만, 이렇게 끝나면 안전성과 가독성 외에는 기존 상수 선언 방법과 크게 다른 부분이 없어보일 수 있어요.

## 고급(?) 사용

```java
public enum Season {
    WINTER("겨울"),
    SPRING("봄"),
    SUMMER("여름"),
    FALL("가을");

    private final String koreanName;

    Season(String koreanName) {
        this.koreanName = koreanName;
    }

    @Override
    public String toString() {
        return koreanName;
    }
}
```

이 예제에서 `Season` 열거형(Enum)은 각 계절을 나타내는 상수뿐 아니라, 각 계절에 대응하는 한글 이름(koreanName) 필드도 가지고 있어요. 이처럼 Enum에 필드를 추가해 각 인스턴스가 고유한 값을 가질 수 있으며, 이를 활용해 보다 더욱 구체적으로 데이터를 표현할 수 있어요.

```java
public static void main(String[] args) {
    for (Season season : Season.values()) {
        System.out.println(season);  // 각 계절의 한글 이름이 출력돼요.
    }
}
```

`Season` Enum의 각 인스턴스는 생성자에서 한글 이름을 전달받아 `koreanName` 필드에 저장해요. 이렇게 생성된 Enum 인스턴스는 `toString()` 메서드를 재정의하여, 기본적인 `name()` 대신 `koreanName`을 반환하도록 하고 있어요.

즉, `Season.WINTER`를 출력할 때 "겨울"이라는 한글 이름이 출력돼요. 즉, Enum은 일반 클래스처럼 동작하면서도 안전한 방식으로 데이터를 관리할 수 있어요.

추가적으로 익명 클래스 형태로 구현될 수 있기 때문에 각 상수가 다른 메서드를 가질 수 있도록 설계할 수도 있어요.

```java
//  ADD와 SUBTRACT 상수는 각각 고유의 apply 메서드를 구현하여 연산을 다르게 수행해요.
public enum Operation {
    ADD {
        public int apply(int x, int y) { return x + y; }
    },
    SUBTRACT {
        public int apply(int x, int y) { return x - y; }
    };

    public abstract int apply(int x, int y);
}
```

각 Enum 상수가 서로 다른 연산을 수행할 수 있도록 익명 클래스 형태로 `apply` 메서드를 구현해요. 이를 통해 상수별로 고유한 로직을 정의할 수 있으며, 추상 메서드를 이용해 상수마다 다른 동작을 할 수 있는 유연한 Enum 구조를 만들 수 있어요.

Java Enum은 상수만을 나열하는 데서 끝나지 않고, 상태나 동작을 담아 좀 더 풍부하게 데이터와 로직을 표현할 수 있게 되어 단순 열거형 이상의 강력한 도구로 사용할 수 있어요.

## 또 다른 예제

어떤 개념에 대한 다양한 예제를 보면 자신에게 좋은 방법을 찾을 수도 있어요. 다른 예제도 확인해 보면 좋을 것 같아요.

```java
public class Card {
    // 트럼프 카드에서 카드 숫자(순위)를 정의하는 열거형이에요.
    public enum Rank {
        DEUCE, THREE, FOUR, FIVE, SIX,
        SEVEN, EIGHT, NINE, TEN,
        JACK, QUEEN, KING, ACE
    }

    // 트럼프 카드에서 카드 문양을 정의하는 열거형이에요.
    public enum Suit {
        CLUBS, DIAMONDS, HEARTS, SPADES
    }

    // 카드 객체는 숫자(rank)와 문양(suit)으로 구성되어 있어요.
    private final Rank rank;  // 카드의 숫자 (예: ACE, KING 등)
    private final Suit suit;   // 카드의 문양 (예: HEARTS, SPADES 등)

    // 생성자
    private Card(Rank rank, Suit suit) {
        this.rank = rank;
        this.suit = suit;
    }

    public Rank rank() {
        return rank;
    }

    public Suit suit() {
        return suit;
    }

    // 카드의 정보를 문자열로 반환하는 메서드에요.
    public String toString() {
        return rank + " of " + suit;  // "숫자 of 문양" 형식
    }

    // 초기 카드 덱을 저장할 리스트입니다.
    private static final List<Card> protoDeck = new ArrayList<>();

    // 정적 블록을 사용하여 초기 카드 덱을 생성해요.
    static {
        // 각 문양에 대해
        for (Suit suit : Suit.values()) {
            // 각 숫자를 반복하여 카드 객체를 생성합니다.
            for (Rank rank : Rank.values()) {
                protoDeck.add(new Card(rank, suit));  // 새로운 카드 객체를 덱에 추가
            }
        }
    }
    
    // 초기 카드 뭉치를 반환하는 정적 메서드에요.
    public static ArrayList<Card> newDeck() {
        return new ArrayList<>(protoDeck);
    }
}
```

```java
public class Main {
    public static void main(String[] args) {
        // Card 클래스의 정적 메서드로 초기 카드 뭉치를 가져온 후 출력해요.
        ArrayList<Card> cards = Card.newDeck();
        for (Card card : cards) {
            System.out.println("card.toString() = " + card.toString());
        }
    }
}

/* 출력
DEUCE of CLUBS
THREE of CLUBS
FOUR of CLUBS
...
ACE of SPADES
*/
```

여러 개의 Enum을 사용해 카드 게임을 위한 Card 클래스를 쉽고 안전하게 만들 수 있어요.

관련된 상수들을 그룹화하여 구조화된 데이터를 정의할 수 있어요. `Rank.THREE`나 `Suit.HEARTS`는 각각 카드에서 특정 숫자와 문양을 의미하기 때문에 직관적이고, 선언된 상수 중에서 선택해야 하기 때문에(그렇지 않은 경우 컴파일 에러) 안전성도 높아져요.

또한, Rank 비교를 위한 메서드를 구현하는 등 메서드를 추가하여 더욱 객체지향에 어울리는 코드를 작성할 수 있어요.

# Enum 특징

예제를 보며 살펴본 Enum의 특징을 정리해보려고 해요.

## Enum 상수는 reference 타입

앞서 말한 것처럼 Java의 Enum 상수들은 일반적인 상수가 아닌 `reference` 타입이에요. 이는 각 Enum 상수가 고유한 `인스턴스`이므로, 각각의 상수가 서로 다른 인스턴스처럼 작동할 수 있음을 의미해요.

## 싱글톤 패턴 적용

```java
public enum Season {
    SPRING, SUMMER, FALL, WINTER
}

public class Main {
    public static void main(String[] args) {
        Season season1 = Season.SPRING;
        Season season2 = Season.SPRING;

        System.out.println(season1 == season2); // 결과는 true, 같은 인스턴스를 참조해요.
    }
}
```

Enum은 그 자체로 `싱글톤 패턴`이 적용되어 있어요. 즉, Enum의 각 상수는 애플리케이션 내에서 단 하나의 인스턴스만 생성돼요. Enum은 자바의 ClassLoader에 의해 클래스 로드 시점에 초기화되므로, 상수별 인스턴스는 정적이고 불변성을 가지게 돼요.

특정 Enum 상수인 `Season.SPRING`을 여러 번 호출하더라도 동일한 인스턴스를 반환해요.

### 싱글톤 어떻게 보장하는데?

![](/images/posts/java-enum-guide/47eaeed6-65ab-4640-bd54-4c3bdfc8de70_image.webp)

[공식 문서](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.9)에서 만약 Enum 클래스를 명시적으로 인스턴스화하려고 하면 컴파일 오류가 발생한다고 설명하고 있어요.

> Java에서 Enum은 상속이 제한되어 있어 익명 클래스의 슈퍼클래스로 사용할 수 없어요. 또한, Enum은 항상 final로 정의되어 새로운 하위 클래스를 만들 수 없어요. 이 때문에 Enum은 인스턴스 생성 시 \"freely extensible\"한 클래스나 인터페이스로 간주되지 않으며, 이를 슈퍼클래스로 사용할 수 없다는 `컴파일 제한`이 존재해요. - [출처](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.9.1)

![](/images/posts/java-enum-guide/99b45707-0803-4084-8121-aeb051464161_image.webp)

- Enum의 clone 메서드는 **파이널(final)**로 설정되어 있어, enum 상수를 절대 복제할 수 없어요.
- 리플렉션을 사용한 enum 클래스의 인스턴스화가 금지되어 있습니다.
- 직렬화(Serialization) 시에도 특별한 처리가 적용되어, 직렬화와 역직렬화 과정에서 enum 상수의 복제본이 결코 생성되지 않습니다.

즉, 인스턴스화를 시도하면 컴파일 오류를 발생시키며, 위와 같은 방법들을 함께 사용하여 하나의 인스턴스만 존재할 수 있도록 보장한다고 해요.

## 분리된 네임 스페이스

Enum을 사용할 때, 각 상수는 서로 독립적인 네임 스페이스를 가져요. Enum 내부의 상수들이 서로 독립적이며 충돌이 일어나지 않는다는 이야기에요.

```java
public enum Direction {
    NORTH, SOUTH, EAST, WEST
}

public enum Status {
    NORTH, SOUTH, RUNNING, STOPPED
}
```

서로 다른 Enum인 `Direction`과 `Status`에서 각각 NORTH와 SOUTH라는 상수를 정의하였지만, 서로 다른 Enum이므로 충돌이 일어나지 않아요. 이를 통해 코드의 모듈화를 높이고 충돌 가능성을 줄일 수 있어요.

## 상속된 메서드들

Enum은 자바의 `java.lang.Enum` 클래스를 상속받아 여러 메서드를 상속받아요.

### name()

Enum 상수의 이름을 정확히 반환하는 메서드에요. name() 메서드는 상수 이름을 코드에 작성된 그대로 반환하므로, 상수 이름이 변경되지 않는 한 일관된 결과를 제공해요.

일반적으로는 `toString()` 메서드를 사용하는 것이 권장되지만, name() 메서드는 상수 이름을 가져와야 하는 경우 사용할 수 있어요. toString() 메서드는 각 상수의 사용자 친화적인 이름을 반환할 수 있도록 재정의할 수 있지만, name() 메서드는 오버라이드할 수 없고 항상 상수의 정확한 이름을 반환해요.

```java
public enum Color {
    RED, GREEN, BLUE;

    @Override
    public String toString() {
        return "Color: " + name().toLowerCase();
    }
}

public class Main {
    public static void main(String[] args) {
        Color color = Color.RED;
        
        System.out.println("name(): " + color.name());         // "RED"
        System.out.println("toString(): " + color.toString()); // "Color: red"
    }
}
```

### values()

Enum에 정의된 모든 상수를 배열로 반환하는 메서드에요.

```java
public enum Day {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}

public class Main {
    public static void main(String[] args) {
        for (Day day : Day.values()) {
            System.out.println(day);
        }
    }
}
```

### valueOf(String name)

문자열로 Enum 상수를 찾을 때 사용하는 메서드에요. 일치하는 상수를 반환하고, 일치하는 상수가 없으면 `IllegalArgumentException`을 발생시켜요.

```java
public class Main {
    public static void main(String[] args) {
        Day day = Day.valueOf("MONDAY");
        System.out.println(day); // MONDAY
    }
}
```

Enum의 name() 반환값과 같은 문자열을 넣어야 상수를 가질 수 있어요.

### ordinal()

각 상수의 **순서(0부터 시작)**를 반환하는 메서드에요. Enum 상수 선언 순서에 따라 인덱스 값을 가지며, 이 값은 고정적이에요.

```java
public enum Command {
    GO, EXIT, RUN, COPY
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Command.GO.ordinal());   // 0
        System.out.println(Command.RUN.ordinal());  // 2
    }
}
```

사용이 단순하기 때문에 어디선가 조건으로 사용할 수 있을 것 같지만, 제 생각에는 명확히 Enum을 조건으로 사용하는 것이 좋을 것 같아요. 예를 들어, `EXIT`와 `RUN` 상수 사이에 `WRITE`라는 명령어가 새롭게 추가된다면, 순서에 의존하던 부분에서 변경이 필요할 수 있기 때문이에요.

따라서 순서에 의존하는 코드보다는 Enum 상수 자체에 의존하는 코드로 작성하는 편이 유지보수하기에 좋을 것 같아요.

# 마무리

공식 문서를 참고하면서 직접 Enum을 사용해 본다면, Java 공식 문서에서 말하는 강력한 기능을 더욱 잘 다루게 될 것 같아요. 단순히 장단점을 비교하는 데 그치지 않고, Enum이 제공하는 기능들을 이해하고 적용해 보면서 더 나은 코드를 작성하는 데에 도움이 되셨으면 좋을 것 같아요.

학습 후 Enum을 효과적으로 적용한 블로그를 찾아보시면 더 깊이 이해하고 체화할 수 있을 것 같아요.

감사합니다.

## 필요에 따라 학습하면 좋을 것 같은...

- 열거형 클래스는 모두 직렬화 가능하며 직렬화 메커니즘에 의해 특별한 처리를 받습니다. 열거형 상수에 사용되는 직렬화된 표현은 사용자 정의할 수 없어요. [공식 문서](https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/serial-arch.html#serialization-of-enum-constants)
- Enum을 지원하기 위한 [EnumSet](https://docs.oracle.com/en/java/javase/15/docs/api/java.base/java/util/EnumSet.html)과 [EnumMap](https://docs.oracle.com/en/java/javase/15/docs/api/java.base/java/util/EnumMap.html)이 있어요.
- Enum의 인스턴스 생성은 `thread-safe`할까?
- Enum에는 무제한으로 상수를 생성할 수 있을까? (feat. 메모리)

## 참고

- [Enum Classes Spec - Oracle Docs](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html#jls-8.9)
- [Enum - Oracle Docs](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Enum.html)
- [Java 5 Enums Guide - Oracle Docs](https://docs.oracle.com/javase/1.5.0/docs/guide/language/enums.html)
- [How to make the most of Java enums - Michael Kölling](https://blogs.oracle.com/javamagazine/post/how-to-make-the-most-of-java-enums)
