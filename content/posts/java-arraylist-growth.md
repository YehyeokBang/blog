---
title: "[Java] ArrayList 어떻게 늘어나?"
date: "2024-08-21"
summary: "ArrayList의 구성과 동작 원리를 알아보고, 내부적으로 배열의 크기를 어떻게 동적으로 늘리는지 살펴봅니다."
tags: ["Java", "Data Structure", "ArrayList", "Backend"]
---

프로그래밍을 할 때 데이터를 효율적으로 관리하고 처리하는 것은 매우 중요해요. 여러 프로그래밍 언어에는 다양한 타입의 데이터를 담아두는 자료구조가 존재하며, 그중에서도 배열과 리스트는 가장 기본적이고 널리 사용되는 구조에요. 

자바는 다양한 데이터를 잘 다룰 수 있도록 **[컬렉션 프레임워크(Collection Framework)](https://docs.oracle.com/javase/8/docs/technotes/guides/collections/index.html)**를 제공하며, 이 프레임워크의 핵심 요소 중 하나가 바로 **ArrayList**에요.

**ArrayList**는 배열의 구조를 가지면서도 크기가 가변적이라는 특성을 가지고 있어, 다양한 상황에서 매우 유용하게 사용돼요. 그렇다면 **고정된 크기의 배열을 기반으로 한 ArrayList는 어떻게 크기를 동적으로 늘릴까요?** 또한, 그 과정에서 문제되는 상황은 없을까요?

위와 같은 궁금증이 생겨서 **ArrayList**의 구성과 동작 원리를 알아보려고 해요. 

먼저 배열과 리스트의 차이를 알아볼게요.

# 배열

**배열(Array)**은 가장 기본적이면서도 널리 사용되는 자료구조에요. 배열은 `고정된 크기`를 가지며, `동일한 타입의 데이터`를 `연속된 메모리 공간`에 저장하는 구조에요. 이러한 특성 덕분에 배열은 `인덱스`를 통해 빠르게 접근할 수 있다는 장점이 있지만, `크기가 고정되어` 있어 요소를 추가하거나 제거하는 데 제한이 있다는 단점이 있어요.

> ### 인덱스?
**인덱스(Index)**는 배열에서 각 요소의 위치를 나타내는 고유한 번호에요. 배열은 연속된 메모리 공간에 데이터를 저장하므로, 인덱스를 통해 특정 요소에 빠르게 접근할 수 있어요.
>
> 예를 들어, array[0]은 배열 array의 첫 번째 요소를 의미하고, array[1]은 두 번째 요소를 의미해요. 이처럼 인덱스 번호는 0부터 시작하며, 배열의 마지막 요소는 배열의 크기에서 1을 뺀 값의 인덱스를 가져요.
>
> 같이 읽으면 유익한 [인덱스가 0부터 시작하는 이유](https://www.qu3vipon.com/why-numbering-should-start-at-zero)

## 배열 장단점

- 고정된 메모리 공간을 가지기 때문에 저장할 데이터 크기(개수)가 정해져있다면 관리에 용이해요.
- 하지만, 너무 크게 할당하거나(메모리 낭비) 너무 작게 할당하면(공간 부족) 문제가 발생할 수 있어요.
- 연속된 메모리 공간에 할당되기 때문에 인덱스를 통한 접근 속도가 빨라요.
- 특정 상황에서 삭제 및 삽입 작업은 모든 요소를 이동시켜야 하는 불편함이 발생할 수 있어요.

# 리스트

**리스트(List)**는 배열의 고정된 크기와 삽입, 삭제 작업의 비효율성을 극복하기 위해 등장한 자료구조로, `크기가 가변적`이며, `요소의 삽입 및 삭제가 용이`한 특징을 가지고 있어요. 리스트는 다양한 방식으로 구현될 수 있지만, 가장 대표적인 형태는 **연결 리스트(Linked List)**와 **배열 기반 리스트(Array-based List)**에요.

- **연결 리스트(Linked List)** : 각 요소가 `자신의 데이터`와 `다음 요소에 대한 참조(포인터)`를 가지고 있어, 삽입과 삭제가 매우 유연해요. 그러나 인덱스 기반의 접근 속도는 배열보다 느릴 수 있어요. (바로 직전의 요소가 다음 요소로 가는 길을 알고 있기 때문에 순차적으로 찾아야 해요.)

- **배열 기반 리스트(Array-based List)** : `내부적으로 배열을 사용`하지만, `크기가 동적`으로 조절되어 배열의 장점을 살리면서도 유연한 크기 조정을 가능하게 해요. 자바의 **ArrayList**가 여기에 속해요.

## 리스트 장단점

- 필요에 따라 크기가 자동으로 늘어나거나 줄어들기 때문에, 데이터를 추가하거나 제거할 때 공간 크기에 대한 부담이 적어요. 초기 크기를 미리 결정하지 않아도 되므로 유연하게 데이터를 관리할 수 있어요.
- 빈번한 삽입, 삽입 작업에 용이해요. 특히, 연결 리스트의 경우, 인덱스를 재정렬하지 않아도 되며, 링크만 변경하면 돼요.
- 배열에 비해 더 많은 메모리를 사용하게 될 가능성이 높아요. 연결 리스트인 경우 다음 요소의 참조를 추가로 저장해야 한다거나, 배열 기반 리스트인 경우 동적으로 배열 크기를 늘리는 과정에서 메모리를 사용할 수 있어요.
- 연결 리스트의 경우에는 순차적으로 탐색해야 하기 때문에 접근 속도가 느릴 수 있어요.


즉, 크기가 유동적이거나 삽입, 삭제 작업이 빈번한 경우에는 배열보다는 **리스트(List)**와 같이 더 유연한 자료구조를 선택하는 것이 좋을 수 있어요. 이외에도 조회 성능도 함께 비교하여 알맞은 자료구조를 선택할 수 있어요.

# ArrayList

**ArrayList**는 자바의 **컬렉션 프레임워크(Collection Framework)** 중 하나로, 내부적으로 배열을 기반으로 하지만 크기가 가변적이라는 점에서 배열과는 차별화된 기능을 제공해요. **ArrayList**는 `java.util` 패키지에 포함되어 있어요.

```java
import java.util.ArrayList;

...

// 사용 예시
List<String> names = new ArrayList<>();
names.add("홍길동");
```

## 특징

**ArrayList**는 배열의 장점인 `인덱스를 통한 빠른 접근`을 유지하면서도, 요소를 추가하거나 제거할 때 `크기를 동적으로 조정`할 수 있는 유연성을 제공해요. 이는 고정된 크기를 가지는 배열이 가진 한계를 극복하는 중요한 기능이에요.

하지만, 기본적으로 `배열 구조`이기 때문에 중간에 요소를 삽입하거나 삭제할 때, 해당 위치 이후의 모든 요소를 이동시키는 작업 등 삽입 및 삭제가 빈번한 경우에는 성능에 대해 확인해볼 필요가 있어요.

**ArrayList**는 초기에는 작은 크기의 배열로 시작해요. 데이터가 추가되어 배열이 가득 차면, ArrayList는 기존 배열의 크기를 자동으로 늘려서 새로운 배열을 생성하고, 기존의 데이터를 복사해 넣어요. 이로 인해 사용자는 배열의 크기에 대해 걱정하지 않고 데이터를 계속해서 추가할 수 있어요.

## 초기 크기

실제 **ArrayList** 구현 코드를 살펴볼게요.

![](/images/posts/java-arraylist-growth/4dd1732b-c68f-422f-86ea-a00cc524e8d1_image.png)

`elementData`는 **ArrayList**가 데이터를 저장하는 실제 배열이에요. **ArrayList**가 관리하는 모든 요소는 이 배열에 저장돼요.

![](/images/posts/java-arraylist-growth/d04e801d-f87b-4327-b48e-9c583398e05a_image.png)

`new ArrayList<>();` 생성자로 **ArrayList**를 생성할 경우 `elementData`는 `DEFAULTCAPACITY_EMPTY_ELEMENTDATA`라는 빈 배열을 가리켜요. 즉, 실제로는 아직 배열이 할당되지 않은 상태에요.

이후 첫 번째 요소가 추가될 때 비로소 `DEFAULT_CAPACITY (10으로 지정되어 있음)` 크기로 확장돼요. 이 내용은 이후 나올 add(), grow() 메서드에서 관련 내용을 살펴볼 수 있어요.

미리 배열을 위한 자리를 잡아두지 않으며, 필요할 때 확장하여 메모리를 효율적으로 사용할 수 있어요.

조건에 맞는 초기 용량을 생성자 매개변수로 넘겨주면 해당 크기로 초기화된 **ArrayList**를 반환해요.

## 넘치면?

```java
public static void main(String[] args) {
    List<String> list = new ArrayList<>(10);

    for (int i = 0; i < 15; i++) {
        list.add("i = " + i);
    }
    System.out.println("list.size() = " + list.size());
}

// 출력 결과
// list.size() = 15
```

초기 용량을 10으로 지정한 ArrayList에 15개의 요소를 추가해도 요류가 발생하지 않는 것을 볼 수 있어요. 공간이 부족할 때, 내부적으로 배열의 크기를 늘려서 보관한 것을 볼 수 있어요.

## 어떻게 늘렸을까?

**ArrayList**에는 요소를 추가하는 `add()` 메서드와, 내부적으로 배열의 크기를 늘리는 `grow()` 메서드가 있어요.

### add() 메서드

![](/images/posts/java-arraylist-growth/18962929-e97b-4b98-afac-6bceebf7894d_image.png)

- public으로 정의된 `add()` 메서드는 우리가 ArrayList에 새로운 요소를 추가할 때 사용해요.
- private로 정의된 `add()` 메서드는 실제로 요소를 배열에 추가하고, 필요할 경우 배열의 크기를 조정해요.

즉, **ArrayList**에 새로운 요소를 추가할 때 배열이 가득 찬 경우에 `grow()` 메서드를 사용하여 배열의 크기를 조정한 후에 요소를 추가하는 것을 알 수 있어요.

### grow() 메서드

![](/images/posts/java-arraylist-growth/53025079-9a6b-46d0-80fd-273293bc98ae_image.png)

`minCapacity`는 배열이 확장된 후 최소로 가져야 하는 용량이에요.

`grow()` 메서드가 호출되면, 현재 배열의 크기(용량)를 `oldCapacity` 변수에 저장해요. 만약 현재 배열이 이미 초기화되어 있거나 생성된 후 한번도 요소가 추가된 적이 없는 경우에는 새 배열의 크기(`newCapacity`)를 계산하여 현재 배열의 내용을 새로운 배열(`newCapacity` 크기)로 복사한 다음, 새 배열을 `elementData`에 할당 후 반환해요.

만약 배열이 `DEFAULTCAPACITY_EMPTY_ELEMENTDATA`인 경우 새 배열을 `DEFAULT_CAPACITY` 또는 `minCapacity` 중 더 큰 크기로 초기화한 새 배열을 `elementData`에 할당하고 반환해요. 매개변수가 없는 빈 생성자로 생성한 경우 `elementData`는 `DEFAULTCAPACITY_EMPTY_ELEMENTDATA`이고, `size`는 0이기 때문에 결국 더 큰 값은 `DEFAULT_CAPACITY`에요. 즉, 빈 생성자로 초기화 후 첫 번째 요소를 추가하는 경우 기본 값인 10의 크기로 다시 할당돼요.


> `ArraysSupport.newLength()` 메서드는 기본적으로 현재 크기(`oldCapacity`), 최소 성장량(`minCapacity - oldCapacity`), 선호 성장량(`oldCapacity >> 1`), 즉 현재 크기의 절반을 인수로 받아 최적의 새 크기를 계산해요. 한계에 도달하지 않는 경우 대부분 선호 성장량을 반환해요. 
>
> 즉, 대부분의 경우 동적으로 크기를 늘릴 때, 크기가 1.5배 증가한 새로운 베열에 기존의 요소들을 복사하게 돼요.

이러한 내부 구현 덕분에 우리가 **ArrayList**를 사용하면 배열의 구조를 가져가면서 동적 크기 조절의 유연함을 누릴 수 있어요.

## 부작용

모든 상황에서 좋은 물건은 찾기 힘들어요. **ArrayList**는 동적 크기 조정 기능을 통해 크기가 초과될 때마다 배열의 크기를 늘리지만, 결국 추가적인 작업이기 때문에 문제가 발생할 수 있어요.

### 성능 저하

만약 **ArrayList**의 초기 크기가 너무 작게 설정되었거나, 데이터 추가가 예상보다 많이 발생하는 경우, 크기 조정이 빈번하게 발생할 수 있어요. 

불필요하게 많은 작업은 성능에 악영향을 미칠 수 있어요.

```java
public static void main(String[] args) {
    // 기본 생성 vs 초기 크기 값을 크게 주고 생성
    List<String> defaultSize = new ArrayList<>();
    List<String> bigSize = new ArrayList<>(10_000_000);

    // 기본 생성
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 10_000_000; i++){
        defaultSize.add("*");
    }
    long endTime = System.currentTimeMillis();
    System.out.println("defaultSize : " + (endTime - startTime) + "ms");

    // 크게 생성
    startTime = System.currentTimeMillis();
    for (int i = 0; i < 10_000_000; i++){
        bigSize.add("*");
    }
    endTime = System.currentTimeMillis();
    System.out.println("bigSize : " + (endTime - startTime) + "ms");
}
```

**ArrayList**를 default size인 10의 크기로 생성한 것과 1000만의 크기를 주고 생성한 것을 비교했어요.

![](/images/posts/java-arraylist-growth/54b92d50-a749-4f6f-a5b9-fa2a93707cd8_image.png)

10의 크기로 생성된 ArrayList는 계속해서 1.5배의 새로운 배열을 생성하고 복사하는 과정이 반복되기 때문에 크기를 미리 지정한 ArrayList가 더 빠른 것을 볼 수 있어요.

추가로 새로운 배열을 생성하고 복사하는 과정에서 메모리 사용량도 함께 증가하기 때문에 그 부분을 집중적으로 살펴보는 것도 큰 문제를 예방할 수 있을 것 같아요.

즉, **ArrayList**를 사용할 때는 저장할 데이터나 프로그램의 특성을 파악하여 `적절한 초기값`을 지정하는 것이 더 좋은 성능을 낼 수 있어요.

> An application can increase the capacity of an ArrayList instance before adding a large number of elements using the `ensureCapacity` operation. This may reduce the amount of incremental reallocation. - [Oracle Docs](https://docs.oracle.com/javase/8/docs/api/java/util/ArrayList.html)

`ensureCapacity()` 메서드를 사용하여 많은 수의 요소를 추가하기 전에 **ArrayList**의 용량을 늘릴 수 있다고 해요. 이렇게 하면 배열 생성 및 복사 과정이 줄어들 수 있어요.

```java
public static void main(String[] args) {
    List<String> defaultSize = new ArrayList<>();
    
    // 용량 늘리기
    defaultSize.ensureCapacity(10_000_000);

    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 10_000_000; i++){
        defaultSize.add("*");
    }
    long endTime = System.currentTimeMillis();
    System.out.println("defaultSize : " + (endTime - startTime) + "ms");
}
```

실제로 소요 시간이 줄어든 것을 확인할 수 있어요. 

![](/images/posts/java-arraylist-growth/18d7f514-4e3b-4b3f-a4b3-7568c65308f2_image.png)


### 동기화

**ArrayList**는 동기화되지 않은 클래스예요. 즉, 여러 쓰레드가 동시에 **ArrayList**에 접근하거나 수정할 때, 문제가 발생할 수 있어요.

여러 쓰레드가 동시에 접근하여 추가, 수정 등의 작업을 해야 한다면, 외부에서 동기화를 해야 해요.

```java
// 이렇게 하면, 이 리스트에 대한 모든 접근이 안전하게 동기화돼요!
List list = Collections.synchronizedList(new ArrayList<>());
```

추가로 리스트가 반복자를 만든 후에 리스트에 새로운 요소를 추가하는 등 변경되면, 이 반복자는 `ConcurrentModificationException`이라는 예외를 던져요. 반복자가 사용되는 동안 리스트가 예기치 않게 바뀌는 것을 빠르게 감지하고, 문제를 바로 알려줄 수 있기 때문이에요. 아래는 공식문서에서 가져온 글이에요.

> The iterators returned by this class's iterator and listIterator methods are fail-fast: if the list is structurally modified at any time after the iterator is created, in any way except through the iterator's own remove or add methods, the iterator will throw a ConcurrentModificationException. Thus, in the face of concurrent modification, the iterator fails quickly and cleanly, rather than risking arbitrary, non-deterministic behavior at an undetermined time in the future.
>
> Note that the fail-fast behavior of an iterator cannot be guaranteed as it is, generally speaking, impossible to make any hard guarantees in the presence of unsynchronized concurrent modification. Fail-fast iterators throw ConcurrentModificationException on a best-effort basis. Therefore, it would be wrong to write a program that depended on this exception for its correctness: the fail-fast behavior of iterators should be used only to detect bugs. - [Oracle Docs](https://docs.oracle.com/javase/8/docs/api/java/util/ArrayList.html)

요약하자면, **ArrayList**는 동기화되지 않아서 여러 쓰레드가 동시에 접근하면 문제가 생길 수 있고, 반복자를 사용할 때 구조가 바뀌면 `ConcurrentModificationException` 예외를 던져서 이를 알려주지만, **이 예외에만 의존해서 코드를 작성하지는 말라**고 해요.

위 매커니즘이 항상 완벽하게 작동한다고 보장할 수는 없어요. 동기화되지 않은 상태에서 리스트가 동시에 수정되면, 100% 정확하게 문제를 감지할 수 없기 때문에 해당 예외에 의존하지 말라고 하는 것 같아요.

```java
public static void main(String[] args) {
    // ArrayList 준비
    List<String> arrayList = new ArrayList<>();
    arrayList.add("A");
    arrayList.add("B");
    arrayList.add("C");

    // ArrayList 반복하며 조회
    new Thread(() -> {
        for (String s : arrayList) {
            System.out.println("s = " + s);
        }
    }).start();
    
    // 다른 쓰레드가 ArrayList 추가 (구조 변경)
    new Thread(() -> {
        arrayList.add("D");
    }).start();
}
```

위 코드를 실행하면 실제로 `ConcurrentModificationException` 예외가 발생하는 것을 볼 수 있어요. **ArrayList**를 반복하는 과정에서 **ArrayList**의 구조가 변경되어 발생한 것이에요.

![](/images/posts/java-arraylist-growth/3649e93a-67f6-4bed-a8a8-0b2a7cb948ff_image.png)


# 마무리

배열 기반의 **ArrayList**는 `크기가 가변적`이라는 점에서 유연한 데이터 구조를 제공하지만, 동적 크기 조정 과정에서 메모리 낭비와 같은 성능 부작용이 발생할 수 있어요. 따라서, **ArrayList**를 사용할 때 데이터의 특성에 맞는 초기 크기를 설정하거나, 크기 조정이 빈번하게 발생하지 않도록 관리하는 것이 중요해요.

이처럼 내부 동작 원리를 이해하면, 발생할 수 있는 문제를 예방하거나, 어디서 성능 저하가 발생하는지 등을 빠르게 파악할 수 있을 것 같아요.

읽어주셔서 감사합니다.

## 참고

- [Oracle Docs - ArrayList](https://docs.oracle.com/javase/8/docs/api/java/util/ArrayList.html)
- [🧱 자바 ArrayList 구조 & 사용법 정리 - Inpa Dev 👨💻:티스토리](https://inpa.tistory.com/entry/JAVA-%E2%98%95-ArrayList-%EA%B5%AC%EC%A1%B0-%EC%82%AC%EC%9A%A9%EB%B2%95)
- [ArrayList는 내부적으로 어떻게 사이즈를 확장할까? - GHM :티스토리](https://chunsubyeong.tistory.com/82)
- [자바 기술 면접 대비하기 1편 - Fitz :FLab](https://f-lab.kr/blog/java-backend-interview-1)
