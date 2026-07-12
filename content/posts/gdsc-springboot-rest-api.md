---
title: "[GDSC] Spring Boot로 REST API 만들어보기"
date: "2023-09-10T00:00:00Z"
summary: "GDSC 서버 파트 스터디를 위한 Spring Boot와 REST API 기초 개념 및 실습 자료입니다."
tags: ["Spring Boot", "REST API", "Java", "GDSC"]
---
## GDSC
GDSC 서버 파트의 스터디를 위한 자료에요.

</br>

## Spring?
최신 Java 기반 엔터프라이즈 애플리케이션 개발을 위한 오픈 소스 경량급 프레임워크에요.

우리가 쉽게 볼 수 있는 기업들의 웹 서비스에는 **비즈니스 로직**이라는 것이 있어요.
기업이 제공하는 서비스를 코드로 옮긴 것, 즉 사용자의 요청에 응답하기 위한 코드에요.

스프링이 등장하기 이전에는 비즈니스 로직을 구현하기 위해 필요한 기술을 배우는 시간이 매우 길었다고 해요.

그러나 스프링은 이전 기술보다는 훨씬 사용하기 쉽기 때문에
비즈니스 로직에 더욱 집중할 수 있게 되었다고 해요.

</br>

## Spring 특징
스프링 특징을 간단히 알아볼게요.

### POJO 프로그래밍 지향
스프링은 POJO(Plain Old Java Object) 프로그래밍을 지향해요.
POJO는 **순수 Java만 사용하여 생성한 객체**를 의미해요.

순수 Java만을 사용하여 생성한 객체를 만드는 것이 왜 중요할까요?

어떤 객체가 외부 라이브러리나 모듈을 import하여 사용한다고 가정할게요.
이때 사용 중인 외부 기술이 ~~Deprecated~~ 되거나 신기술이 나온다면 관련된 많은 양의 코드를 수정하게 될거에요.

객체가 외부 기술에 의존하고 있기 때문에 발생하는 문제에요.

특정 환경이나 기술에 종속되지 않는다면, 보다 유연하게 확장하거나 변화시킬 수 있는 장점이 있어요.

스프링은 POJO 프로그래밍을 위해 여러 기술을 지원해요. (IoC/DI, AOP 등)

### IoC
IoC(Inversion Of Control)는 제어의 역전이라고 해요.

