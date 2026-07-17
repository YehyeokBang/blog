---
title: "[Spring] OSIV 설정하시나요?"
date: "2024-11-23"
description: "Spring Boot에서 기본으로 활성화되는 OSIV(Open Session In View)의 동작 방식과 특징, 그리고 활성화/비활성화 시의 트레이드오프와 주의할 점을 정리합니다."
tags: ["Spring Boot", "JPA", "OSIV", "Backend"]
thumbnail: /images/posts/spring-jpa-osiv/thumbnail.webp
---

![](/images/posts/spring-jpa-osiv/50d7c42f-161e-499c-9bd9-3398e5877c79_image.webp)

Spring Boot 애플리케이션을 실행시키면 볼 수 있는 흔한 화면이에요. 대부분은 `INFO` 레벨의 로그이지만, `WARN` 레벨의 로그가 출력된 것을 볼 수 있어요.

사실 개발을 할 때 이상한 예외 TRACE가 출력되지 않고 아래와 같이 톰캣과 애플리케이션이 실행되었다는 것만 보고 기능을 테스트해 볼 때가 많았어요.

![](/images/posts/spring-jpa-osiv/92ef9391-e3d0-4eb1-913d-c0b4c21b207c_image.webp)

이처럼 별 생각 없이 넘겼던 부분을 인식하고 학습해 보려고 해요.

> 혹시 시작할 때 예외 TRACE 로그가 아닌 다른 로그에 관심을 가져본 적이 있으신가요?

- Spring Boot, Spring Data JPA를 사용해요.

# 문제 상황

> #### WARN 레벨 로그의 정체
> JpaBaseConfiguration$JpaWebConfiguration : spring.jpa.open-in-view is enabled by default. Therefore, database queries may be performed during view rendering. Explicitly configure spring.jpa.open-in-view to disable this warning
> #### 번역
> `spring.jpa.open-in-view`는 기본적으로 활성화됩니다. 따라서 뷰 렌더링 중에 데이터베이스 쿼리가 수행될 수 있습니다. 이 경고를 비활성화하려면 `spring.jpa.open-in-view`를 명시적으로 구성하십시오.

