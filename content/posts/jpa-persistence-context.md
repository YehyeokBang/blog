---
title: "[JPA] 영속성 컨텍스트"
date: "2023-07-12T00:00:00Z"
summary: "JPA의 영속성 컨텍스트, 엔티티 매니저, 엔티티의 생명 주기 및 영속성 컨텍스트의 이점들에 대해 정리한 글입니다."
tags: ["JPA", "Spring Data JPA", "Backend", "Database"]
---
## Spring Data JPA
저는 지금까지 Spring Boot로 프로젝트를 진행하면서 JPA를 많이 사용했어요. 정확히는 Spring에서 제공하는 **Spring Data JPA**를 사용하여 많은 프로젝트를 사용했어요. Spring Data JPA는 데이터 접근 계층을 개발할 때 구현 클래스 없이 인터페이스만 작성해도 개발할 수 있도록 도와주며, 그 중에서도 인터페이스에 메소드를 선언하면 이름에 맞게 적절한 쿼리를 생성해주는 쿼리 메소드 기능을 자주 사용했어요.

```java
// 주어진 나이보다 어린 사용자를 조회, repository 인터페이스에 작성해요.
List<User> findAllByAgeLessThan(int age);


// 만약 23세 미만의 사용자를 조회하고 결과를 List<User> 형태로 반환해요.
List<User> youngUsers = userRepository.findAllByAgeLessThan(25);
```

위 과정에서 쿼리 생성 기능을 통해 다음과 같은 쿼리를 생성해요.
```sql
// 개발자가 직접 쿼리를 작성하지 않아도 되므로, 개발 생산성을 높일 수 있어요.
SELECT * 
FROM user 
WHERE age < 23
```
이외에도 많은 기능으로 데이터 액세스 계층을 쉽고 효율적으로 구현하고 수정사항이 생겼을 때 비교적 간단하게 수정할 수 있는 부분이 좋아서 거의 모든 프로젝트에 Spring Data JPA를 사용했어요.

</br>

## 문제
JPA의 문제가 아니라 제가 JPA를 사용하는 방법이 문제로 인식되었어요. JPA를 사용하면 기본적인 CRUD 처리를 지원하기 때문에 깊은 공부 없이도 간단한 기능을 완성할 수 있었어요. 학교에서 Spring boot와 MyBatis를 사용하는 강의를 수강했을 때보다 더 적은 코드로 기능을 완성했기 때문에 매력을 느꼈어요. 

하지만 프로젝트를 진행하면서 많아지는 테이블과 그 안에 복잡한 관계를 풀어내는 과정에서 어려움을 느꼈어요. 

이 어려움을 극복하고, 앞으로 살아가며 더욱 복잡한 문제를 마주하더라도 잘 풀어낼 수 있도록 지금 사용하던 JPA를 배우고 그것을 기록해보려고 해요.

</br>

## 궁금했던 점
어디부터 시작할까 고민하다가 JPA를 처음 사용했을 때 발생했던 문제가 떠올랐어요.
```java
// 이미 존재하는 사용자의 이메일을 변경하는 코드에요.
public void updateUserEmail(String newEmail) {
    // id를 기준으로 사용자를 조회하고 해당 사용자의 이메일을 수정하기 위해 작성했던 코드였어요.
    User findUser = userRepository.findById(userId);
    findUser.updateEmail(newEmail);
}
```
'사용자를 찾아 변경하면 되겠다.' 라는 생각으로 작성하고, 위 코드를 실행해봤지만 데이터베이스 상에서 해당 사용자의 이메일은 변경되지 않았어요.
```java
public void updateUserEmail(String newEmail) {
    User findUser = userRepository.findById(userId);
    findUser.updateEmail(newEmail);

    // 해당 코드를 추가했어요.
    userRepository.save(findUser);
}
```
변경된 엔티티를 저장하기 위해서는 save() 메서드를 호출하여 변경 내용을 데이터베이스에 동기화하고, 이를 통해 JPA의 영속성 컨텍스트와 데이터베이스 간의 일관성을 유지할 수 있다는 내용을 알아내고 위와 같이 작성하여 문제를 해결했어요.

