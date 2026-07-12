---
title: "[Java] Record 사용하시나요?"
date: "2024-10-19"
description: "Java 14에서 도입되어 Java 16에 정식 추가된 record(레코드)의 개념과 탄생 배경, 장황한 Boilerplate 코드 문제 해결, record의 특징 및 컴팩트 생성자(Compact Constructor) 사용법, 그리고 사용 시 주의해야 할 상속 불가 및 JPA 엔티티 적용 등의 한계를 정리합니다."
tags: ["Java", "Record", "Backend", "Boilerplate"]
---

![](/images/posts/java-record-guide/e60d22fc-affd-43ef-82ca-61f020494b81_image.png)

`IntelliJ IDEA`에서 Java 클래스를 작성하다 보면, 특정 조건에 해당할 때 클래스를 **레코드(record)**로 변경하라는 제안을 받을 때가 있어요. 이 제안을 수락하면 기존의 클래스가 간단한 record로 변경되며, 코드가 더 깔끔해지는 것을 볼 수 있어요.

특히 데이터를 의미 있게 전달하는 목적으로 작성된 클래스일수록, 이 제안을 많이 받아요. 저는 IntelliJ의 제안을 대부분 수락하는 편이긴 하지만, record에 대해 아는 정보가 없었기에 어떤 효과가 있을지 예상하기 어려워서 제안을 무시하는 경우가 많았어요.

이번 글에서는 미루고 있던 Record에 대해서 알아보려고 해요.

## Record 개요