우리가 [프레임워크](https://www.castingn.com/sourcing/kkultip_detail/110) 없이 개발할 때는 객체의 생명주기(생성, 초기화, 호출, 메소드 사용 등)를 프로그래머가 관리해요. 또한 외부 라이브러리를 사용할 때, 개발자가 직접 외부 라이브러리를 호출하는 시점 역시 프로그래머가 관리해요.

하지만 프레임워크를 사용하면 객체의 생명주기를 모두 프레임워크에게 위임할 수 있어요.
이처럼 객체나 메소드의 제어 등을 개발자가 아닌 외부에 위임하는 설계 형태를 IoC라고 해요.

스프링 프레임워크를 사용해보신 분이라면 이미 IoC를 경험했어요.
Controller나 Service 객체를 생각해보면 간단해요. 
위 객체가 하는 일은 개발자가 직접 작성하지만, 해당 객체들이 언제 호출될까?는 신경쓰지 않아요.
**스프링 프레임워크가 객체의 생명주기를 제어하기 때문이에요.**

이를 통해 개발자는 비즈니스 로직에 더욱 집중할 수 있어요.

추가로 라이브러리를 사용할 때에는 단순히 기능이 필요할 때 가져다 쓰는 형태이기 때문에 제어의 역전이 일어나지 않아요.

### DI
DI(Dependency Injection)은 의존성 주입 또는 의존관계 주입이라고 해요.
DI는 IoC 프로그램을 만들기 위해 사용하는 패턴 중 하나에요.

먼저 **의존성**부터 알아볼게요.

```java
public class Member {
    private Team team = new Team();
}
```
`Member` 클래스에 `Team` 클래스를 필드로 가지고 있어요.
만약 이 상태에서 `Team` 클래스에 final 필드가 추가된다면
`Member` 클래스의 team 필드를 채우기 위해 새로운 `Team 객체를 생성하면서 에러가 발생해요.

`Team` 클래스의 코드가 변경되었는데 `Member` 에도 영향을 미치게 되었어요.
이때 `Member가 Team에 의존한다.` 라고 해요.

지금은 `Member` 클래스 내부에서 `Team` 객체를 생성하고 있어요.
즉, 언제나 내부에서 생성한 인스턴스에 의존하는 관계로 고정돼요.

```java
public class Member {
	private Team team;
    
    public Member(Team team) {
    	this.team = team;
    }
}
```
하지만 위와 같은 코드는 어떤가요?

여전히 `Team` 클래스가 변경되면 `Member` 클래스에도 영향이 있기 때문에, `Member가 Team에 의존한다.`

하지만 앞 코드와는 다르게 의존관계를 생성자를 통해 외부에서 주입받기 때문에 변경에 더욱 유연하게 대처할 수 있어요.

의존성 주입 방법은 3개의 패턴이 존재해요.
`생성자 주입`, `Setter 주입`, `Field 주입`

### AOP
AOP(Aspect Oriented Programming)는 관심 지향 프로그래밍이라고 해요.

애플리케이션을 개발할 때 구현해야 할 기능들은 크게 `공통 관심 사항` 과 `핵심 관심 사항` 으로 분류할 수 있어요.

먼저 `공통 관심 사항` 은 말 그대로 모든 것에 공통적으로 적용되는 관심 사항이에요.
예를 들어 로깅, 보안 같은 기능은 어디에나 적용되어야 하는 공통 관심 사항이에요.
모든 핵심 관심 사항에는 공통적으로 공통 관심 사항이 적용돼요.

`핵심 관심 사항` 은 애플리케이션의 핵심 기능과 관련된 관심 사항이에요.
게시판 애플리케이션에서는 게시판 등록하기, 게시판 수정하기, 댓글 작성하기 등이 있어요.

```java
public class postApp() {
	
    ...
    
    public void 작성하기() {
    	// 공통 관심 사항
        로깅 관련 코드
        보안 관련 코드
        
        // 핵심 관심 사항
        게시판 작성 관련 로직
    }
    
    public void 수정하기() {
    	// 공통 관심 사항
        로깅 관련 코드
        보안 관련 코드
        
        // 핵심 관심 사항
        게시판 수정 관련 로직
    }
    
    ...
    
}
```
위 코드처럼 발생하는 코드의 중복을 피하기 위해 `공통 관심 사항` 과 그와 관련된 기능들을 별도의 객체로 만들어 분리하고 분리한 객체의 메소드로 `공통 관심 사항` 기능을 실행시킬 수 있도록 해야해요.

이처럼, 애플리케이션 전반에 걸쳐 적용되는 공통 기능을 비즈니스 로직으로부터 분리해내는 것을 AOP 라고 해요.

</br>

## Spring Boot?
스프링 부트는 스프링으로 애플리케이션을 만들 때에 필요한 설정을 간편하게 처리해주는 별도의 프레임워크에요.
스프링이 이전 기술보다 복잡성이 많이 줄었다고 하지만, 여전히 꽤 많은 설정을 요구해요.

스프링 부트를 사용하면 기존에 어려운 초기 설정에 쏟아야 했을 시간과 노력을 절약하여 비즈니스 로직을 구현하는데에 집중할 수 있습니다.

또한, 스프링 부트는 자체적인 웹 서버를 내장하고 있고, 독립적으로 실행 가능한 Jar 파일로 프로젝트를 빌드할 수 있기 때문에 빠르고 간단하게 배포를 진행할 수 있어요.

![스프링 부트 공식 설명](/images/posts/gdsc-springboot-rest-api/d30cf13e_image.png)

공식 문서를 살펴보면 독립적인 스프링 애플리케이션 생성할 수 있고
Tomcat 같은 서버가 내장되어 있기 때문에 War 파일을 배포할 필요가 없다고 하네요.

</br>

## Spring Boot 시작하기
스프링 부트를 사용하여 간단한 프로젝트를 만들어볼게요.

아래의 준비가 필요해요.
- JDK 17 이상 설치
- IntelliJ 설치


![New Project](/images/posts/gdsc-springboot-rest-api/78fc4f36_image.png)  

먼저 인텔리제이를 실행하고 `New Project` 를 클릭해요.

![Project](/images/posts/gdsc-springboot-rest-api/c204b4c8_image.png)

그리고 왼쪽에서 `Spring Initializr` 를 선택하고 내용을 작성해요.

- `Name` : 프로젝트 이름, 보통 첫 글자는 대문자로 시작하는 편이에요.
- `Location` : 저장 위치에요.
- `Group` : 프로젝트를 만드는 그룹의 이름, 대부분 기업의 도메인 명을 역순으로 작성해요. 
- `Artifact` : 빌드 결과물의 이름이에요.
- `Package name` : 프로젝트에 생성할 패키지를 설정해요.
- `JDK` : 설치한 JDK 버전 17을 사용해요.
- `Java` : 버전 17을 사용해요.
- `Packaging` : 배포를 위해 프로젝트를 압축하는 방법을 선택, 이번엔 `Jar` 를 선택해요.

위 설정을 마치고 `Next` 를 눌러요.

![Dependency 설정](/images/posts/gdsc-springboot-rest-api/ca04067d_image.png)

위와 같이 `Spring Boot DevTools`, `Spring Web`, `Lombok` 의존성을 추가해요.

![프로젝트 생성 완료](/images/posts/gdsc-springboot-rest-api/d51bde3e_image.png)

프로젝트 생성을 완료했어요! 

HelloSpringApplication 클래스의 main() 메소드를 실행시키면 정상적으로 실행되는 것을 볼 수 있어요.

</br>

## REST
[REST](https://ko.wikipedia.org/wiki/REST)(Representational State Transfer)는 월드 와이드 웹과 같은 분산 하이퍼미디어 시스템을 위한 소프트웨어 아키텍처의 한 형식이에요.

REST는 네트워크 상에서 Client와 Server 사이의 통신 방식 중 하나이며,
웹의 기존 기술과 HTTP 프로토콜을 그대로 활용할 수 있는 아키텍처에요.

자원을 이름(자원의 표현)으로 구분하여 해당 자원의 상태(정보)를 주고 받는 모든 것을 의미한다.

쉽게 말해 `API 설계 방법 또는 규칙` 이라고 생각하면 돼요

### REST 구성 및 특징

#### 구성
- `자원(Resource)` : URI
- `행위(Verb)` : HTTP Method
- `표현(Representation of Resource)` : 요청에 대한 적절한 응답

#### 특징
- Server-Client(서버-클라이언트 구조)
- Stateless(무상태)
- Cacheable(캐시 처리 가능)
- Layered System(계층화)
- Uniform Interface(인터페이스 일관성)

> HTTP URI(Uniform Resource Identifier)를 통해 자원(Resource)을 명시하고, HTTP Method(POST, GET, PUT, DELETE)를 통해 해당 자원에 대한 CRUD Operation을 적용하는 것을 의미한다. &nbsp [출처](https://hahahoho5915.tistory.com/54)

### HTTP Method
HTTP Method는 Client와 Server 사이에 이루어지는 요청(request)과 응답(response) 데이터를 전송하는 방식을 말해요.

주요 메소드 간단 설명

- `GET` : 자원 조회
- `POST` : 요청 데이터 처리, 주로 등록에 사용
- `PUT` : 자원 전체 변경
- `PATCH` : 자원 부분 변경
- `DELETE` : 자원 삭제

[HTTP Method 동작 방식](https://inpa.tistory.com/entry/WEB-%F0%9F%8C%90-HTTP-%EB%A9%94%EC%84%9C%EB%93%9C-%EC%A2%85%EB%A5%98-%ED%86%B5%EC%8B%A0-%EA%B3%BC%EC%A0%95-%F0%9F%92%AF-%EC%B4%9D%EC%A0%95%EB%A6%AC)

### CRUD
[CRUD](https://ko.wikipedia.org/wiki/CRUD)는 대부분의 컴퓨터 소프트웨어가 가지는 기본적인 데이터 처리 기능인 Create(생성), Read(읽기), Update(갱신), Delete(삭제)를 묶어서 일컫는 말해요.

- `C` : Create, 생성
- `R` : Read, 읽기
- `U` : Update, 수정 또는 갱신
- `D` : Delete, 삭제

</br>

## REST API
REST 기반으로 서비스 [API(Application Programming Interface)](https://aws.amazon.com/ko/what-is/api/)를 구현한 것이에요.

간단하게 설계 규칙을 알아볼게요.

- `/` 구분자는 계층 관계를 나타내요.
- URI 마지막 문자로 `/` 구분자를 사용하지 않아요.
- 불가피하게 긴 URI를 사용할 때 `-` 를 사용하여 가독성을 높여요. `_` 는 사용하지 않아요.
- URI 경로는 `소문자` 로 작성하는 것이 좋아요.
- 파일 확장자는 경로에 포함하지 않아요. 

예시) (GET) http://www.example.com/members/3 (id가 3인 멤버 정보(자원)을 조회하는 URI)

**RESTful**은 일반적으로 REST라는 아키텍처를 구현하는 웹 서비스를 나타내기 위해 사용되는 용어라고 해요.
‘REST API’를 제공하는 웹 서비스를 **‘RESTful’**하다고 할 수 있어요.

</br>

## Layer

### Controller Layer

- `역할` : 사용자의 HTTP 요청을 처리하고, 적절한 응답을 반환하는 계층이에요. (REST API 기준)
- `동작` : HTTP 요청을 받아 파싱하고, 해당 요청에 맞는 비즈니스 로직을 호출하거나 서비스 계층에 요청을 전달하거나 클라이언트에게 HTTP 응답을 생성하여 반환합니다.
- `예시` : 웹 애플리케이션에서 사용자가 "GET /items/1" 엔드포인트로 사용자 목록을 요청하면, 컨트롤러는 해당 요청을 받아서 사용자 서비스로 전달하고, 사용자 서비스로부터 반환된 데이터를 JSON 형태로 변환하여 클라이언트에게 반환해요.

### Service Layer

- `역할` : 비즈니스 로직을 포함하고, 컨트롤러로부터 받은 요청을 처리하기 위해 데이터베이스와 상호 작용하는 계층이에요.
- `동작` : 컨트롤러로부터 받은 요청을 처리하기 위해 필요한 비즈니스 로직을 수행하고, 데이터베이스나 다른 외부 리소스와 상호 작용해요. 이 계층은 일반적으로 여러 개의 레포지토리 객체를 사용하여 데이터 액세스를 관리하고, 데이터를 가공하거나 필요한 형태로 조작해요.
- `예시` : 재고 관리 서비스에서 물건을 추가, 업데이트, 삭제하거나 재고 품목을 검색하는 기능을 제공해요. 이 서비스는 사용자 데이터를 레포지토리를 통해 데이터베이스에서 읽거나 쓰며, 비즈니스 규칙을 적용하여 처리해요.

### Repository Layer

- `역할` : 데이터베이스와의 상호 작용을 추상화하고, 데이터 액세스 기능을 제공합니다. JPA(Java Persistence API)를 사용할 때, 이 계층을 자주 사용해요.
- `동작`: 데이터베이스와 직접 상호 작용하는 로직을 캡슐화하며, 데이터베이스에 데이터를 저장, 조회, 업데이트, 삭제하는 작업을 처리해요. 레포지토리 데이터베이스 테이블과 매핑되는 엔티티 클래스를 사용하여 데이터를 조작해요.
- `예시` : 재고 관리 애플리케이션의 경우, 물건(재고) 데이터를 데이터베이스에 저장하고 검색하는 등의 작업을 수행해요. 이를 위해 사용자 엔티티 클래스와 연결된 사용자 레포지토리가 필요해요.

Repository 패턴은 인터페이스 기반으로 데이터 액세스 기능을 정의하며, 구현체는 프레임워크가 자동으로 생성해요. (예를 들어 JPA, Hibernate 등)

전통적인 자바 애플리케이션에서는 DAO 패턴을 사용해요. 특정 데이터베이스 또는 데이터 소스와 직접 상호 작용하는 데 주로 사용돼요. 주로 인터페이스와 구현 클래스를 함께 정의하며, 개발자가 직접 메서드 구현을 작성해요.

우리가 만들 애플리케이션은 DAO 패턴이 더 맞다고 생각하지만, 추후 JPA를 배워서 사용할 땐 Repository를 사용하기 때문에 편의를 위해 Repository 패턴을 사용할 예정이에요.

</br>

## Spring Boot로 REST API
먼저 간단하게 문자열을 반환하는 REST API를 만들어볼게요.

![패키지 만들기](/images/posts/gdsc-springboot-rest-api/a68f414f_image.png)

해당 위치에 "controller" 라는 이름의 `Package` 를 생성해요.
그리고 만든 `controller 패키지` 에 `HelloController` 라는 이름의 `Java Class` 를 생성해요.

이제 여기에 아래와 같은 코드를 작성해요.

![Hello, Spring](/images/posts/gdsc-springboot-rest-api/ad06021c_image.png)

- `@RestController` : Spring Framework에서 제공하는 애노테이션으로, 이 클래스가 RESTful 웹 서비스의 엔드포인트를 처리하는 컨트롤러라고 지정해요. 이 컨트롤러는 HTTP 요청과 응답을 처리하며, JSON 또는 XML과 같은 데이터 형식으로 클라이언트에게 응답을 반환해요.
메소드(여기서는 hello() 메소드)의 반환 값은 HTTP 응답 본문으로 자동 변환되어 클라이언트에게 전송돼요.
- `@GetMapping` : "/hello" 경로에 대한 HTTP GET 요청을 처리하는 메소드로 지정해요.
- `hello()` : 이 메소드는 앞서 말한 것처럼 "/hello" 경로로 들어오는 GET 요청을 처리하며, "Hello, Spring!" 문자열을 반환해요.

자 그러면 한 번 실행을 해볼게요.

![실행](/images/posts/gdsc-springboot-rest-api/537f7cf4_image.png)

위와 같이 나온다면 바로 웹 브라우저 주소란에 `localhost:8080/hello` 를 입력해보세요.

![](/images/posts/gdsc-springboot-rest-api/4f07b267_image.png)

`hello()` 메소드의 반환값인 "Hello, Spring!"이 잘 표시되는 것을 볼 수 있어요.

아까 응답은 JSON 또는 XML과 같은 데이터 형식으로 반환한다고 했는데 왜 문자열 그대로 출력되나요?
> "Hello, Spring!"과 같은 문자열이 바로 나오는 이유는 Spring Framework의 @RestController 애노테이션이 기본적으로 문자열을 HTTP 응답으로 반환할 때 JSON 변환이 필요하지 않다고 인식하기 때문에 "Hello, Spring!" 문자열은 그대로 HTTP 응답으로 전송되고, 브라우저에서는 단순한 텍스트로 표시하게 돼요.


### @RestController
@RestController 어노테이션은 @Controller와 @ResponseBody가 합쳐진 편의 기능이에요.

만약 @RestController 대신 @Controller 어노테이션을 사용하여 `localhost:8080/hello` 를 입력한다면 오류가 발생해요.

@Controller 어노테이션은 기본적으로는 [Spring Web MVC](https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/mvc.html)에서 View에 데이터를 전달하는 데 사용하기 때문에 메소드의 반환값이 HTTP 응답 본문으로 전송될 때 브라우저가 표시할 수 있는 값으로 변환되지 않아요. 이때 @ResponseBody 어노테이션을 이용하면 반환값을 JSON 형식으로 변환하여 HTTP 응답 본문을 전송할 수 있어요.

즉, REST API를 만들기 위해서는 두 기능 모두 필요하기 때문에 합쳐진 편의 기능이라고 생각하면 돼요.

</br>

## REST API, CRUD 구현
이제 본격적으로 CRUD 기능을 하는 REST API를 구현해볼게요.

이번 과정에서는 실제 데이터베이스를 사용하지 않고 메모리에 저장하는 방식으로 진행돼요.

### 패키지 구조
- `controller` : 컨트롤러 클래스를 모아두는 패키지에요.
- `service` : 서비스 클래스를 모아두는 패키지에요.
- `repository` : 레포지토리 클래스를 모아두는 패키지에요.
- `domain` : DB 테이블 컬럼과 동일한 필드를 가진 클래스(DB 처리용 클래스)를 모아두는 패키지에요.
- `dto` : Data Transfer Object, dto 클래스를 모아두는 패키지에요.

![](/images/posts/gdsc-springboot-rest-api/1b05aec1_image.png)


### 구현할 기능
구현할 기능은 물류 창고의 재고를 관리할 수 있는 REST API에요.
물건을 추가하거나 제거하는 등의 기능을 수행할 수 있도록 만들 예정이에요.

### Domain
먼저 `domain 패키지`에 `Item` 클래스를 생성하고 다음과 같이 코드를 작성해요.

```java
package com.gdsc.hellospring.domain; // 이 코드는 해당 클래스의 위치를 나타내기 때문에 패키지 구조에 따라 다를 수 있어요!!

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Item {

    private Long id; // 물건의 고유 id
    private String name; // 물건의 이름
    private Long count; // 물건의 개수 (재고)

}
```

- `@Getter` , `@Setter` : getter, setter 메소드를 자동으로 생성해요.
- 개인적으로 무분별한 @Setter 사용은 좋아하지 않아요.
- [Getter, Setter 알아보기](https://luanaeun.tistory.com/141)

### DTO
`dto 패키지`에 `ItemDto` 클래스를 생성하고 다음과 같이 작성해요.

```java
package com.gdsc.hellospring.dto;

import lombok.Data;

@Data
public class ItemDto {

    private Long id;
    private String name;
    private Long count;

}
```
`ItemDto` 클래스는 dto 클래스에요. 데이터를 주고 받을 때 사용해요.

여러 프로젝트마다 요청 dto와 응답 dto로 나누기도 해요.

지금은 간단한 예제이니 주고 받는 dto 클래스 하나만 만들어요.

### Repository
`repository 패키지`에 `ItemRepository` 인터페이스를 생성하고 다음과 같이 작성해요.

```java
package com.gdsc.hellospring.repository;

import com.gdsc.hellospring.domain.Item;

import java.util.List;

public interface ItemRepository {

    void save(Item item);
    Item findById(Long id);
    List<Item> findAll();
    void updateById(Long id, Item item);
    void deleteById(Long id);

}
```
Repository는 데이터베이스와 연관되어 있는 계층이다 보니 다른 데이터베이스로 변경될 가능성이 비교적 높아요.

이 인터페이스에 Repository 구현체가 가져야 할 메소드들을 정의해둠으로서 구현체를 변경하거나 다른 구현체로 교체할 때, 새로운 구현체가 인터페이스를 준수하기만 하면, 내부 코드를 수정할 필요가 없어요.

예를 들어 MySQL DB를 사용하는 구현체에서 Oracle DB를 사용하는 구현체로 변경할 때,
인터페이스만 따라주면 코드를 크게 변경하지 않아도 돼요.

지금은 데이터베이스 기술을 사용하지 않고, 메모리에 저장하는 방식으로 `MemoryItemRepository` 클래스를 작성해볼게요.
클래스 생성 후 `ItemRepository` 인터페이스를 구현해야 해요.

![구현체](/images/posts/gdsc-springboot-rest-api/7e1821b2_image.png)

이렇게 오류가 발생하는 것을 볼 수 있어요.

![error](/images/posts/gdsc-springboot-rest-api/13fa6ff4_image.png)


인터페이스에 작성된 추상 메소드가 구현되지 않았음을 알리는 오류에요.
`Implement methods`를 누르고 추상 메소드를 구현해주면 오류가 사라져요.

모든 추상 메소드를 구현하면 다음과 같이 코드가 작성돼요.

```java
package com.gdsc.hellospring.repository;

import com.gdsc.hellospring.domain.Item;

import java.util.List;

public class MemoryItemRepository implements ItemRepository {

    @Override
    public void save(Item item) {

    }

    @Override
    public Item findById(Long id) {
        return null;
    }

    @Override
    public List<Item> findAll() {
        return null;
    }

    @Override
    public void updateById(Long id, Item item) {

    }

    @Override
    public void deleteById(Long id) {

    }
    
}
```

이제 메소드 내부를 작성해줘야 해요.

먼저 데이터베이스를 대신 해줄 저장 공간을 만들기 위해 [HashMap](https://coding-factory.tistory.com/556)을 이용할 거에요.

`Key` : 고유 id를 저장해요.
`Value` : Item 객체를 저장해요.

추가적으로 Item 객체마다 고유 id값을 만들어주기 위해 sequence 변수도 만들어요.

```java
public class MemoryItemRepository implements ItemRepository {

    private static Map<Long, Item> store = new HashMap<>(); // 저장 공간
    private static Long sequence = 0L; // id를 생성하기 위한 sequence
    
    ...

}

```

다음은 모든 메소드를 작성하고 완성된 코드에요.

```java
package com.gdsc.hellospring.repository;

import com.gdsc.hellospring.domain.Item;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class MemoryItemRepository implements ItemRepository {

    private static Map<Long, Item> store = new HashMap<>();
    // id를 생성하기 위한 sequence
    private static Long sequence = 0L;

    @Override
    public void save(Item item) {
        item.setId(++sequence); // id를 생성하고 item에 저장
        store.put(item.getId(), item); // store에 저장
    }

    @Override
    public Item findById(Long id) {
        return store.get(id); // id에 해당하는 item을 찾아서 반환
    }

    @Override
    public List<Item> findAll() {
        return store.values().stream().toList(); // store에 있는 모든 value를 ArrayList에 담아서 반환
    }

    @Override
    public void updateById(Long id, Item item) {
        store.put(id, item); // store에 저장, hash map은 key가 같으면 덮어씌워지기 때문에 id는 그대로 두고 내용만 수정
    }

    @Override
    public void deleteById(Long id) {
        store.remove(id); // id에 해당하는 item을 찾아서 삭제
    }

}
```

- `@Repository` : 스프링에서 지원하지 않는 Exception을 Spring Exception으로 전환하기 위해서 @Repository어노테이션을 사용해요. 여기서는 Exception이 발생할 경우 Unchecked Exception을 DataAccessException으로 전환시켜요. 주로 DAO(Data Access Object)에서 사용하는데 예를들어 트랜잭션을 적용한 메소드에서 DB오류가 발생해도 롤백이 가능한 이유에요.
- `@Component` : 여기서 직접 사용하지는 않고 @Repository나 @Controller 등에 포함되어 있어요. 스프링 빈으로 등록하려고 할 때 사용해요. 쉽게 말해 스프링이 관리하는 객체임을 알리는 어노테이션이에요.
- `save()` : 새로운 Item 객체를 저장할 때마다 sequence 변수를 1씩 증가시켜 고유한 id 값을 만들어줘요. 그리고 해시맵에 Key는 고유 id값, Value에는 Item 객체를 담아서 저장해요.
- `findById()` : id 값을 기준으로 해시맵에 저장된 Item 객체를 찾아서 반환해요.
- `findAll()` : 해시맵에 저장된 모든 Item 객체들을 ArrayList 객체에 담아서 반환해요.
- `updateById()` : 해시맵에 이미 저장되어 있는 것과 Key가 같을 경우 새로운 값으로 덮어씌워지기 때문에 이렇게 구현했어요.
- `deleteById()` : id 값을 기준으로 해시맵에 저장된 Item 객체를 제거해요.

### Service
`service 패키지`에 `ItemService` 클래스를 생성하고 다음과 같이 작성해요.

```java
package com.gdsc.hellospring.service;

import com.gdsc.hellospring.domain.Item;
import com.gdsc.hellospring.dto.ItemDto;
import com.gdsc.hellospring.repository.ItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemService {

    private final ItemRepository itemRepository;

    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public void saveItem(ItemDto itemDto) {
        Item item = new Item(); // item 객체 생성 후 itemDto의 내용을 item에 저장
        item.setName(itemDto.getName());
        item.setCount(itemDto.getCount());

        itemRepository.save(item); // itemRepository를 통해 item을 저장
    }

    public ItemDto findItemById(Long id) {
        Item item = itemRepository.findById(id); // itemRepository를 통해 id에 해당하는 item을 찾아서 반환

        ItemDto itemDto = new ItemDto(); // itemDto 객체 생성 후 item의 내용을 itemDto에 저장
        itemDto.setId(item.getId());
        itemDto.setName(item.getName());
        itemDto.setCount(item.getCount());

        return itemDto; // itemDto 반환
    }

    public List<ItemDto> findAllItem() {
        return itemRepository.findAll()
                .stream()
                .map(item -> {
                    ItemDto itemDto = new ItemDto(); // itemDto 객체 생성 후 item의 내용을 itemDto에 저장
                    itemDto.setId(item.getId());
                    itemDto.setName(item.getName());
                    itemDto.setCount(item.getCount());

                    return itemDto; // itemDto 반환
                    })
                .toList(); // itemRepository를 통해 모든 item을 찾아서 반환
    }

    public void updateItemById(Long id, ItemDto itemDto) {
        Item findItem = itemRepository.findById(id); // itemRepository를 통해 id에 해당하는 item을 찾아서 반환
        findItem.setName(itemDto.getName());
        findItem.setCount(itemDto.getCount());
        
        itemRepository.updateById(id, findItem); // itemRepository를 통해 id에 해당하는 item을 찾아서 내용을 수정
    }

    public void deleteItemById(Long id) {
        itemRepository.deleteById(id); // itemRepository를 통해 id에 해당하는 item을 찾아서 삭제
    }

}
```
각 메소드들을 살펴보기 전에 불편한 부분이 있어요.
dto 객체를 Item 객체로 만드는 과정이나, Item 객체를 dto 객체로 만드는 과정에서 많은 setter를 사용하게 되는데, 다른 사람이 이 코드를 보면 어떤 작업이 이루어지는지 파악하기 힘들 수 있어요.

그래서 저는 무분별한 setter 사용을 지양하고 `@Builder` 어노테이션을 사용해요.

```java
package com.gdsc.hellospring.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
public class Item {

    private Long id;
    private String name;
    private Long count;

    @Builder
    public Item(String name, Long count) {
        this.name = name;
        this.count = count;
    }
    
    // 기능은 setter와 동일하지만 왜 수정하려는지 명확하게 알 수 있어요.
    // ** 하지만 실제 프로젝트에서 id 필드를 접근할 수 있게 하는 것은 굉장히 위험해요. 전체적인 흐름 파악을 위해 이번에만 사용하기로 해요.**
    public void initId(Long id) {
        this.id = id;
    }
    
    // 추가적으로 Item 객체를 수정할 때 setter로 하나씩 필드를 수정하는 것보다 updateItem 메소드를 이용하면 좀 더 직관적으로 이해할 수 있게 돼요.
    public void updateItem(String name, Long count) {
        this.name = name;
        this.count = count;
    }

}
```

```java
package com.gdsc.hellospring.dto;

import lombok.Builder;
import lombok.Data;

@Data
public class ItemDto {

    private Long id;
    private String name;
    private Long count;

    @Builder
    public ItemDto(Long id, String name, Long count) {
        this.id = id;
        this.name = name;
        this.count = count;
    }

}
```
위와 같이 `@Builder` 어노테이션을 사용하면 아래와 같이 Service 코드가 간결해져요.

```java
package com.gdsc.hellospring.service;

import com.gdsc.hellospring.domain.Item;
import com.gdsc.hellospring.dto.ItemDto;
import com.gdsc.hellospring.repository.ItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
	
    // 의존성 생성자 주입
    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public void saveItem(ItemDto itemDto) {
        Item item = Item.builder()
                .name(itemDto.getName())
                .count(itemDto.getCount())
                .build();

        itemRepository.save(item); // itemRepository를 통해 item을 저장
    }

    public ItemDto findItemById(Long id) {
        Item item = itemRepository.findById(id); // itemRepository를 통해 id에 해당하는 item을 찾아서 반환

        return ItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .count(item.getCount())
                .build(); // itemDto 반환
    }

    public List<ItemDto> findAllItem() {
        return itemRepository.findAll()
                .stream()
                .map(item -> ItemDto.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .count(item.getCount())
                        .build())
                .toList(); // itemRepository를 통해 모든 item을 찾아서 반환
    }

    public void updateItemById(Long id, ItemDto itemDto) {
        Item findItem = itemRepository.findById(id); // itemRepository를 통해 id에 해당하는 item을 찾아서 반환
        findItem.updateItem(itemDto.getName(), itemDto.getCount()); // item의 내용을 수정

        itemRepository.updateById(id, findItem); // itemRepository를 통해 id에 해당하는 item을 찾아서 내용을 수정
    }

    public void deleteItemById(Long id) {
        itemRepository.deleteById(id); // itemRepository를 통해 id에 해당하는 item을 찾아서 삭제
    }

}
```
Repository도 기존 사용하던 `setId()`를 `initId()`로 변경해야 오류가 나지 않아요!
```java
package com.gdsc.hellospring.repository;