사실 영속성 컨텍스트가 무엇인지 정확히 이해하진 못하고, ~~문제는 해결되었으니 다음에 공부하자고 미뤘어요.~~ 미룬 것을 해결하기 위해 영속성 컨텍스트에 대해 공부한 내용을 작성하려고 해요.

</br>

## 영속성 컨텍스트
영속성 컨텍스트(Persistence Context)를 검색하면 **'엔티티를 영구 저장하는 환경'** 이라는 말을 쉽게 찾아볼 수 있고, 추가로 엔티티 매니저로 엔티티를 저장하거나 조회하면 엔티티 매니저는 영속성 컨텍스트에 엔티티를 보관하고 관리한다는 설명을 볼 수 있었어요. Spring Data JPA만 사용했던 저는 엔티티 매니저를 잘 알지 못해서 추가적인 검색이 필요했어요.

</br>

## 엔티티 매니저
JPA를 사용할 때는 테이블을 매핑한 엔티티를 먼저 생성하게 되는데, 이 엔티티를 관리하는 친구가 엔티티 매니저에요. 엔티티 매니저는 엔티티 매니저 팩토리를 통해 생성돼요. 

앤티티 매니저 팩토리는 말 그대로 엔티티 매니저를 만드는 공장인데, 공장을 만들 때 부담이 크기 때문에 애플리케이션에서 하나의 공장을 만들어 공유하도록 설계되어 있어요.

```java
// 엔티티 매니저 팩토리를 생성하는 코드에요.
EntityMangerFactory emf = Persistence.createEntityManagerFactory("testEmf");

// 엔티티 매니저 팩토리에서 엔티티 매니저 생성하는 코드에요.
EntityManager em = emf.createEntityManager();
```
엔티티 매니저 팩토리는 여러 스레드가 동시에 접근해도 안전하기에 다른 스레드 간에 공유해도 되지만, 
엔티티 매니저는 여러 스레드가 동시에 접근하면 동시성 문제가 발생하므로 스레드 간 공유를 금지한다고 해요.

이렇게 만든 엔티티 매니저는 엔티티를 저장하거나 조회하면 엔티티 매니저가 엔티티를 영속성 컨텍스트에 보관하고 관리하는 역할을 수행해요.
```java
// 엔티티 매니저로 사용자 엔티티를 영속성 컨텍스트에 저장하는 코드에요.
em.persist(user);
```
하나의 엔티티 매니저가 하나의 영속성 컨텍스트를 생성 및 접근할 수도 있고, 
여러 엔티티 매니저가 하나의 영속성 컨텍스트를 공유할 수도 있어요.

### 왜 몰랐을까?
제가 엔티티 매니저를 잘 몰랐던 이유는 직접 사용해본 적이 없기 때문이에요. 
Spring Data JPA Repository는 인터페이스만 정의하고 구현체는 Spring이 자동으로 생성해요.
```java
// 평소 Spring Data JPA Repository를 사용하는 방법이에요.
public interface UserRepo extends JpaRepository<User, Long> {

}
```
JpaRepository 인터페이스의 구현체인 SimpleJpaRepository 클래스를 보면,
![](/images/posts/jpa-persistence-context/8a8afe57_image.webp)

엔티티매니저가 내부에 존재하고 이를 사용하는 것을 볼 수 있어요.  
![](/images/posts/jpa-persistence-context/2e519081_image.webp)  

즉, Spring Data JPA 내부에 관련 코드가 작성되어 있기 때문에 사용할 때는 필요한 경우가 아니라면 엔티티 매니저를 직접 사용할 일이 없었던 것이에요.

</br>

## 엔티티의 생명 주기
엔티티는 4가지 상태가 존재해요.  
- 비영속 (new, transient)
- 영속 (managed)
- 준영속 (detached)
- 삭제 (removed)  

생명 주기를 나타낸 그림이에요.
![엔티티의 생명 주기, 김영한님 자료](/images/posts/jpa-persistence-context/2cda8228_image.webp)