Java 14에서 [프리뷰](https://openjdk.org/jeps/359)로 처음 소개된 **레코드(Record)**는, 데이터를 저장하고 이를 쉽게 접근할 수 있는 메서드를 자동으로 생성해주는 특별한 클래스에요.

[Java 16](https://openjdk.org/jeps/395)부터는 정식 기능으로 추가되었어요.

레코드를 검색해보면, `불변(immutable)`, `데이터 클래스`, `간결함` 같은 키워드를 쉽게 찾을 수 있어요. 레코드는 데이터를 간단하고 효율적으로 다룰 수 있게 설계된 특징을 가지고 있다고 해요.

> ### 불변 객체의 장점
>
> 불변 객체는 상태 변경이 불가능하여 멀티스레드 환경에서의 안전성을 높이고, 데이터 무결성을 유지하며, 코드의 가독성과 유지보수성을 향상시키는 장점이 있어요.

## 탄생 배경

> 레코드가 왜 필요하게 되었는지를 이해하면, 더 깊이 있고 목적에 맞게 활용할 수 있을 거예요.

레코드의 탄생 배경을 알고 싶다면 [Data Classes and Sealed Types for Java 문서](https://openjdk.org/projects/amber/design-notes/records-and-sealed-classes)를 보면 좋을 것 같아요. 여기서 레코드 같은 데이터 클래스가 왜 필요하게 되었는지를 알 수 있어요.

아래와 같이 배경을 요약할 수 있어요.

### Java의 장황함, Boilerplate 코드

![](/images/posts/java-record-guide/5aabb0b9-f4a1-46c0-80c4-2c94355cc1ff_image.png)

Java는 "너무 장황하다"는 비판을 자주 받아요. 특히 단순히 데이터를 전달하기 위한 클래스에서 이러한 문제가 더 부각돼요. 단순한 데이터 클래스를 작성할 때도 생성자(constructor), 접근자(getter), equals(), hashCode(), toString() 같은 메서드를 반복해서 작성해야 해요.

```java
final class Point {
    public final int x;
    public final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    // 생성자, 접근자, equals(), hashCode() 등 반복적인 코드 작성 필요
}
```

이런 반복 작업은 실수를 유발하기 쉬운 부분이기도 해서, 개발자들이 종종 생략하거나 실수하는 경우가 많아요. 그 결과 예기치 않은 동작이 발생하거나 디버깅이 복잡해질 수 있어요.

> ### Boilerplate 코드?
>
> 주로 반복되는, 그 자체로는 비즈니스 로직이나 핵심 기능을 나타내지 않고, 프레임워크, 라이브러리, 언어 등의 특정 규약을 따르기 위한 코드를 말해요. 예를 들어, 생성자, getter, setter, toString() 등이 있어요. 이러한 코드는 귀찮고, 예외가 발생하기 쉬운 곳이에요.


### 데이터 클래스의 필요성, 나만 없어..

![](/images/posts/java-record-guide/242be329-af4b-453e-917c-396a06537d1d_image.png)


다른 객체지향 언어들(예: Scala의 case class, C#의 record class 등)은 데이터 지향 클래스를 더 간결하게 표현할 수 있는 문법을 도입했어요. 이러한 클래스들은 클래스 헤더에 상태를 간단하게 정의할 수 있고, 이에 따라 생성자나 접근자, equals(), hashCode() 같은 메서드들이 자동으로 제공돼요.

```java
record Point(int x, int y) { }
// 생성자, 접근자, equals(), hashCode() 등 자동으로 생성
```

이 코드만 봐도 객체가 두 개의 정수 필드(x, y)를 가진다는 것을 바로 알 수 있어요. 또한, 필수적인 Object 메서드들이 자동으로 올바르게 구현되니, 장황한 boilerplate 코드를 작성할 필요도 없어요.

> 요약하면, 레코드는 객체의 의도를 더 명확히 드러내고, 불필요한 코드 작성을 줄여 가독성을 높여줘요. 객체 지향 철학에 맞춰 데이터를 간결하게 표현하는 방식을 제공하면서, 개발자가 불변 데이터를 모델링하는 데 집중할 수 있게 돕는 것이에요.


## Record 구조

레코드는 `record` 키워드로 선언하며, 클래스와 유사한 구조를 가져요.

```java
{ClassModifier} record TypeIdentifier [TypeParameters] RecordHeader [ClassImplements] RecordBody
```

- `ClassModifier` : 클래스의 접근 제어자 및 기타 수정자(예: public, private 등)
- `TypeIdentifier` : 레코드의 이름으로, 대문자로 시작하는 것이 관례에요.
- `TypeParameters` : 제네릭 타입 매개변수를 사용할 경우 선언해요.
- `RecordHeader` : 레코드에 포함될 필드들을 선언해요.
- `ClassImplements` : 필요한 경우 구현할 인터페이스를 지정해요.
- `RecordBody` : 레코드의 메서드나 기타 구성 요소를 작성할 수 있어요.

<h3>예시</h3>

```java
public record Point(int x, int y) { }
```

x와 y라는 두 개의 필드를 가진 Point 레코드를 선언했어요. 이 레코드는 `불변(immutable)`이며, 생성자, 접근자, equals(), hashCode(), toString() 같은 메서드들이 자동으로 생성돼요. (일반 클래스처럼 `RecordBody`에서 재정의할 수 있어요.)

![](/images/posts/java-record-guide/fd4591e6-dd29-476a-8b70-3d526276e9f4_image.png)

자동으로 생성되는 메서드들의 세부 구현 정보는 [공식 문서](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Record.html)에서 확인할 수 있어요.

### 자동 생성 눈으로 확인하기

직접 작성하지 않아도 자동으로 생성되는 메서드를 사용할 수 있지만, 이 메서드들은 코드에서 직접 보이지 않아요. 이를 확인하기 위해 javap 명령어를 사용할 수 있어요.

아래의 명령어를 실행하면 컴파일된 `.class 파일`에서 자동 생성된 메서드들의 시그니처를 확인할 수 있어요.
```bash
$ javap -p build/classes/java/main/recordtest/Point.class
```

![](/images/posts/java-record-guide/1aba21d8-de46-486c-b04f-e3696a88f569_image.png)

어떤 메서드가 자동으로 생성되었는지 눈으로 확인할 수 있어요.

## 레코드의 특징

- 레코드 클래스는 암묵적으로 `final`로 선언되며, 상속이 불가능해요. 이는 레코드가 값 집합을 간단하게 표현하는 데 초점을 맞추고 있음을 의미해요. 따라서`abstract`, `sealed`, `non-sealed`와 같은 수식어는 사용할 수 없어요.

- 다른 클래스를 상속 받을 수 없지만, 인터페이스 구현은 가능해요.

- `RecordHeader`에 선언된 필드는 final로 정의되어 있으며, 레코드의 생성자에서만 초기화할 수 있어요. 즉, setter를 통해 필드 값을 변경할 수 없어요.

## 레코드 생성자

레코드 클래스는 `기본 생성자`를 제공하지 않아요. 대신, 모든 필드(컴포넌트 필드)를 초기화하는 **정식 생성자(Canonical Constructor)**를 암묵적 또는 명시적으로 선언해야 해요. 정식 생성자는 `Normal Canonical Constructors`와 `Compact Canonical Constructors`로 나뉘어요.

### 기본 생성자?

```java
// 기본 생성자 예시
class Person {
    // 필드가 있지만 생성자를 정의하지 않음
    String name;
    int age;

    // 컴파일러가 자동으로 아래와 같은 기본 생성자를 추가함
    // Person() { }
}

// Person 객체 생성
Person p = new Person();  // 기본 생성자 호출 가능
```
자바에서 클래스를 선언할 때 생성자를 정의하지 않으면 컴파일러가 자동으로 기본 생성자를 추가해요. 하지만 레코드 클래스는 기본 생성자를 제공하지 않아요.

### Normal Canonical Constructors (정식 생성자)

```java
record Point(int x, int y) { }

record Point(int x, int y) {
    // 정식 생성자
    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
}

Point p = new Point(10, 20);
```

레코드 클래스는 `정식 생성자`를 제공해요. 정식 생성자는 레코드의 모든 필드를 초기화하는 생성자로, 레코드 객체를 생성할 때 사용돼요. 

레코드는 데이터 클래스로서 불변성을 유지하기 위해 모든 필드를 초기화하는 생성자를 제공한다고 볼 수 있어요. (나중에 추가 및 변경이 불가능해요.)

### Compact Canonical Constructors (컴팩트 생성자)

```java
record Point(int x, int y) {
    // 컴팩트 생성자, 필드를 나열하지 않음
    Point {
        validate(x, y);
    }

    static void validate(int x, int y) {
        if (x < 0 || y < 0) {
            throw new IllegalArgumentException("x와 y는 0보다 작을 수 없습니다.");
        }
    }
}

Point p = new Point(-1, 1); // 검증 메서드로 예외가 발생함
```

`컴팩트 생성자`는 더 간결한 형태의 생성자 선언 방식이에요. 필드를 별도로 나열하지 않고, 레코드의 필드가 암묵적으로 선언돼요. 이 생성자는 주로 매개변수를 검증하거나 값을 정규화하는 로직만을 포함하고, 나머지 초기화는 컴파일러에 의해 자동으로 처리돼요.

- 두 생성자 방식 중 하나만 사용할 수 있으며, 둘 다 명시적으로 정의할 경우 컴파일 오류가 발생해요.
- 생성자의 접근 제어자는 레코드 클래스의 접근 제어자와 일치해야 하며, 생성자를 명시하지 않으면 컴파일러가 자동으로 정식 생성자를 추가해요.

> 생성자 방식만 보더라도, 레코드가 데이터 클래스로서 불변성을 유지하고자 하는 의도를 느낄 수 있어요.

## 레코드의 필드 사용

레코드의 필드 값은 한 번 설정되면 변경할 수 없어요.

레코드의 필드는 자동으로 생성된 `접근자 메서드`를 통해 접근할 수 있으며, 이 메서드는 전통적인 getter 메서드 명명 규칙인 getX() 대신에 `필드명을 메서드 이름으로 사용`해요. 

모든 레코드 필드는 `final`로 선언되어 있어, setter를 통해 값을 변경할 수 없어요. 즉, 레코드는 선언과 동시에 해당 필드들의 불변성을 보장해요.

```java
record Point(int x, int y) { }

public class Main {
    public static void main(String[] args) {
        // 레코드 인스턴스 생성
        Point p = new Point(10, 20);

        // 자동 생성된 접근자 메서드를 통해 필드에 접근
        System.out.println(p.x());  // 10
        System.out.println(p.y());  // 20

        // 필드가 final이므로 값을 변경할 수 없음 (setter가 없음)
        // p.x = 30;  // 컴파일 에러 발생
    }
}
```

예시에서 볼 수 있듯이, 레코드를 사용하면 필드의 불변성을 유지하면서도 간편하게 데이터에 접근할 수 있어요.

## 레코드 사용 시 주의사항

### 1. 상속 불가

레코드는 `final`로 선언되어 있어 상속이 불가능해요. 즉, 레코드를 기반으로 하는 서브 클래스를 만들 수 없어요. 상속이 필요한 경우, 일반 클래스를 사용하는 것이 바람직해요.

### 2. 비즈니스 로직 포함에 대한 경고

레코드는 기본적으로 `불변성`을 유지해야 하는 데이터 객체에요. 이로 인해 비즈니스 로직을 레코드 내부에 포함시키는 것은 권장되지 않는다고 해요. 비즈니스 로직을 레코드에 포함시키면 객체의 불변성이 깨질 수 있으며, 예상치 못한 부작용을 초래할 수 있어요.

예를 들어, Spring Data JPA를 사용할 때 Entity를 record로 선언하는 것이 좋을까?를 고민해보면 좋을 것 같아요.

### 3. 자동 생성된 메서드의 사용

레코드는 equals(), hashCode() 등 필요한 메서드를 자동으로 생성해요. 이러한 메서드들이 필드의 값을 기반으로 생성되기 때문에 필드가 적절히 정의되어 있어야 하며, 각 메서드들이 어떻게 구현되어 있는지 이해하고 있는 것이 중요해요. 만약 제대로 이해하지 않고 사용하면, 예상치 못한 결과가 발생할 수 있어요.

예를 들어, HashSet에 레코드를 추가할 때 hashCode()와 equals()의 동작을 잘못 이해하면 중복된 객체가 삽입되거나, 특정 값만을 기준으로 비교하여 중복으로 처리되는 등의 원치 않는 동작이 발생할 수 있어요. 따라서 레코드를 사용할 때는 이러한 자동 생성 메서드의 동작 원리를 충분히 이해하고 활용하는 것이 중요해요.

### 4. Java 버전 호환

레코드는 Java 14에서 프리뷰 기능으로 도입되었고, Java 16부터는 정식 기능으로 포함되었어요. 이전 버전의 Java를 사용하고 있다면 레코드 기능을 사용할 수 없으므로, 레코드를 도입하기 전 해당 애플리케이션이 어떤 Java 버전을 사용하는지 확인해야 해요.

## 마무리

레코드는 주의사항을 고려하여 의도에 맞게 사용한다면 많은 장점을 누릴 수 있어요. 특히 가독성과 불변성을 제공하여, 코드를 더욱 명확하고 안정적으로 만들어요.

제가 느낀 가장 큰 장점 중 하나는 다른 개발자에게 `불변 데이터를 담기 위한 객체`라는 의도를 명확하게 전달할 수 있다는 점이에요.

레코드를 사용하기 전에는 사용 여부를 신중하게 검토하고, 관련된 주의사항을 충분히 이해하는 것이 중요하며, 이러한 과정을 거친다면 레코드를 효과적으로 사용할 수 있을 것 같아요.

추가적으로 [Java Record vs Lombok 포스팅](https://www.baeldung.com/java-record-vs-lombok)도 읽어보면 좋을 것 같아요!

긴 글 읽어주셔서 감사합니다!

## 참고 자료

- [Data Classes and Sealed Types for Java - Brian Goetz](https://openjdk.org/projects/amber/design-notes/records-and-sealed-classes)
- [Record Java 14 Preview](https://openjdk.org/jeps/359)
- [Record Java 16](https://openjdk.org/jeps/395)
- [Record - Oracle Docs](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Record.html)
- [Java Record Keyword - Baeldung](https://www.baeldung.com/java-record-keyword)
- [Java Record vs Lombok - Baeldung](https://www.baeldung.com/java-record-vs-lombok)