import com.gdsc.hellospring.domain.Item;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class MemoryItemRepository implements ItemRepository {

    private static Map<Long, Item> store = new HashMap<>();
    // id를 생성하기 위한 sequence
    private static Long sequence = 0L;

    @Override
    public void save(Item item) {
        item.initId(++sequence); // id를 생성하고 item에 저장
        store.put(item.getId(), item); // store에 저장
    }

    @Override
    public Item findById(Long id) {
        return store.get(id); // id에 해당하는 item을 찾아서 반환
    }

    @Override
    public List<Item> findAll() {
        return store.values().stream().toList(); // store에 있는 모든 value를 ArrayList에 담아서 반환
    }

    @Override
    public void updateById(Long id, Item item) {
        store.put(id, item); // store에 저장, hash map은 key가 같으면 덮어씌워지기 때문에 id는 그대로 두고 내용만 수정
    }

    @Override
    public void deleteById(Long id) {
        store.remove(id); // id에 해당하는 item을 찾아서 삭제
    }

}
```

### Controller
`controller 패키지`에 ItemController를 생성하고 다음과 같이 작성해요.

```java
package com.gdsc.hellospring.controller;

import com.gdsc.hellospring.dto.ItemDto;
import com.gdsc.hellospring.service.ItemService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ItemController {

    private final ItemService itemService;

	// 의존성 생성자 주입
    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PostMapping("items")
    public void save(@RequestBody ItemDto itemDto) {
        itemService.saveItem(itemDto);
    }

    @GetMapping("items/{id}")
    public ItemDto findItemById(@PathVariable Long id) {
        return itemService.findItemById(id);
    }

    @GetMapping("items")
    public List<ItemDto> findAllItem() {
        return itemService.findAllItem();
    }

    @PatchMapping("items/{id}")
    public void updateItemById(@PathVariable Long id, @RequestBody ItemDto itemDto) {
        itemService.updateItemById(id, itemDto);
    }

    @DeleteMapping("items/{id}")
    public void deleteItemById(@PathVariable Long id) {
        itemService.deleteItemById(id);
    }

}
```
- `@RequestBody` : HTTP 요청의 분문(json)을 자바 객체로 변환해주는 어노테이션이에요. 앞에서 설명한 `@ResponseBody` 와 반대에요.
- `@PathVariable` : URI에 변수를 넣을 수 있게 해줘요. "items/1" 경로로 GET 요청을 보내면 id가 1인 물건을 조회할 수 있어요. 이때 Controller에서는 "items/{id}" 형태로 요청을 받도록 할 수 있어요.

한 번 실행해볼까요?

</br>

## 결과 테스트, Postman
GET 요청처럼 조회하는 API는 쉽게 확인할 수 있지만, 나머지 API는 확인하기 힘들어요.

API를 쉽게 테스트 할 수 있는 도구인 [Postman](https://ko.wikipedia.org/wiki/%ED%8F%AC%EC%8A%A4%ED%8A%B8%EB%A7%A8_(%EC%86%8C%ED%94%84%ED%8A%B8%EC%9B%A8%EC%96%B4))에 대해서 알아보려고 해요.

[회원가입 및 사용 방법](https://parkjh7764.tistory.com/212)

- `POST` `localhost:8080/items` : 물건 추가 요청이에요.
- `GET` `localhost:8080/items/1` : id가 1인 물건 조회 요청이에요.
- `GET` `localhost:8080/items/list` : 전체 물건 조회 요청이에요.
- `PATCH` `localhost:8080/items/1` : id가 1인 물건 정보 수정 요청이에요.
- `DELETE` `localhost:8080/items/1` : id가 1인 물건 삭제 요청이에요.

해당 과정은 실습으로 진행할 예정이에요.

</br>

## 만약 데이터가 없다면?
지금까지 작성한 코드는 REST API와 CRUD 기능이 무엇인지 알려주기 위해 어느정도 간소화 되었어요.

실제 데이터베이스를 사용하지 않아서 Item 객체를 수정할 땐 그냥 덮어쓰기도 하고, 적절한 예외 처리도 하지 않았어요.
예를 들어 id가 2인 물건이 없는데, 조회하기 위해 "items/2" 경로로 GET 요청을 보낸다면 `NullPointerException`이 발생해요.
실제 사용하는 서버에서 이런 오류가 나면 안되기에 예외 처리를 해주어야 해요.

데이터 엑세스 과정에서 null 값으로 인한 오류를 방지하기 위해 주로 Optional 클래스를 사용해요.
Repository 계층에서 데이터를 가져올 때 Optional 객체에 담아서 가져와서 Optional에 들어있는 값이 null인 경우와 아닌 경우를 나누어서 예외 처리 또는 로직 실행을 할 수 있어요.

자세한 내용은 다음 스터디 세션에서 다뤄보도록 해요.

감사합니다.

</br>

## 참고
[Spring Framework](https://www.codestates.com/blog/content/%EC%8A%A4%ED%94%84%EB%A7%81-%EC%8A%A4%ED%94%84%EB%A7%81%EB%B6%80%ED%8A%B8)
[Spring Boot](https://spring.io/projects/spring-boot)
[Spring Web MVC](https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/mvc.html)
[Rest 정리](https://hahahoho5915.tistory.com/54)
[RESTful API](https://aws.amazon.com/ko/what-is/restful-api/)
[getter, setter](https://luanaeun.tistory.com/141)
[Postman 사용법](https://parkjh7764.tistory.com/212)

---

추가 내용

## 의존성 주입 방식

> 왜 많은 의존성 주입 방식 중에 생성자 주입 방식을 사용하나요? 라는 질문에 대한 답변을 추가합니다.

의존성 주입 방식에는 여러 가지가 있지만, 그 중에서도 `생성자 주입 방식`을 선호하는 이유를 간단하게 정리하면 아래와 같아요.

### 불변성 보장

생성자 주입 방식을 사용하면, 객체가 처음 생성될 때 모든 의존성을 전달받아요. 이는 해당 의존성이 객체가 생성된 이후에 변경될 가능성이 없다는 것을 의미하며, 객체의 불변성을 보장할 수 있어요. 불변성은 프로그램의 안정성을 높이고, 코드의 예측 가능성을 향상시켜요.

```java
// 생성자 주입 방식
@Service
public class OrderService {