### 비영속 상태
영속성 컨텍스트나 데이터베이스와는 전혀 관련이 없으며, 그냥 객체 상태에요.
``` java
User user = new User();
user.setId("user1");
user.setUsername("사용자1");
```
![비영속](/images/posts/jpa-persistence-context/390f94f6_image.webp)

### 영속 상태
엔티티 매니저를 통해서 엔티티를 영속성 컨텍스트에 저장하여 영속성 컨텍스트가 관리하도록 해요.
``` java
em.persist(user);
```
![](/images/posts/jpa-persistence-context/ddf0e960_image.webp)

### 준영속 상태
엔티티 매니저가 관리하던 영속 상태의 엔티티가 더이상 엔티티 매니저의 의해 관리되지 않는 상태에요.
``` java
// 사용자 엔티티를 영속성 컨텍스트에서 분리하는 코드에요.
em.detach(user);

// 영속성 컨텍스트를 닫거나 초기화해도 영속 상태의 엔티티는 준영속 상태가 되요.
em.close();
em.clear();
```

### 삭제 상태
엔티티를 영속성 컨텍스트와 데이터베이스에서 삭제해요.
``` java
em.remove(user);
```

</br>

## 영속성 컨텍스트의 특징

### 식별자 값
영속성 컨텍스트는 엔티티를 식별자 값(테이블의 기본 키를 @Id로 매핑한 값)으로 구분해요.
**즉, 영속 상태는 식별자 값이 반드시 존재해야 해요.** 만약 없다면 예외가 발생해요.

### flush
영속성 컨텍스트에 새로 저장한 엔티티는 보통 트랜잭션을 커밋하는 순간 데이터베이스에 반영해요. 이 작업을 flush라고 해요.

</br>

## 영속성 컨텍스트의 이점
영속성 컨텍스트를 사용하면 어떤 이점이 있는지 엔티티 CURD 하면서 알아보려고 해요.

### 1차 캐시
영속성 컨텍스트는 내부에 캐시를 가지고 있으며, 영속 상태의 엔티티는 모두 이곳에 저장돼요.
영속성 컨텍스트 내부에 @Id로 매핑한 식별자가 키, 엔티티 인스턴스가 값인 <@Id, Entity> 형태의 Map이 있다고 생각하면 돼요.
```java
// 엔티티 객체 생성하고
User user1 = new User();
user1.setId("user1");
user1.setUsername("사용자1");

// 엔티티를 영속 상태로 만들었어요.
em.persist(user1);
```

위 코드를 실행하면 아래처럼 1차 캐시에 회원 엔티티를 저장해요. 아직 데이터베이스에 저장되지 않은 상태에요. 영속성 컨텍스트 내부의 표가 1차 캐시에요.

![](/images/posts/jpa-persistence-context/88a9051b_image.webp)

### 엔티티 조회

```java
// 엔티티 매니저의 find() 메소드 정의에요.
// 첫 번째 파라미터는 엔티티 클래스의 타입이고, 두 번째는 조회할 엔티티의 식별자 값이에요.
public <T> find(Class<T> entityClass, Object primaryKey);
```
em.find()를 호출하면 먼저 1차 캐시에서 식별자 값으로 엔티티를 찾게되는데, 존재하는 경우 데이터베이스를 조회하지 않고 메모리에 있는 1차 캐시에서 엔티티를 반환해요.

만약 엔티티가 1차 캐시에 존재하지 않으면 엔티티 매니저는 데이터베이스를 조회해서 엔티티를 생성하고 1차 캐시에 저장한 후 영속 상태의 엔티티 반환해요.

아래의 그림은 1차 캐시에 없고, 식별자 값이 "user1"인 사용자 엔티티를 조회하는 과정이에요.

![](/images/posts/jpa-persistence-context/8ab441cd_image.webp)

![](/images/posts/jpa-persistence-context/a0cb1d40_image.webp)

다시 한 번 "user1" 엔티티를 조회한다면 데이터베이스 접근 없이 1차 캐시에서 바로 불러오게 돼요. 따라서 성능에서 이점을 누릴 수 있어요.

