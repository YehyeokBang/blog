---
title: "Spring Data JPA 원하는 컬럼만 가져오기"
date: "2023-12-02"
summary: "Spring Data JPA에서 성능 최적화를 위해 필요한 컬럼만 선택적으로 조회하는 Projections 기능(Interface, Class 기반, 동적 Projections)을 알아봅니다."
tags: ["Java", "Spring Boot", "JPA", "Backend", "Performance"]
---

## Spring Data JPA
저는 스프링 부트로 프로젝트를 진행할 때 `Spring Data JPA` 주로 사용했어요. SQL 쿼리에 대해 신경 쓰지 않고 비즈니스 로직에 집중할 수 있다는 점이 좋았어요. `Spring Data JPA` 는 내부적으로 SQL 쿼리를 자동으로 생성하고 실행해줘요.

```java
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public Member updateMemberEmail(Long userId, String newEmail) {
        Member member = memberRepository.findById(userId);
        member.updateEmail(newEmail);
    }

	...
}

```
위 간단한 예제를 이해하기 위해선, 먼저 JPA의 핵심 개념인 영속성 컨텍스트와 더티 체킹에 대해 알아야 해요.

영속성 컨텍스트는 일종의 캐시로 이해하면 되며, 데이터베이스 트랜잭션을 처리하는 동안 일관성을 유지하기 위한 역할을 해요. JPA는 트랜잭션을 처리하는 동안 해당 트랜잭션에서 사용되는 엔티티 인스턴스들을 이 영속성 컨텍스트에 보관해요. 위 코드처럼 이메일을 수정하면 영속성 컨텍스트에 보관된 엔티티의 상태와 데이터베이스의 상태의 차이가 발생하고 이를 동기화하는 기능이 더티 체킹이에요. 즉, 엔티티의 상태가 변경되었다면 (예: 멤버의 이메일이 변경되었다면) 이 변경을 감지하고 자동으로 Update 쿼리를 생성하여 실행해줘요.

이러한 JPA의 기능들 덕분에 제가 직접 SQL 쿼리를 작성하거나 실행할 필요 없이 자바 객체를 이용해 데이터베이스와 통신할 수 있게 할 수 있어요.

하지만 이런 장점이 기능이 완성하고 돌아가는 것에 집중하다 보니 양날의 검으로 작용했어요. 이미 기능적으로 완성되었다면, 다시 살펴보기 어려워진거죠. 그래서 저는 평소 궁금했던 부분 중 하나인 **엔티티 중에서도 필요한 컬럼만 가볍게 가져오면 더 좋지 않을까?** 부분에 대해 알아보려고 해요. (물론 직접 쿼리를 작성했다면 궁금하지 않았을 수도 있지만요...)

## 궁금증
항상 저는 엔티티 클래스에 존재하는 모든 필드를 가져와서 사용했어요. 기능 구현이 우선이었기에 그대로 계속해서 사용했던 것 같아요. 직접 SQL 쿼리를 작성할 때는 필요한 컬럼만 조회할 수 있는데, JPA에도 분명 있을 것이라고 생각하고 찾아봤어요.

## Projections
> Spring Data query methods usually return one or multiple instances of the aggregate root managed by the repository. However, it might sometimes be desirable to create projections based on certain attributes of those types. Spring Data allows modeling dedicated return types, to more selectively retrieve partial views of the managed aggregates. - [Spring Data JPA - Projections](https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html)

요약하자면 `Spring Data` 의 쿼리 메서드는 보통 저장소에서 관리하는 집합체의 루트 인스턴스 하나 또는 여러 개를 반환해요.
```sql
// 아래와 같이 모든 컬럼을 가져오는 작업과 유사하다고 생각해요!
SELECT *
FROM members;
```
하지만 때때로 우리는 모든 필드(컬럼)를 가져오는 것이 아니라, 특정 필드만 필요할 때가 있어요. 이런 경우에 `Spring Data` 의 프로젝션을 사용하면 원하는 필드만 선택적으로 가져올 수 있으며, 이는 불필요한 데이터 전송을 줄이고 성능을 향상시키는 데 도움이 된다는 내용이에요. 제가 찾던 기능이에요.

## Entity
```java
@Entity
@Getter
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String address;
}
```

## Repository
```java
public interface MemberRepository extends JpaRepository<Member, Long> {
}

```

만약 일반적인 방법으로 멤버 엔티티를 조회하면, 모든 필드(컬림)를 볼 수 있어요. 이 방법은 만약 이메일만 필요하더라도 모든 필드를 가져오게 돼요.

## Interface 기반 Projections
읽고 싶은 필드에 대한 접근자 메서드를 노출하는 인터페이스를 선언하는 방법이에요.

```java
public interface NameAndEmail {

    String getName();
    String getEmail();
}
```
여기서 중요한 점은 이 인터페이스에 정의된 필드들이 집합체의 루트에 있는 필드들과 정확히 일치해야 해요. 이렇게 하면 다음과 같이 쿼리 메서드를 추가할 수 있어요.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<NameAndEmail> findByName(String name);
}

```
```
// 쿼리 실행 결과
Hibernate: select m1_0.name,m1_0.email from member m1_0 where m1_0.name=?
```
레포지토리에서 쿼리 메서드를 작성할 때 앞서 정의한 인터페이스를 반환 유형으로 사용해요. 이런 방식으로 인터페이스 기반 프로젝션을 사용하면, 필요한 데이터만 명확하게 지정하여 가져올 수 있어요. 불필요한 데이터 전송을 줄이고 성능 개선에 도움이 된다고 해요. 실제 발생한 쿼리를 보면 필요한 필드만 조회하는 것을 볼 수 있어요.

### Closed Projections
위에서 사용한 방법이 닫힌 프로젝션이에요. `Spring Data` 는 프로젝션 프록시를 지원하는 데 필요한 모든 속성을 알고 있으므로 쿼리 실행을 최적화할 수 있다고 해요.

### Opend Projections
프로젝션 인터페이스의 접근자 메서드는 @Value 어노테이션을 사용하여 새로운 값을 계산하는 데도 사용할 수 있어요.
```java
public interface NameAndEmail {