로그를 바탕으로 검색하면 아주 오래된 [StackOverFlow에 게시된 질문](https://stackoverflow.com/questions/30549489/what-is-this-spring-jpa-open-in-view-true-property-in-spring-boot)을 볼 수 있어요.

## 해결 방법

```properties
# application.properties
spring.jpa.open-in-view=false
```

```yml
# application.yml
spring:
  jpa.open-in-view: false
```

로그에서 나온 해결 방법대로 위와 같은 설정을 추가하면 `WARN` 로그는 출력되지 않는 것을 볼 수 있어요. (OSIV를 활성화하려면 true로 작성하면 돼요.)

## 간단한데...?
이렇게 간단하게 해결할 수 있는데, 왜 `WARN` 로그가 출력될까요?

Spring Boot는 개발 초기 단계에서 편리함을 위해 OSIV를 활성화하지만, 이 설정을 그대로 사용하는 것이 `항상` 좋은 선택은 아닐 수 있어요. 이 패턴을 통해 데이터베이스 연결이 더 오래 유지되면서 예기치 않은 데이터베이스 쿼리가 발생하거나, 많은 양의 연결 리소스가 묶여서 병목을 일으킬 수 있어요.

OSIV가 안티 패턴인지 아닌지에 대한 논의도 치열해요. [Spring Boot Issue #7107](https://github.com/spring-projects/spring-boot/issues/7107)에서도 확인할 수 있어요.

잘 모른 상태로 끄고 켜면 언젠가 큰 문제가 발생할 수도 있겠다는 느낌이 들어요. 따라서 이번에는 `OSIV(or OEIV)`에 대해서 알아보려고 해요.

> JPA에서는 `OEIV(Open EntityManager In View)`, 하이버네이트에선 `OSIV(Open Session In View)`라고 표현해요.
> 
관례상 둘 다 OSIV로 부르지만, Spring Boot GitHub Repository의 Issue나 PR을 확인하면 `O(S|E)IV`로 부르는 사람도 있어요.

# OSIV(Open Session In View)

**OSIV(Open Session In View)**는 HTTP 요청이 처리되는 동안 영속성 컨텍스트를 유지하는 기능이에요. 

Spring에서는 이를 지원하기 위해 [OpenEntityManagerInViewInterceptor](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/support/OpenEntityManagerInViewInterceptor.html)를 제공해요.

> #### OpenEntityManagerInViewInterceptor? OpenSessionInViewInterceptor?
> 대부분의 Spring JPA 애플리케이션에서는 JPA 표준을 따르는 OpenEntityManagerInViewInterceptor를 사용해요. Hibernate를 직접 사용하는 특정 상황에서만 [OpenSessionInViewInterceptor](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/hibernate5/support/OpenSessionInViewInterceptor.html)가 고려될 수 있다고 해요.

이 기능을 통해 서비스 계층의 트랜잭션이 종료된 이후에도 영속성 컨텍스트가 유지되므로, 컨트롤러 및 뷰 계층에서 지연 로딩(Lazy Loading) 데이터를 조회할 수 있게 돼요.

동작 방식부터 이해해 보려고 해요.

## OSIV의 동작 방식

OSIV가 활성화된 환경에서 Spring 애플리케이션이 요청을 처리하는 과정을 살펴볼게요.

> 아래에 예시 코드와 그림도 준비되어 있으니 함께 읽는다면 더욱 이해하기 쉬울 거에요.

### 1. Hibernate 세션 생성

클라이언트 요청이 들어오면 `OpenEntityManagerInViewInterceptor`가 동작하여 `Hibernate 세션(영속성 컨텍스트)`을 생성해요.
  
이 단계에서는 아직 트랜잭션이 시작되지 않은 상태에요.

### 2. 서비스 계층에서 트랜잭션 처리

서비스 계층의 `@Transactional` 어노테이션이 작성된 메서드가 호출되면 트랜잭션이 시작되고, 영속성 컨텍스트가 트랜잭션과 연결돼요.

트랜잭션 범위 내에서 엔티티를 조회하거나 변경할 수 있으며, 트랜잭션 종료 시 변경 사항은 데이터베이스에 반영돼요. (Dirty Checking)

### 3. 영속성 컨텍스트 유지

OSIV가 활성화된 경우, 트랜잭션 종료 후에도 영속성 컨텍스트는 요청 종료 시점까지 유지돼요.

즉, 컨트롤러 및 뷰 계층에서도 엔티티의 `지연 로딩` 속성(필드)을 조회할 수 있어요.

### 4. 세션 종료

요청이 완전히 처리되면, `OpenEntityManagerInViewInterceptor`가 영속성 컨텍스트를 종료해요.

**이 과정에서 `em.flush()`는 호출되지 않고, 영속성 컨텍스트만 종료돼요.**

## 코드 예시로 살펴보기

더욱 이해하기 쉽게 코드로 살펴볼게요.

다음은 사용자와 사용자가 작성한 게시글(아티클)이 양방향 일대다 관계를 가지는 엔티티 설계에요.

```java
@Entity
@Getter
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private int age;

    @OneToMany(mappedBy = "author", fetch = FetchType.LAZY)
    private List<Article> articles = new ArrayList<>();

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
}

@Entity
@Getter
@Table(name = "articles")
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String contents;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    public Article(String title, String contents, User author) {
        this.title = title;
        this.contents = contents;
        this.author = author;
    }
}
```

여기서, `User`와 `Article`의 관계는 `지연 로딩`으로 설정되어 있어요. 따라서, User 엔티티에서 articles를 접근할 때 데이터베이스 쿼리가 발생해요.

**이때, 영속성 컨텍스트가 열려 있어야 가능해요.**

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User findOne(String name) {
        return userRepository.findByUsername(name)
                .orElseThrow(() -> new IllegalArgumentException("해당 이름의 사용자가 없습니다."));

    }
}
```

`@Transactional` 어노테이션은 서비스 계층에서 트랜잭션을 생성하며, 그 경계 안에서 `영속성 컨텍스트`가 유지돼요.

직관적으로는 트랜잭션이 종료될 때 영속성 컨텐스트도 종료될 것으로 예상하지만, 앞서 말한 것처럼 OSIV가 활성화된 경우에는 HTTP 요청-응답이 종료될 때까지 영속성 컨텍스트가 유지돼요.

```java
@RestController
@RequiredArgsConstructor
@RequestMapping("users")
public class UserController {

    private final UserService userService;

    @GetMapping("{username}")
    public ResponseEntity<UserResponse> findUser(@PathVariable String username) {
        User user = userService.findByUsername(username);
        System.out.println("Service 빠져나옴"); // 편의를 위해 콘솔 출력을 사용했어요.
        return ResponseEntity.ok(toUserDetailResponse(user));
    }

    // UserResponse는 Record로 작성한 DTO에요.
    private UserResponse toUserDetailResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getAge(),
                user.getArticles().size() // 지연 로딩이 발생해요.
        );
    }
}
```

아직 영속성 컨텍스트가 존재하기 때문에 `user.getArticles().size()`를 호출하면서 지연 로딩이 발생해요. (추가 쿼리가 발생하여 정상적으로 데이터를 가져올 수 있어요.)

![](/images/posts/spring-jpa-osiv/c013b42a-6384-4d2c-97a4-2a397c9c53b5_image.webp)

만약 OSIV가 비활성화된 상태라면, 트랜잭션이 종료된 후 영속성 컨텍스트가 닫히기 때문에, (예시에서는 컨트롤러 계층에서) 지연 로딩 시도 시 `LazyInitializationException`이 발생해요.

### LazyInitializationException?

예시 프로젝트에서 `jpa.open-in-view` 옵션을 false로 바꾼 후 똑같이 시도하면 아래와 같이 예외가 발생해요.

![](/images/posts/spring-jpa-osiv/6c9513f3-8cff-418a-a15a-c1500661c1b8_image.webp)

> #### 예외 로그
> org.hibernate.LazyInitializationException : failed to lazily initialize a collection of role: dev.bang.osivtest.entity.User.articles: could not initialize proxy - no Session
>
> #### 번역
> 컬렉션을 지연 초기화하지 못했습니다, User.articles 프록시를 초기화할 수 없습니다, 세션이 없습니다.

하이버네이트 공식 문서에서도 이와 같은 상황을 예시로 예외를 설명해요.

> ...예를 들어 세션이 닫힌 후 초기화되지 않은 프록시 또는 컬렉션에 액세스하면 이 예외가 발생합니다. 
- [Hibernate Docs - LazyInitializationException](https://docs.jboss.org/hibernate/orm/6.0/javadocs/org/hibernate/LazyInitializationException.html)

## 뭐가 언제? 열려? 닫혀?

```yml
logging.level:
  org.hibernate.SQL: trace
  org.hibernate.engine.spi: trace
  org.hibernate.event.internal: trace
  org.hibernate.event.spi: trace
  org.hibernate.internal: trace