### 영속 엔티티의 동일성 보장

```java
User user1 = em.find(User.class, "user1");
User user2 = em.find(User.class, "user1");

if (user1 == user2) {
    System.out.println("인스턴스가 같음");
} else {
    System.out.println("인스턴스가 다름");
}
```
위 코드의 결과는 "인스턴스가 같음"을 출력하게 돼요. em.find()를 반복하여 호출해도 영속성 컨텍스트는 1차 캐시에 있는 같은 엔티티 인스턴스를 반환하기 때문이에요.

**즉, 영속성 컨텍스트는 캐시 사용으로 인한 성능 이점과 엔티티의 동일성을 보장해요.**

### 엔티티 등록
```java
// 엔티티 매니저는 데이터 변경 시 트랜잭션을 시작해야 해요.

// [트랜잭션 시작 코드]

em.persist(user1);
em.persist(user2); 
// 영속성 컨텍스트에만 저장되고 실제 데이터베이스에는 저장되지 않았어요.

// [트랜잭션 커밋 코드] -> 커밋하는 순간 데이터베이스에 INSERT SQL을 보내요.
```
엔티티 매니저는 트랜잭션을 커밋하기 직전까지 데이터베이스에 엔티티를 저장하지 않고 내부 쿼리 저장소에 INSERT SQL을 모아두다가 트랜잭션을 커밋할 때 모아둔 쿼리를 데이터베이스에 보내요.

이를** 트랜잭션을 지원하는 쓰기 지연(transactional write-behind)**이라고 해요.

![](/images/posts/jpa-persistence-context/789c9d4a_image.webp)

![](/images/posts/jpa-persistence-context/b0dc794a_image.webp)

user1과 user2를 영속화하면 1차 캐시에 엔티티를 저장하면서 동시에 사용자 엔티티 정보로 INSERT 쿼리를 생성하여 SQL 저장소에 보관해요.

마지막으로 트랜잭션을 커밋하면 엔티티 매니저는 영속성 컨텍스트의 변경 내용을 flush 해요. flush는 영속성 컨텍스트의 변경 내용을 데이터베이스에 동기화하는 작업이에요.

**즉, 모아둔 쿼리를 데이터베이스에 보내는 과정을 수행해요.**

이렇게 영속성 컨텍스트의 변경 내용을 데이터베이스에 flush 하고 실제 데이터베이스 트랜잭션을 커밋하게 돼요.

![등록](/images/posts/jpa-persistence-context/b0d68260_image.webp)

### 엔티티 수정
JPA는 수정을 위한 메소드가 아닌 변경 감지(Dirty Checking) 기능을 제공해요.
변경 감지 기능은 엔티티의 변경 사항을 데이터베이스에 자동으로 반영하는 기능이에요.

![수정](/images/posts/jpa-persistence-context/fde6a331_image.webp)


JPA는 엔티티를 영속화 할 때 최초 상태를 복사해서 저장해두는데 이것을 스냅샷이라고 해요. 
flush 시점에 스냅샷과 엔티티를 비교해서 변경된 엔티티와 관련된 수정 쿼리를 생성하여 쓰기 지연 SQL 저장소에 보관해요. 
이후 해당 쿼리를 데이터베이스에 보낸 후 트랜잭션을 커밋하면서 데이테베이스에 반영해요.

**변경 감지는 영속성 컨텍스트가 관리하는 영속화된 엔티티에만 적용돼요.**

참고로 JPA는 변경된 엔티티가 존재할 때 수정된 필드만 반영하는 것이 아니라 엔티티의 모든 필드를 수정에 반영해요.

```sql
// 수정 쿼리가 아래와 같이 예상되지만,
UPDATE USER
SET
    변경된 필드=?
WHERE
    id=?

// 실제로는 3개의 필드 중에서 1개만 변경되었어도, 모든 필드를 업데이트해요.
UPDATE USER
SET
    모든 필드들=?,
    ...
WHERE
    id=?
```
이렇게 모든 필드를 사용하게 되면 데이터 전송량을 증가하지만 아래와 같은 장점이 있어요.