	@Value("#{target.name + ' : ' + target.Email}")
    String getNameAndEmail();
}
```
```
// 쿼리 실행 결과
Hibernate: select m1_0.id,m1_0.address,m1_0.email,m1_0.name from member m1_0 where m1_0.name=?
```
하지만 위 방법은 모든 쿼리를 조회한 후에 조합하는 방식이기 때문에 제가 원하는 방식이랑은 거리가 멀다고 생각해요. 그래서 아래와 같은 방법을 사용한다고 해요.


```java
interface NameAndEmail {

  String getName();
  String getEmail();

  default String getNameAndEmail() {
    return getName().concat(" : ").concat(getEmail());
  }
}
```
위 코드처럼 닫힌 프로젝션과 열린 프로젝션을 적절히 활용하면, 필요한 데이터만 효과적으로 가져와 성능을 개선하는 데 도움이 된다고 해요.

## Class 기반 Projections (DTOs)
프로젝션을 정의하는 또 다른 방법은 검색할 필드에 대한 속성을 보유하는 값 유형 DTO(데이터 전송 개체)를 사용하는 것이에요. 이러한 DTO 유형은 프록싱이 발생하지 않고 중첩된 프로젝션이 적용될 수 없다는 점을 제외하면 프로젝션 인터페이스가 사용되는 것과 정확히 동일한 방식으로 사용할 수 있어요.

인터페이스 기반 프로젝션에서 사용한 코드를 사용하면 `Spring Data` 는 getName()과 getEmail() 메서드를 가진 프록시 객체를 생성해요. 이 프록시 객체의 메서드를 호출하면, 실제로는 원래 객체의 name과 email 속성을 가져와 반환해요. 이렇게 프록싱을 사용하면, 사용자는 필요한 속성만을 정의한 인터페이스를 통해 원래 객체를 사용하는 것처럼 특정 속성들만을 효율적으로 접근할 수 있어요. 이는 불필요한 데이터 전송을 줄이고 성능을 개선하는 데 도움이 된다고 해요.

그러나 클래스 기반 프로젝션에서는 이러한 프록싱이 발생하지 않습니다. 대신 사용자가 정의한 DTO 클래스의 인스턴스를 직접 생성하여 사용하게 됩니다. 이 경우 중첩된 프로젝션이 적용될 수 없다는 단점이 있지만, 대신 프록시를 생성하고 관리하는 overhead가 없으므로 성능상의 이점이 있을 수 있습니다.

```java
public record NamesOnly(String name) {
}
```
위 DTO를 레포지토리에서 쿼리 메서드를 지정할 때 반환 형태로 사용하면 돼요.

## 동적 Projections
지금까지는 프로젝션 타입을 반환 타입이나 컬렉션의 요소 타입으로 직접 지정해 사용했어요. 그러나 호출 시점에 사용할 타입을 선택하고 싶다면 아래와 같이 동적 프로젝션을 사용하여 쿼리 메서드를 작성하면 돼요.

```java
public interface MemberRepository extends JpaRepository<Member, Long> {
	<T> List<T> findAllBy(Class<T> type);
}
```

```java
// 멤버 엔티티 원본을 그대로 반환해요.
List<Member> members = memberRepository.findAllBy(Member.class);

// NamesOnly 인터페이스에 정의된 필드만 가져와요.
List<NamesOnly> names = memberRepository.findAllBy(NamesOnly.class);
```
## 마무리
`Spring Data JPA` 는 다양한 프로젝션 기능을 제공하여 개발자들이 상황에 따라 적절한 프로젝션 타입을 선택하여 사용할 수 있게 해줘요. 그러나 프로젝션을 사용하면서 주의해야 할 점은, 프로젝션 대상이 되는 속성들이 실제 엔티티의 속성과 정확히 일치해야 한다는 점이에요. 그렇지 않으면 예기치 않은 결과가 발생할 수 있어요.

프로젝션을 사용하면 불필요한 데이터 전송을 줄이고, 원하는 데이터만을 효율적으로 가져올 수 있어요. 이는 쿼리의 실행 시간을 줄이고, 메모리 사용량을 최소화하는 등 성능 향상에 도움이 될 것 같아요. 그러나 프로젝션은 단순히 데이터의 선택적인 조회를 위한 도구일 뿐이라고 해요. 비즈니스 로직이나 복잡한 데이터 처리는 프로젝션의 범위를 벗어난 것이므로, 이러한 처리들은 서비스 레이어나 도메인 모델에서 처리되어야 한다고 해요.

예를 들어, 특정 사용자의 주문 내역을 조회하고, 주문 금액의 합계를 계산하는 로직이 있다고 가정했을 때, 사용자의 주문 내역을 조회하는 것은 프로젝션을 통해 최적화할 수 있어요. 하지만 주문 금액의 합계를 계산하는 로직은 비즈니스 로직으로, 이는 서비스 레이어나 도메인 모델에서 처리되어야 해요.

결국, 프로젝션은 '어떤 데이터를 가져올 것인가'에 집중하며, '어떻게 데이터를 처리하고 표현할 것인가'는 애플리케이션 레벨에서 결정되어야 한다는 것이 핵심인 것 같아요.