```

`application.yml`에 로그 옵션을 추가하여 더 자세하게 살펴볼게요. 직접 코드를 작성하여 실행하고 살펴보는 것도 좋은 방법이 될 것 같아요.

(실제 배포되는 애플리케이션에서는 성능과, 로그의 수집 가치를 따져보고 추가해야 해요.)

### OSIV 활성화 로그

![](/images/posts/spring-jpa-osiv/78b27e5c-9d96-430c-8b2b-8fe780aa7cc2_image.webp)

```
2024-11-23T01:09:32.434+09:00 TRACE ... Opening Hibernate Session.  tenant=null
2024-11-23T01:09:32.434+09:00 TRACE ... Opened Session [b7a297d6-1503-4e44-ab57-e58686e58c7b] at timestamp: 1732291772434
```

- HTTP 요청(GET - users/bang)이 시작되어 서비스 계층에서 데이터베이스에 접근하기 위해 Hibernate가 세션(영속성 컨텍스트)을 생성해요.

```
2024-11-23T01:09:32.476+09:00 DEBUG ... org.hibernate.SQL:
    select
        u1_0.id,
        u1_0.age,
        u1_0.name 
    from
        users u1_0 
    where
        u1_0.name=?
```

- 데이터베이스에서 사용자를 조회하기 위한 SQL 쿼리가 실행돼요. (이름으로 조회해요.)

```
2024-11-23T01:09:32.478+09:00 TRACE ... SessionImpl#beforeTransactionCompletion()
2024-11-23T01:09:32.478+09:00 TRACE ... SessionImpl#afterTransactionCompletion(successful=true, delayed=false)
```
트랜잭션이 정상적으로 처리되었으며, 데이터베이스 작업이 커밋되었음을 의미해요. (successful=true)

- `beforeTransactionCompletion`은 트랜잭션이 완료되기 전에 호출돼요.
- `afterTransactionCompletion`은 트랜잭션이 성공적으로 끝난 것을 나타내요.

```
2024-11-23T01:09:32.479+09:00 TRACE ... DefaultInitializeCollectionEventListener : Initializing collection [dev.bang.osivtest.entity.User.articles#1]
2024-11-23T01:09:32.479+09:00 TRACE ... Collection not cached
2024-11-23T01:09:32.479+09:00 DEBUG ... org.hibernate.SQL:
    select
        a1_0.author_id,
        a1_0.id,
        a1_0.price,
        a1_0.name 
    from
        articles a1_0 
    where
        a1_0.author_id=?
2024-11-23T01:09:32.480+09:00 TRACE ... Collection initialized
```

컨트롤러 계층에서 `user.getArticles().size()` 메서드 호출이 발생하여 articles 컬렉션을 초기화했다는 내용이에요. 

- User 엔티티의 articles 컬렉션이 초기화되었어요.  
이 컬렉션은 Lazy Loading으로 설정되어 처음에는 데이터베이스에서 가져오지 않다가, 실제 접근 시점에 SQL 쿼리를 실행하여 초기화했어요.  

  또한, Hibernate는 articles의 데이터를 캐시에서 찾으려고 했으나, 데이터가 캐시되지 않아 select 쿼리를 실행한 것을 볼 수 있어요.

트랜잭션이 종료된 후 컨트롤러 계층에서 지연 로딩이 동작했음을 알 수 있고, 영속성 컨텍스트가 살아있음을 알 수 있어요.

> 트랜잭션이 종료되었기 때문에 DirtyChecking이 일어나지 않아요. 추가로 요청-응답 주기가 종료되어 영속성 컨텍스트가 종료되는 순간에도 flush()를 호출하지 않아요. 
>
> 예시 컨트롤러에서 User 엔티티를 변경하도록 코드를 작성해도 update 쿼리가 발생하지 않는 것을 볼 수 있어요. (물론 예시에서는 readOnly로 조회한 엔티티이지만...)

```
2024-11-23T01:09:32.500+09:00 TRACE ... Closing session [b7a297d6-1503-4e44-ab57-e58686e58c7b]
```

마지막으로 HTTP 요청의 끝에서 세션이 닫혔어요.

### OSIV 비활성화 로그

![](/images/posts/spring-jpa-osiv/46d5cf31-258d-4afd-8b22-a6d9bf4ef777_image.webp)

트랜잭션이 종료되면서 영속성 컨텍스트도 종료되었어요.

그렇다는 것은 컨트롤러 계층에서 (영속성 컨텍스트 없이) 지연 로딩을 시도하는 것이기 때문에 예외가 발생하게 돼요.

## 그림으로 확인하기

![](/images/posts/spring-jpa-osiv/76372ca9-593f-4c42-832b-704897c714b2_image.webp)

영속성 컨텍스트와 지연 로딩, 트랜잭션의 범위를 생각하며 흐름을 따라가다 보면 그림을 이해할 수 있을 거에요.

## OSIV 활성화 (spring.jpa.open-in-view=true)

직접 설정을 추가하지 않는 이상 기본으로 적용되는 구성이에요.

컨트롤러와 뷰 계층에서도 지연 로딩을 통한 추가적인 작업이 가능해지기 때문에 개발 편의성 측면에서는 도움을 받을 수 있어요. 

그러나...

- `예상하지 못한 쿼리 발생` : 예상하지 못한(서비스 계층이 아닌) 곳에서 다수의 쿼리가 발생할 수 있어요. 만약 개발자가 이를 알아차리지 못한 경우(의도하지 않은 경우)라면 또 다른 문제가 발생할 수도 있어요. (개발자가 확인해야 하는 영역이 넓어져요.)
- `유한한 자원 점유` : 영속성 컨텍스트는 **데이터베이스 커넥션**을 유지하고 있어요. 여러 개의 요청이 끝날 때까지 데이터베이스 커넥션을 점유하고 있다는 부분은 큰 장애가 발생할 수 있다는 것을 암시해요.

### 유한한 자원 점유

OSIV 활성화 시 영속성 컨텍스트가 `요청-응답 주기` 동안 열려 있는 상태로 유지돼요. 이로 인해 **영속성 컨텍스트는 데이터베이스 커넥션을 점유**하고 있게 되며, 여러 요청이 동시에 처리되는 동안 리소스 점유 문제가 발생할 수 있어요.

`@Transactional` 어노테이션의 사용도 비슷한 관점으로 바라볼 수 있을 것 같아요.

```java
@Transactional
public ResponseDto order(RequestDto dto) {
    // 사용자 정보 가져오기
    
    // 쿠폰 및 할인 정보 가져오기
    
    // 가게 사장님에게 푸시 알림 보내기...?
    
    // 가격 계산 후 데이터베이스 저장
}
```

예시에서는 하나의 트랜잭션 단위 안에 여러 작업이 실행돼요. 상황에 따라 `여러` 작업이 실행되는 것을 문제로 볼 수도 있겠지만, 저는 `푸시 알림 보내기` 부분이 문제가 될 수 있을 것 같아요.

만약 푸시 알림 서버에 문제가 생긴다면 어떻게 될까요?

Timeout을 지정해 두었다면 (대부분은 기본 구성이 있으니) 그 시간만큼 대기하게 돼요. 즉, 데이터베이스 커넥션이 필요 없는 작업 때문에 하나의 트랜잭션이 아무것도 하지 못한 채 대기하게 돼요.

요청이 하나라면 큰 문제가 없을 수 있지만, 1,000만 명이 축구 경기를 보기 위해 치킨을 주문하던 시기였다면 어떻게 될까요?

반대로 사용자 수가 정해져 있거나 적은 경우에는 큰 문제가 없을 수 있을 것 같아요. (예시: 관리자 페이지 등)

## OSIV 비활성화 (spring.jpa.open-in-view=false)

OSIV를 비활성화하면 트랜잭션을 종료할 때 영속성 컨텍스트를 닫고, 데이터베이스 커넥션도 반환해요. 따라서 커넥션 리소스를 낭비하지 않게 돼요.

그러나...
- `필요한 데이터는 미리` : 필요한 모든 지연 로딩을 트랜잭션 단위 내부에서 처리해야 해요. (트랜잭션 단위 내 코드 복잡성 증가) 만약 예시처럼 컨트롤러에서 지연 로딩을 하려는 순간 `LazyInitializationException`이 발생해요.

### LazyInitializationException 해결 방법은?

트랜잭션이 유지되는 서비스 계층에서 필요한 데이터(사용할 연관 관계)를 모두 조회하면, 상위 계층에서 데이터를 가져오지 않아도 되기 때문에 문제를 방지할 수 있어요.

대부분 사용을 피하는 전략이지만, 패치 전략을 Eager로 사용하거나 `fetch join`, `@EntityGraph`를 활용할 수도 있고, `Projections`을 활용할 수도 있을 것 같아요. 그 부분은 또 구조와 상황을 판단하고 선택하면 될 것 같아요.

### 기타

1. OSIV 활성화, 트랜잭션이 종료된 이후 (아직 영속성 컨텍스트는 열려 있을 때)

```java
// UserController
@GetMapping("{username}")
public ResponseEntity<UserResponse> findUser(@PathVariable String username) {
    User user = userService.findOne(username);
    System.out.println("Service 빠져나옴");
    user.updateName("newName"); // 엔티티 변경 후
    em.flush(); // 강제 flush() 호출
    return ResponseEntity.ok(toUserDetailResponse(user));
}
```

이렇게 하면 이미 트랜잭션은 종료되었기 때문에 예외가 발생해요. 

![](/images/posts/spring-jpa-osiv/e4d9a46f-deb9-4f69-9074-4b79c92f576c_image.webp)

하지만, 다른 비즈니스 메서드를 호출하여 사용할 때 Dirty Checking이 동작하여 update 쿼리가 발생해요.

```java
// UserController
@GetMapping("{username}")
public ResponseEntity<UserResponse> findUser(@PathVariable String username) {
    User user = userService.findOne(username);
    System.out.println("Service 빠져나옴");
    user.updateName("newName");
    userService.biz(username); // @Transactional이 작성된 메서드 호출
    // Dirty Checking이 동작하여 update 쿼리가 발생
    return ResponseEntity.ok(toUserDetailResponse(user));
}
```

![](/images/posts/spring-jpa-osiv/8857d40e-612e-41eb-8bc8-5bb738c3163f_image.webp)

따라서 비즈니스에 의해 엔티티를 트랜잭션이 종료된 후 변경해야 한다면 제일 마지막에 하는 것이 좋을 것 같아요.

2. 로그 옵션

```yml
# application.yml
logging.level:
  org.hibernate.SQL: trace # Hibernate가 실행하는 모든 SQL 쿼리
  org.hibernate.engine.spi: trace # Hibernate 세션 및 영속성 컨텍스트의 내부 엔진 동작
  org.hibernate.event.internal: trace # Hibernate 내부 이벤트 리스너의 구현체 동작
  org.hibernate.event.spi: trace # Hibernate 이벤트 처리의 SPI(Service Provider Interface) 레벨
  org.hibernate.internal: trace # Hibernate의 내부 구현 세부사항 추적
```

- 학습 간 사용했던 옵션이에요. (채찍피티가 알려준..)

## 결론

OSIV는 개발 편의성과 성능 사이의 트레이드오프를 고려해야 하는 중요한 설정인 것 같아요. 각 프로젝트의 특성에 맞게 신중하게 선택해야 해요. (정답은 없다...!)

- 애플리케이션의 트래픽 규모
- 데이터베이스 커넥션 관리 전략
- 지연 로딩 사용 패턴
- 성능 요구사항

> 고객이 직접 경험하게 되는 서비스의 실시간 API는 OSIV를 끄고, 관리자 페이지처럼 커넥션을 많이 사용하지 않는 곳에서는 OSIV를 키는 전략을 사용하는 곳도 있다고 하네요.

저도 사용자가 경험하는 API인 경우에는 OSIV 비활성화를 주로 선택할 것 같아요.

긴 글 읽어주셔서 감사합니다.

## 참고

- [Spring OSIV - Baeldung](https://www.baeldung.com/spring-open-session-in-view)
- [What is this spring.jpa.open-in-view=true property in Spring Boot? - stackoverflow](https://stackoverflow.com/questions/30549489/what-is-this-spring-jpa-open-in-view-true-property-in-spring-boot)
- [Spring Boot Issue #7107](https://github.com/spring-projects/spring-boot/issues/7107)
- [JPA - OSIV(Open Session In View) 정리 - 유경호](https://ykh6242.tistory.com/entry/JPA-OSIVOpen-Session-In-View%EC%99%80-%EC%84%B1%EB%8A%A5-%EC%B5%9C%EC%A0%81%ED%99%94)