    private final PaymentService paymentService;

    // 의존성을 생성자에서 주입받아요.
    public OrderService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    ...
}

// setter 주입 방식
@Service
public class OrderService {

    private PaymentService paymentService;

    // 의존성을 나중에 설정할 수 있어요. 즉, 불변성을 보장하지 못해요.
    @Autowired
    public void setPaymentService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    ...
}
```

생성자 주입은 final 키워드를 사용하여 의존성이 한 번 설정되면 변경되지 않도록 보장해요. 반면, setter 주입 방식에서는 객체 생성 후에도 의존성을 변경할 수 있기 때문에 불변성을 보장하지 못해요.

### 순환 참조 방지
field 주입이나 setter 주입 방식에서는 객체가 생성된 후에 의존성을 주입할 수 있기 때문에, 순환 참조 문제를 일으킬 가능성이 높아요. 하지만 생성자 주입을 사용하면 `객체 생성 시점`에 모든 의존성을 명확히 주입받기 때문에, 이러한 순환 참조 문제를 예방할 수 있어요.

```java
// 생성자 주입 방식
@Service
public class ServiceA {
    
    private final ServiceB serviceB;

    public ServiceA(ServiceB serviceB) {
        this.serviceB = serviceB;
    }
}

@Service
public class ServiceB {
    