- 모든 필드를 수정에 반영하기 때문에 수정 쿼리가 항상 같아요.
- 데이터베이스에 동일한 쿼리를 보내면 데이터베이스는 이전에 한 번 파싱된 쿼리를 재사용할 수 있어요.

### 엔티티 삭제
엔티티를 삭제하기 위해서는 삭제하려는 엔티티를 조회해야 해요.

```java
// 삭제하려는 엔티티를 조회하는 코드에요.
User user1 = em.find(User.class, "user1");

// 엔티티를 삭제하는 코드에요.
em.remove(user1);
```

삭제하는 과정도 위에서 알아본 엔티티 등록과 비슷하게 삭제 쿼리를 쓰기 지연 SQL 저장소에 등록하고, 트랜잭션을 커밋하며 flush가 호출될 때 실제 데이터베이스에 삭제 쿼리를 전송해요.


**하지만, em.remove(user1)를 호출한 순간 영속성 컨텍스트에서 user1은 제거돼요.**

</br>

## 준영속
지금까지 엔티티의 비영속, 영속, 삭제 상태 변화를 알아봤어요. 이번에는 영속 상태에서 준영속 상태가 되는 과정을 알아보려고 해요.

앞서 설명했듯이 준영속 상태는 영속화된 엔티티가 더이상 엔티티 매니저의 관리를 받지 않는 상태를 말해요. 따라서 준영속 상태의 엔티티는 영속성 컨텍스트에서 제공하는 기능을 사용할 수 없어요.

### 준영속 상태의 특징
- 비영속 상태와 유사해요.
- 지연 로딩을 할 수 없어요.
- 식별자 값을 가지고 있어요.

영속성 컨텍스트의 관리를 받지 못하기 때문에 영속성 컨텍스트의 어떠한 기능도 사용할 수 없어요.

준영속 상태의 엔티티는 영속 상태의 엔티티와 마찬가지로 식별자 값을 가지고 있어요. 영속성 컨텍스트에 저장된 엔티티는 모두 식별자 값을 가지고 있는데, 영속성 컨텍스트의 관리를 받지 않게 되어도 가지고 있다는 말이에요.

### 병합
병합은 준영속 상태의 엔티티를 다시 영속 상태로 변경하기 위한 방법이에요.
```java
// merge() 메소드 정의에요.
// 준영속 상태의 엔티티를 받아서 해당 정보로 새로운 영속 상태의 엔티티를 반환해요.
public <T> T merge(T entity);
```
파라미터로 전달한 엔티티가 영속 상태로 변경되는 것이 아니라 새로운 영속 상태의 엔티티가 반환돼요.

```java
User user1 = new User();
user1.setId("user1");
user1.setUsername("사용자1");

// 비영속 상태의 엔티티인 user1을 영속화해요.
em.persist(user1);

// 영속 상태의 엔티티인 user1을 영속성 컨텍스트에서 분리해요. 즉, 준영속 상태
em.detach(user1);

// 다시 영속 상태로 만들기 위해 병합을 이용해요.
User mergeUser1 = em.merge(user1);
```

원본 엔티티 객체인 user1과 병합된 엔티티 객체인 mergeUser1은 서로 다른 인스턴스에요. 
따라서 병합된 엔티티 객체를 다시 관리하려면 반드시 반환된 병합 객체를 사용해야 해요.

또한 병합은 비영속 엔티티도 영속 상태로 만들 수 있어요.

```java
User user = new User();
// 비영속 상태의 엔티티를 병합해요.
User newUser = em.merge(user);

// [트랜잭션 커밋 코드]
```
병합은 파라미터로 넘어온 엔티티의 식별자 값으로 영속성 컨텍스트를 조회하고 찾지 못하면 데이터베이스에서 조회해요. 1차 캐시를 통한 조회 기능과 동일하게 작동해요.

하지만 데이터베이스에서도 찾지 못한 경우 새로운 엔티티를 생성해서 병합해요.

