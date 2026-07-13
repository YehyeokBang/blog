---
title: '[JPA] 엔티티 매핑'
date: '2023-07-19T00:00:00Z'
tags:
  - JPA
  - Spring Data JPA
  - Backend
  - Database
description: 'JPA의 엔티티 매핑 기본 개념, 데이터베이스 스키마 자동 생성, 기본 키 및 컬럼 매핑 방법 등에 대해 정리한 글입니다.'
---
## Spring Data JPA
제가 Spring Data JPA를 배우고 기록하게 된 [계기](https://velog.io/@hyeok_1212/JPA-%EC%98%81%EC%86%8D%EC%84%B1-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8)입니다.

## 엔티티
엔티티(Entity)는 실제 개체를 나타내는 개념이에요. 엔티티는 데이터베이스 테이블의 행(Record)과 일치하며, 시스템의 도메인 또는 비즈니스 영역에서 중요한 개념이나 객체를 표현해요.

제가 사용했던 엔티티는 비즈니스 도메인을 나타내는 클래스에요. 이러한 클래스는 해당 도메인에서 필요한 필드와 메소드를 가지고 있으며, 데이터베이스와의 상호 작용을 위한 매핑 정보도 포함되어 있어요.

## 매핑
우리가 자바 코드를 이용해 만든 객체와 데이터베이스 테이블, 객체의 필드와 테이블의 컬럼을 연결하기 위해서는 매핑 과정을 거처야 해요. 

오늘은 이러한 매핑 방법에 대해 알아보려고 해요.

### 참고사항
1. 엔티티와 테이블은 다른 개념이에요.
엔티티는 비즈니스 도메인을 표현하는 클래스이고,
테이블은 데이터베이스에 저장되는 구조에요.

2. 엔티티와 엔티티 객체는 다른 개념이에요.
엔티티는 클래스 자체를 나타내는 개념이고,
엔티티 객체는 해당 엔티티 클래스의 인스턴스에요.
즉, find()로 엔티티를 조회한다는 말은 틀린 말이에요.
엔티티 객체를 조회한다는 말이 올바른 표현이에요.

3. 엔티티 객체는 영속성 컨텍스트에 의해 관리돼요.

</br>

## @Entity
JPA에게 엔티티 클래스임을 알려주는 어노테이션이에요. JPA를 사용하며 테이블과 매핑할 클래스는 필수로 사용해야 해요.

@Entity 어노테이션이 붙은 User 클래스는 JPA가 관리하게 되며, 이를 엔티티라고 불러요.

```java
@Entity
public class User {
    ...
}
```

name 속성 설정으로 JPA에서 사용할 엔티티 이름을 지정할 수 있어요.
설정하지 않으면 클래스 이름을 그대로(User) 사용해요.
```java
// name 속성으로 JPA에서 사용할 엔티티 이름을 USER로 지정
@Entity(name="USER")
public class User {
    ...
}
```

> @Entity 적용 시 주의사항이 있어요!
- 기본 생성자 필수 
(파라미터가 없는 public or protected 생성자)
- enum, interface, final 클래스, inner 클래스에는 사용 불가
- 저장할 필드에 final 키워드 사용 불가

### 자바의 기본 생성자
자바는 생성자가 하나도 없으면 기본 생성자를 만들어요.
```java
// 기본 생성자
public User() {

}
```
하지만 하나 이상의 생성자를 직접 만든다면 기본 생성자가 자동으로 만들어지지 않아요.
```java
// 직접 만든 생성자
public User(String name) {
    this.name = name;
}

// 기본 생성자 자동 생성 X, 직접 만들어야 해요.
```

</br>

## @Table

엔티티와 매핑할 테이블을 지정하는 어노테이션이에요. 생략한다면 매핑한 엔티티 클래스 이름을 테이블 이름으로 사용해요.

```java
@Entity
@Table(name="USER")
public class User {
    ...
}
```

</br>

## 데이터베이스 스키마 자동 생성
JPA는 데이터베이스 스키마를 자동으로 생성하는 기능을 지원해요. 엔티티 클래스의 매핑 정보를 보면 어떤 테이블에 어떤 컬럼을 사용하는 지 알 수 있는데, 이 매핑 정보와 데이터베이스 방언을 사용해서 데이터베이스 스키마를 생성하는 기능이에요.

```xml
<property name="hibernate.hbm2ddl.auto" value="create"/>
```

persistence.xml에 위 속성을 추가하면 애플리케이션 실행 시점에 데이터베이스 테이블을 자동으로 생성한다고 해요.

저는 Spring Boot와 Spring Data JPA를 사용하면서 application.yml에 아래와 같은 속성을 추가하여 스키마 자동 생성을 사용했어요. 두 방법 모두 동일한 기능을 수행해요.

```yml
spring:
  jpa:
    hibernate:
      ddl-auto: create
```

스키마 자동 생성 기능을 사용하면 개발자가 테이블을 직접 생성하지 않아도 돼요. 하지만 이렇게 만들어진 DDL은 운영 환경에서 사용할 만큼 완벽하지 않기 때문에 개발 환경에서 사용하거나 참고하는 정도로만 사용하는 것이 좋다고 해요.

완벽하지 않지만, 객체와 테이블을 매핑하는 것이 미숙한 사람에게는 매핑 관련 훌륭한 학습 도구라고 해요.

</br>

### ddl-auto 속성

|속성|설명|
|------|---
|create|기존 테이블을 삭제하고 새로 생성해요. (DROP + CREATE)|
|create-drop|create 속성에 추가로 애플리케이션을 종료할 때 생성한 DDL을 제거해요. (DROP + CREATE + DROP)|
|update|데이터베이스 테이블과 엔티티 매핑정보를 비교해서 변경 사항을 수정해요.|
|validate|데이터베이스 테이블과 엔티티 정보를 비교해서 차이가 있으면 경고를 남기고 애플리케이션을 실행하지 않아요. (DDL을 수정하지 않아요.)|
|none|자동 생성 기능을 사용하지 않아요. (또는 ddl-auto 속성 자체를 작성하지 않아도 돼요.)|

### 주의사항
**운영 서버에서는 create, create-drop, update처럼 DDL을 수정하는 옵션을 절대 사용하면 안된다고 해요.** 

그 이유는 해당 옵션들이 운영 중인 데이터베이스 테이블이나 컬럼을 삭제할 수 있기 때문이에요.

</br>

## 기본 키 매핑
JPA가 제공하는 기본 키 매핑 전략은 크게 두 가지가 있어요.

### 직접 할당 방식
```java
@Entity
@Table(name="USER")
public class User {
    
    @Id
    private String id;
    ...
}
```
이 방식은 애플리케이션에서 직접 기본 키를 할당하는 방식이에요.

만약 기본 키 값이 없는 상태로 저장된다면 예외가 발생하는데, 어떤 예외가 발생하는지 JPA 표준에는 정의되어 있지 않기 때문에 문제가 생기지 않도록 자동 할당 방식 사용을 추천한다고 해요.

### 자동 할당 방식
자동 할당 방식은 IDENTITY, SEQUENCE 등 다양한 전략이 있어요. 그 이유는 데이터베이스 벤더마다 지원하는 방식이 다르기 때문이에요. 

예를 들어 오라클 데이터베이스는 시퀀스를 제공하지만, MySQL은 시퀀스를 제공하지 않아요.

```java
@Entity
@Table(name="USER")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String id;
    ...
}
```

위 방식은 IDENTITY 전략을 사용한 예시에요.

직접 할당 방식이라면 @Id 어노테이션만 있으면 되지만, 자동 할당 방식인 경우에는 @GeneratedValue 어노테이션을 사용하고 사용할 전략을 선택해야 해요.

### IDENTITY 전략
MySQL과 같이 AutoIncrement 기능을 제공하여, 기본 키 값을 자동으로 생성하는 DBMS에서 사용한다.

>  AutoIncrement는 데이터베이스에서 자동으로 기본 키 값을 생성해주는 것이에요. 
INSERT할 때마다 값이 자동으로 증가되며 할당돼요.

(주로 MySQL, PostgreSQL, SQL Server, ...에서 사용해요.)

IDENTITY 전략은 데이터를 데이터베이스에 INSERT한 후에 기본 키 값을 조회할 수 있어요. 따라서 엔티티에 식별자 값을 할당하려면 JPA는 추가로 데이터베이스를 조회해야 해요. 

하이버네이트는 데이터를 저장하면서 동시에 생성된 기본 키 값을 얻어올 수 있는 Statement.getGeneratedKeys()를 사용하여 데이터베이스와 한 번만 통신하도록 해요.

엔티티가 영속 상태가 되려면 식별자가 반드시 필요해요. 그런데 이 전략은 엔티티를 데이터베이스에 저장해야 식별자를 구할 수 있기 때문에 em.persist()를 호출하는 즉시 INSERT SQL이 데이터베이스에 전달돼요. 

**즉, 이 전략은 트랜잭션을 지원하는 쓰기 지연이 동작하지 않아요.**

### SEQUENCE 전략
데이터베이스 시퀀스는 유일한 값을 순서대로 생성하는 특별한 데이터베이스 오브젝트에요. 이 시퀀스를 사용하여 기본 키를 생성하는 전략이에요. 

(시퀀스를 지원하는 Oracle, PostgreSQL, H2 DB, ...에서 사용해요.)

시퀀스를 사용하기 위해서는 먼저 생성해야 해요.

```sql
CREATE SEQUENCE USER_SEQ WITH 1 INCREMENT BY 1;
```

그리고 생성한 시퀀스를 매핑해야 해요.

```java
@Entity
@SequenceGenerator(
    name = "USER_SEQ_GENERATOR",
    sequenceName = "USER_SEQ",
    initialValue = 1, allocationSize = 1)
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE,
    				generator = "USER_SEQ_GENERATOR")
    private String id;
    ...
}
```

@SequenceGenerator 어노테이션을 사용해서 USER_SEQ_GENERATOR라는 시퀀스 생성기를 등록했어요. 그리고 sequenceName 속성의 "USER_SEQ" 값을 통해 JPA는 실제 데이터베이스의 USER_SEQ 시퀀스와 매핑해요.

키 생성 전략을 GenerationType.SEQUENCE로 설정하고 방금 등록한 시퀀스 생성기를 선택했어요. 

이제 식별자 값은 USER_SEQ_GENERATOR 시퀀스 생성기가 자동으로 할당해요.

#### SEQUENCE 전략 최적화
SequenceGenerator.allocationSize의 기본값은 50이에요.

SEQUENCE 전략은 데이터베이스 시퀀스를 통해 식별자를 조회하는 추가 작업이 필요해요. 즉, 데이터베이스와 2번 통신해요.

1. 식별자를 구하기 위해 데이터베이스 시퀀스를 조회
2. 조회한 시퀀스를 기본 키 값으로 사용하여 데이터베이스에 저장

JPA는 시퀀스에 접근하는 1번 과정의 횟수를 줄이기 위해 allocationSize를 사용해요.

allocationSize가 기본값인 50이라면 시퀀스를 한 번에 50 증가시키고, 1부터 50까지는 메모리에서 식별자를 할당해요. 후에 51이 되면 시퀀스 값을 100으로 증가시킨 후 51부터 100까지 메모리에서 식별자를 할당하게 돼요.

그래서 데이터베이스에 직접 접근해서 데이터를 등록할 때 시퀀스 값이 한 번에 많이 증가한다고 해요. 이런 상황을 피하고 싶거나 INSERT 성능이 중요하지 않다면 allocationSize의 값을 1로 설정하면 돼요.

#### (궁금증) 메모리에 있을 때 꺼진다면?
allocationSize가 50이라면 처음 시퀀스가 증가할 때 50이 증가되고, 메모리에 1부터 50까지의 식별자가 올라간다고 했어요.

이때 서버가 다운된다면 메모리에 올라간 식별자 값이 사라지는 것인가?

답은 그렇다고 해요.

시퀀스 값은 메모리에 일시적으로 할당되어 있으며, 시퀀스 값이 데이터베이스에 기록되지 않은 상태에서 서버가 강제로 종료된다면 해당 메모리에 저장된 시퀀스 값은 소실될 가능성이 있다고 해요.

이를 해결하기 위해 시퀀스 값을 메모리 뿐만 아니라 데이터베이스에 기록하는 방법이나, 시퀀스 값을 로그에 기록하여 서버 재시작 시 시퀀스 값을 복구할 수 있는 방법을 고려할 수 있다고 해요. 
(어딘가에 쓰고 읽는 것도 리소스임을 알아야 해요.)

자신의 상황과 안정성, 성능 등을 비교하여 맞는 전략을 선택하는 것이 가장 바람직한 방법인 것 같아요.

### TABLE 전략
TABLE 전략은 키 생성 전용 테이블을 하나 만들고 여기에 이름과 값으로 사용할 컬럼을 만들어 데이터베이스 시퀀스와 유사한 방법이에요.

이 전략은 테이블을 사용하므로 벤더사와 관계없이 모든 데이터베이스에 적용할 수 있어요.

TABLE 전략을 사용하기 위해 먼저 키 생성 용도로 사용할 테이블을 만들어야 해요.

```sql
CREATE TABLE SEQUENCES (
	sequence_name varchar(255) not null,
    next_val bigint,
    primary key ( sequence_name )
)
```

sequence_name 컬럼을 시퀀스 이름으로 사용하고 next_val 컬럼을 시퀀스 값으로 사용해요.

```java
@Entity
@TableGenerator(
    name = "USER_SEQ_GENERATOR",
    table = "SEQUENCES",
    pkColumnValue = "USER_SEQ", allocationSize = 1)
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.TABLE,
    				generator = "USER_SEQ_GENERATOR")
    private String id;
    ...
}
```

@TableGenerator 어노테이션을 사용해서 USER_SEQ_GENERATOR라는 이름의 테이블 키 생성기를 등록해요. 그리고 방금 생성한 키 생성용 테이블인 SEQUENCES을 table로 사용해요.

키 생성 전략을 GenerationType.TABLE로 설정하고 방금 등록한 테이블 키 생성기를 선택했어요.

### AUTO 전략
데이터베이스의 종류도 많고 기본 키 생성 전략도 다양해요. 이 전략은 선택한 데이터베이스 방언에 따라 IDENTITY, SEQUENCE, TABLE 전략 중 하나를 자동으로 선택해요.

예를 들어 MySQL을 선택하면 IDENTITY 전략을 사용해요.

```java
@Entity
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private String id;
    ...
}
```

AUTO 전략의 장점은 데이터베이스가 변경되어도 코드를 수정할 필요가 없다는 것이에요. 특히 키 생성 전략이 확정되지 않은 초기 개발 단계일 때 편리하게 사용할 수 있어요.

SEQUENCE나 TABLE 전략이 선택되면 시퀀스나 키 생성용 테이블을 미리 만들어둬야 하는데, 스키마 자동 생성 기능을 사용한다면 하이버네이트가 기본값을 사용하여 적절한 시퀀스나 테이블을 만들어요.

![@GeneratedValue](/images/posts/jpa-entity-mapping/5adcf6b0_image.webp)

만약 strategy 속성을 지정하지 않는다면 기본값인 GenerationType.AUTO를 사용해요.


### 기본 키 매핑 정리
영속성 컨텍스트는 엔티티를 식별자 값으로 구분하기 때문에 엔티티를 영속 상태로 만들려면 식별자 값이 반드시 있어야 해요.

em.persist()를 호출한 후 발생하는 일을 전략별로 정리하면 다음과 같아요.

|전략|내용|
|--|---|
|직접 할당| em.persist() 호출 전 애플리케이션에서 직접 식별자 값을 할당해야 해요. 만약 식별자 값이 없으면 예외가 발생해요.|
|SEQUENCE|데이터베이스 시퀀스에서 식별자 값을 획득한 후 영속성 컨텍스트에 저장해요.|
|TABLE|데이터베이스 키 생성용 테이블에서 식별자 값을 획득한 후 영속성 컨텍스트에 저장해요.|
|IDENTITY|데이터베이스에 엔티티를 저장해서 식별자 값을 획득한 후 영속성 컨텍스트에 저장해요. (테이블에 데이터를 저장해야 식별자 값을 획득할 수 있어요.)|

</br>

## 필드와 컬럼 매핑
|어노테이션|설명|
|--|---|
|@Column|컬럼을 매핑해요.|
|@Enumerated|자바의 enum 타입을 매핑해요.|
|@Temporal|날짜 타입을 매핑해요.|
|@Lob|BLOB, CLOB 타입을 매핑해요.|
|@Transient|특정 필드를 데이터베이스에 매핑하지 않을 때 사용해요.|
|@Access|JPA가 엔티티에 접근하는 방식을 지정해요.|

### @Column
객체 필드를 테이블 컬럼에 매핑하는 어노테이션이에요.

속성 중에서는 name, nullable을 주로 사용해요.

|속성|기능|
|--|---|
|name|필드와 매핑할 테이블의 컬럼 이름 (기본값은 객체의 필드명이에요.)|
|nullable|null 값의 허용 여부를 설정해요. false로 설정하면 DDL 생성 시에 not null 제약조건이 추가돼요.|
|unique|한 컬럼에 간단히 유니크 제약조건을 걸 때 사용해요. 만약 두 컬럼 이상을 사용해서 유니크 제약조건을 사용하려면 클래스 레벨에서 @Table.uniqueConstraints를 사용해야 해요.|
|length|문자 길이 제약조건이에요. (String 타입에만 사용해요.)|

이외에도 다른 속성들이 존재해요.

![@Column](/images/posts/jpa-entity-mapping/850acf2f_image.webp)

여러 속성과 기본값들이 정의되어 있어요.

#### 주의사항
```java
int data; // @Column 생략, 자바 기본 타입
data integer not null // 생성된 DDL
```

```java
Integer data; // @Column 생략, 객체 타입
data integer // 생성된 DDL
```

@Column 어노테이션을 생략하면 대부분 속성들의 기본값이 적용되지만, 자바 기본 타입일 때는 nullable 속성이 false로 설정되는 예외가 있어요.

자바 기본 타입에는 null 값을 입력할 수 없고, 객체 타입일 때만 null 값이 허용되기 때문에 JPA는 이런 상황을 고려하여 기본 타입일 때는 not null 제약조건을 추가해줘요.

```java
@Column
int data; // @Column 생략, 자바 기본 타입
data integer // 생성된 DDL
```

하지만 위 코드처럼 어노테이션을 사용하고 속성을 지정하지 않으면, nullable = true가 기본값이기 때문에 not null 제약조건을 설정하지 않아요.

**즉, 자바 기본 타입에 @Column 어노테이션을 사용한다면 nullable = false로 지정하는 것이 안전해요.**

### @Enumerated
자바의 enum 타입을 매핑할 때 사용해요.

value 속성에는 아래의 타입들이 있어요.
- EnumType.ORDINAL: enum 순서를 데이터베이스에 저장해요.
- EnumType.STRING: enum 이름을 데이터베이스에 저장해요.

```java
// enum 클래스
enum RoleType {
	ADMIN, MEMBER
}

// User 엔티티 클래스의 RoleType 필드
// enum 이름으로 매핑하는 방법이에요.
@Enumerated(value = EnumType.STRING)
private RoleType roleType;

// enum 사용 방법이에요.
user.setRoleType(RoleType.ADMIN); // 데이터베이스에 문자 ADMIN으로 저장해요.
```

@Enumerated 어노테이션을 이용하여 enum 타입을 데이터베이스에 저장할 수 있어요.

EnumType.ORDINAL로 지정했다면, enum에 정의된 순서대로 ADMIN은 0, USER는 1 값이 데이터베이스에 저장돼요.

|타입|장점|단점|
|--|--|--|
|EnumType.ORDINAL|데이터베이스에 저장되는 데이터 크기가 작아요.|이미 저장된 enum의 순서를 변경할 수 없어요.|
|EnumType.STRING|저장된 enum의 순서가 바뀌거나 enum이 추가되어도 안전해요.|데이터베이스에 저장되는 데이터 크기가 ORDINAL에 비해서 커요.|

저는 enum 클래스의 정의된 내용이나 순서가 언제든 바뀔 수 있다고 생각하기 때문에 대부분 EnumType.STRING을 사용했어요.

### @Temporal
java.util.Date, java.util.Calendar와 같은 날짜 타입을 매핑할 때 사용해요.

value 속성에는 아래의 타입들이 있어요. (필수로 지정해야 해요.)
- TemporalType.DATE: 날짜, 데이터베이스 date 타입과 매핑해요. (예: 2023-07-24)
- TemporalType.TIME: 시간, 데이터베이스 time 타입과 매핑해요. (예: 10:11:11)
- TemporalType.TIMESTAMP: 날짜와 시간, 데이터베이스 timestamp 타입과 매핑해요. (예: 2023-07-24 10:11:11)

@Temporal을 생략하면 자바의 Date와 가장 유사한 timestamp로 정의돼요.

timestamp 대신에 datetime을 예악어로 사용하는 데이터베이스도 있지만, 데이터베이스 방언 덕분에 애플리케이션 코드는 변경하지 않아도 돼요.

### @LOB
데이터베이스 BLOB, CLOB 타입과 매핑해요.

@LOB 어노테이션에는 지정할 수 있는 속성이 없어요.
필드 타입이 문자열이면 CLOB, 나머지는 BLOB으로 매핑돼요.

### @Transient
이 어노테이션은 매핑 용도가 아니에요. 객체에 임시로 어떤 값을 보관하고 싶을 때 사용해요.

@Transient 사용하면 데이터베이스에 저장하지 않고 조회하지도 않아요.

### @Access
JPA가 엔티티 데이터에 접근하는 방식을 지정해요.

사용할 수 있는 속성은 아래와 같아요.
- AccessType.FIELD: 필드에 직접 접근해요. (private이라도 접근 가능해요.)
- AccessType.PROPERTY: Getter를 사용해요.

</br>

## 마무리
객체와 테이블 매핑, 스키마 자동 생성 기능, 기본 키 매핑, 필드와 컬럼 매핑 등을 공부했어요.

저는 데이터베이스 스키마 자동 생성 기능을 제일 유용하게 쓰고 있어요. 엔티티 클래스 정의와 약간의 어노테이션만 사용하면 테이블을 생성할 수 있어서 엄청 편리하기 때문이에요. 

하지만 완벽한 기능은 아니기에 의존하지 않고 직접 테이블을 설계해보고 매핑하는 경험도 중요할 것 같아요.

객체지향과 관계형 데이터베이스의 개념을 익히고 이 둘을 연결해야 하는 과정이다 보니 많은 공부가 필요할 것 같아요.

결국 서로 다른 무언가를 연결하여 사용하는 방법이기 때문에 자신이 작성한 코드가 반대편에서 어떻게 작용하는지 살펴보면서 공부하면 많은 도움이 될 것 같아요.

### 참고 자료
[자바 ORM 표준 JPA 프로그래밍, 김영한](https://product.kyobobook.co.kr/detail/S000000935744)
[Spring Data JPA](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