    private final ServiceA serviceA;

    public ServiceB(ServiceA serviceA) {
        this.serviceA = serviceA;
    }
}
```

생성자 주입 방식을 사용하면, 순환 의존성이 발생할 경우 Spring 컨테이너가 에러를 발생시켜요. 이는 설계 단계에서 순환 참조 문제를 즉시 발견할 수 있게 돼요.

![](/images/posts/gdsc-springboot-rest-api/d03ea259_image.png)

> 참고로 Spring 버전 2.6 이후 부터는 setter 주입 방식을 사용하더라도 순환 참조를 감지하고 예외를 발생해요.

다른 방식으로 순환 참조 예외가 발생하지 않게 만들 순 있지만, 문제를 근본적으로 해결하기 위해서는 서로를 참조하지 않도록 구조를 다시 설계하는 것이 더욱 유리해보여요.

### 테스트 용이성

테스트 코드를 작성할 때, 생성자 주입은 의존성을 명시적으로 주입하기 때문에 테스트를 위한 의존성(예시: Mock 객체)을 쉽게 삽입할 수 있어요. 따라서, 의존성을 변경하거나 주입하는 과정이 간단해지기 때문에 단위 테스트를 작성하는 데 유리해요. 금방 체감되는 이유는 아니겠지만, 다른 이유로도 충분히 생성자 주입 방식을 사용하는 이유가 이해될 것 같아요.


위와 같은 이유들로 [Spring 공식 문서](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)에서는 `생성자 주입 방식`을 공식적으로 권장하고 있어요.