즉, 병합은 비영속, 준영속 상관없이 식별자 값으로 조회할 수 있으면 가져와서 병합하고,
조회할 수 없으면 새로 생성해서 병합해요.

### 궁금했던 점
처음 언급했던 문제를 다시 살펴보려고 해요.
```java
// 이미 존재하는 사용자의 이메일을 변경하는 코드에요.
public void updateUserEmail(String newEmail) {
    User findUser = userRepository.findById(userId);
    findUser.updateEmail(newEmail);

    userRepository.save(findUser);
}
```
1. findById() 메소드로 파라미터로 전달한 userId 값과 일치하는 엔티티를 영속성 컨텍스트에서 찾아요.
만약 영속성 컨텍스트에 엔티티가 존재하지 않는다면, 데이터베이스에서 해당 엔티티를 조회하고 영속성 컨텍스트에 저장해요.
2. updateEmail() 메소드를 호출하여 반환된 엔티티 객체의 이메일 값을 변경해요.
이때, 엔티티 객체의 상태가 변경되면 영속성 컨텍스트에도 변경 내용이 반영돼요.
3. 변경된 내용을 데이터베이스에 반영하기 위해 Repository의 save() 메소드를 호출해요.
![](/images/posts/jpa-persistence-context/6ad14548_image.webp) save() 메소드 내에서 flush() 메소드를 명시적으로 호출하는 것이 아니라
@Transactional 어노테이션에 의해 트랜잭션을 커밋할 때 자동으로 flush() 메소드가 호출되어 변경 내용을 데이터베이스에 반영해요.

flush() 메소드가 호출되면, 변경 감지가 동작해서 수정된 엔티티의 수정 쿼리를 만들어 쓰기 지연 SQL 저장소에 등록되고, 이 쿼리들을 데이터베이스에 전송하여 변경 내용을 데이터베이스에 동기화해요.

### save()를 꼭 써야하나요?

그렇다면 save()를 사용하는 이유가 트랜잭션 커밋으로 인한 flush 호출 때문인 것인가?
그렇다면 메소드 전체가 트랜잭션 범위 내에서 실행되면 해결되지 않을까? 
라는 생각이 들어서 실험을 해봤어요.

```java
@Transactional
public void updateUserEmail(String newEmail) {
    User findUser = userRepository.findById(userId);
    findUser.updateEmail(newEmail);
}
```
1. @Transactional 어노테이션에 의해 트랜잭션이 시작돼요.
2. 영속 상태의 엔티티를 조회하고 이메일을 변경해요.
3. 트랜잭션이 커밋되기 전에 영속성 컨텍스트의 변경 사항이 자동으로 데이터베이스에 반영될 수 있도록 JPA가 flush() 메소드를 자동으로 호출해요.
4. 트랜잭션을 커밋해요.

@Transactional을 사용하여 save() 메소드 없이도 데이터베이스에 수정 사항이 잘 반영되는 것을 확인했어요. 

코드가 하는 일이 더욱 명확해진 것 같아요.

### 마무리
Spring Data JPA는 내부 구조와 동작을 잘 알지 못해도 쉽게 데이터 엑세스 계층을 구현할 수 있도록 만들어져 있어서 처음 배울 때는 좋지만, 배우지 않고 계속 사용하다 보면 이유 없는 코드가 많아지게 될 것 같아요.

JpaRepository 인터페이스를 공부하려는데 인터페이스를 몰라서 인터페이스를 찾아보는 것처럼
문제에 생겼을 때 문제를 해결하기 위한 문제가 최대한 발생하지 않도록 하기 위해
항상 이유가 있는 코드를 작성하려고 노력하려고 해요.

추가로 구조나 동작 원리를 알아볼 땐 공식 문서를 찾아보는 습관을 기르려고 해요.

### 참고 자료
[자바 ORM 표준 JPA 프로그래밍, 김영한](https://product.kyobobook.co.kr/detail/S000000935744)
[Spring Data JPA](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
[@Transactional](https://imiyoungman.tistory.com/9)
```
