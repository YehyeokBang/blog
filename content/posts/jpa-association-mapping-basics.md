---
title: '[JPA] 연관관계 매핑 기초'
date: '2023-08-15T00:00:00Z'
tags:
  - JPA
  - Spring Data JPA
  - Backend
  - Database
description: 'JPA의 연관관계 매핑 기초인 단방향 및 양방향 연관관계, 연관관계의 주인 설정 등에 대해 정리한 글입니다.'
---
## Spring Data JPA
제가 Spring Data JPA를 배우고 기록하게 된 [계기](https://velog.io/@hyeok_1212/JPA-%EC%98%81%EC%86%8D%EC%84%B1-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8)입니다.

## 연관관계
엔티티들은 대부분 다른 엔티티와 연관관계가 있어요. 

예를 들어 주문 엔티티는 어떤 상품을 주문했는지 알기 위해 상품 엔티티와 연관관계가 존재하고,
상품 엔티티는 카테고리, 재고 등 또 다른 엔티티와 관계를 맺고 있어요.

객체는 **참조**를 사용해서 관계를 맺고,
테이블은 **외래 키**를 사용해서 관계를 맺어요.

이 둘은 완전히 다른 특징을 가지기 때문에 ORM에서 가장 어려운 부분이 
바로 객체 연관관계와 테이블 연관관계를 매핑하는 일이라고 해요.

### 방향
단방향 또는 양방향이 존재해요. 

예를 들어 주문과 상품의 관계가 있을 때 
(주문 → 상품) 또는 (상품 → 주문) 둘 중 한 쪽만 참조하면 단방향, 양쪽 모두 서로 참조하면 양방향이에요.

방향은 객체 관계에만 존재하고, 테이블 관계는 항상 양방향이에요.

### 다중성
다대일(N:1), 일대다(1:N), 다대다(N:M), 일대일(1:1)이 존재해요.

예를 들어 학생과 학과 관계가 있을 때
한 명의 학생은 하나의 학과에만 소속될 수 있으며,
하나의 학과는 여러 학생들이 소속될 수 있기 때문에 다대일(N:1) 관계에요.
반대로 학과와 학생 관계로보면 일대다(1:N) 관계에요.

### 연관관계의 주인
객체를 양방향 연관관계로 만들기 위해서는 연관관계의 주인을 정해야 해요.


</br>

## 단방향 연관관계
다대일(N:1) 단방향 관계를 먼저 알아볼게요.

- 학생과 학과가 있어요.
- 학생은 하나의 학과에만 소속될 수 있어요.
- 학생은 학과와 다대일(N:1)

![연관관계](/images/posts/jpa-association-mapping-basics/e3ee7250_image.webp)

위는 객체 연관관계를 나타내고, 아래는 테이블 연관관계를 나타내요.

### 객체 연관관계
- 학생 객체는 Student.department 필드로 학과 객체와 연관관계를 맺어요.
- 학생 객체와 학과 객체는 단방향 관계에요.
- 학생은 Student.department 필드를 사용해서 학과를 알 수 있지만
반대로 학과는 학생을 알 수 없어요.

### 테이블 연관관계
- 학생 테이블은 DEPARTMENT_ID 외래 키로 학과 테이블과 연관관계를 맺어요.
- 학생 테이블과 학과 테이블은 양방향 관계에요.
- 학생 테이블의 DEPARTMENT_ID 외래 키를 사용해서 학생과 학과를 조인할 수 있고,
반대로 학과와 학생을 조인할 수 있어요.

~~~sql
# 학생과 학과를 조인하는 SQL
SELECT *
FROM STUDENT S JOIN DEPARTMENT D 
		ON S.DEPARTMENT_ID = D.DEPARTMENT_ID;

# 학과와 학생을 조인하는 SQL
SELECT *
FROM DEPARTMENT D JOIN STUDENT S 
		ON D.DEPARTMENT_ID = S.DEPARTMENT_ID;
~~~

### 차이점
참조를 통한 연관관계는 항상 단방향이에요.

객체간의 연관관계를 양방향으로 만들려면 반대쪽에도 필드를 추가해서 참조를 보관해야 해요.
즉, 단방향 연관관계를 하나 더 만들어야 해요.

엄밀히 말하면 이것은 양방향 관계가 아니라 **서로 다른 단방향 관계 2개**에요.

하지만 테이블은 외래 키 하나로 양방향으로 조인할 수 있어요.

이제 이 두 연관관계의 예제를 보고 둘을 매핑해보려고 해요.

### 객체 연관관계 예제
아래 코드는 JPA를 사용하지 않은 순수한 학생과 학과 클래스의 코드에요.
~~~java
public class Student {
	
    private String id;
    private String studentName;
    private String studentNo;
    
    private Department department; // 학과의 참조를 보관
    
    public void setDepartment(Department department) {
    	this.department = department;
    }
    
    ... // getter, setter, ..
}

public class Department {
	
    private String id;
    private String name;
    
    ... // getter, setter, ..
}
~~~

아래는 학생1과 학생2를 학과1에 소속시키는 코드에요.
~~~java
public static void main(String[] args) {
	
    Student student1 = new Student("student1", "홍길동", "202312345");
    Student student2 = new Student("student2", "이순신", "202300123");
    Department department1 = new Department("department1", "경제학과");
    
    student1.setDepartment(department1);
    student2.setDepartment(department1);
    
    Department findDepartment = student1.getDepartment();
    
}
~~~

![객체 단방향 다대일 인스턴스](/images/posts/jpa-association-mapping-basics/44135977_image.webp)

학생1과 학생2는 학과1에 소속했음을 알 수 있어요.
그리고 아래와 같은 코드로 회원1이 속한 학과1을 조회할 수 있어요.
~~~java
Department findDepartment = student1.getDepartment();
~~~
이렇게 객체는 참조를 사용하여 연관관계를 탐색할 수 있는데, 이를 **객체 그래프 탐색**이라고 해요.

### 테이블 연관관계 예제
데이터베이스 테이블의 학생과 학과의 관계를 살펴보기 위해 
학생 테이블과 학과 테이블의 DDL을 먼저 살펴볼게요.

~~~sql
CREATE TABLE STUDENT (
	STUDENT_ID VARCHAR(255) NOT NULL,
    DEPARTMENT_ID VARCHAR(255),
    STUDENT_NAME VARCHAR(255),
    STUDENT_NO VARCHAR(255),
    PRIMARY KEY (STUDENT_ID)
)

CREATE TABLE DEPARTMENT (
	DEPARTMENT_ID VARCHAR(255) NOT NULL,
    NAME VARCHAR(255),
    PRIMARY KEY (DEPARTMENT_ID)
)

ALTER TABLE STUDENT ADD CONSTRAINT FK_STUDENT_DEPARTMENT
	FOREIGN KEY (DEPARTMENT_ID)
    REFERENCES DEPARTMENT
~~~

테이블을 만든 후 학생 테이블의 DEPARTMENT_ID에 외래 키 제약조건을 설정했어요.

~~~sql
INSERT INTO DEPARTMENT(DEPARTMENT_ID, NAME)
VALUES('department1', '경제학과');

INSERT INTO STUDENT(STUDENT_ID, DEPARTMENT_ID, STUDENT_NAME, STUDENT_NO)
VALUES('student1', 'department1', '홍길동', '202312345');

INSERT INTO STUDENT(STUDENT_ID, DEPARTMENT_ID, STUDENT_NAME, STUDENT_NO)
VALUES('student2', 'department1', '이순신', '202300123');
~~~

위 SQL을 실행하면 학생1과 학생2를 학과1에 소속시켜요.

~~~sql
# 학생1이 소속된 학과를 조회해요.
SELECT D.*
FROM STUDENT S JOIN DEPARTMENT D
		ON S.DEPARTMENT_ID = D.DEPARTMENT_ID
WHERE S.STUDENT_ID = 'student1';
~~~

위 SQL처럼 데이터베이스는 외래 키를 사용해서 연관관계를 탐색할 수 있어요.

### 객체 관계 매핑 
지금까지 객체만 사용한 연관관계와 테이블만 사용한 연관관계를 각각 알아보았어요.

이제 JPA를 사용해서 이 둘을 매핑해보려고 해요.

~~~java
@Entity
public class Student {
	
    @Id
    @Column(name="STUDENT_ID")
    private String id;
    
    @Column(name="STUDENT_NAME")
    private String studentName;
    
    @Column(name="STUDENT_NO")
    private String studentNo;
    
    // 연관관계 매핑
    @ManyToOne
    @JoinColumn(name="DEPARTMENT_ID")
    private Department department;
    
    // 연관관계 설정
    public void setDepartment(Department department) {
    	this.department = department;
    }
    
    ... // getter, setter, ..
}

@Entity
public class Department {
	
    @Id
    @Column(name="DEPARTMENT_ID")
    private String id;
    
    private String name;
    
    ... // getter, setter, ..
}
~~~

학생 엔티티와 학과 엔티티를 매핑하고 연관관계를 매핑했어요.

~~~java
@ManyToOne
@JoinColumn(name="DEPARTMENT_ID")
private Department department;
~~~

연관관계 매핑 부분을 보면
학생 객체의 Student.department 필드를 사용하고,
학생 테이블의 STUDENT.DEPARTMENT_ID 외래 키 컬럼을 사용했어요.

이때 연관관계를 매핑하기 위해 사용하는 어노테이션들을 살펴볼게요.

|어노테이션|설명|
|--|----|
|@ManyToOne|다중성, 다대일(N:1) 관계라는 매핑 정보에요. 연관관계를 매핑할 때 다중성을 나타내는 어노테이션은 필수로 사용해야 해요.|
|@JoinColumn|외래 키를 매핑할 때 사용해요. name 속성에 매핑할 외래 키 이름을 지정해요. 이 어노테이션을 생략할 수 있어요.|

@JoinColumn을 생략한 경우에는 다음과 같이 기본 전략을 사용해요.
```java
@ManyToOne
private Department department;
```

"필드명" + _ + "참조하는 테이블의 컬럼명"
예를 들어 위 코드에서는 department_DEPARTMENT_ID 외래 키를 사용해요.

</br>

## 연관관계 사용
CRUD 예제를 통해 연관관계를 어떻게 사용하는지 알아볼게요.

### 저장
연관관계를 매핑한 엔티티를 어떻게 저장할까요?
~~~java
public void testSave() {
	
    // 학과1 저장
    Department department1 = new Department("department1", "경제학과");
    em.persist(department1);
    
    // 학생1 저장
    Student student1 = new Student("student1", "department1", "202312345");
    student1.setDepartment(department1); // 연관관계 설정 (student1 → department1);
    em.persist(student1);
    
    // 학생2 저장
    Student student2 = new Student("student2", "department1", "202300123");
    student2.setDepartment(department1); // 연관관계 설정 (student2 → department1);
    em.persist(student2);

}
~~~

JPA에서 엔티티를 저장할 때 연관된 모든 엔티티는 영속 상태여야 해요.

~~~java
student1.setDepartment(department1); // 연관관계 설정 (student1 → department1);
em.persist(student1);
~~~

학생 엔티티는 학과 엔티티를 참조하고 저장했어요.
JPA는 참조한 학과의 식별자를 외래 키로 사용해서 적절한 등록 쿼리를 생성해요.

### 조회
연관관계가 있는 엔티티를 조회하는 방법은 크게 2가지에요.
- 객체 그래프 탐색 (연관관계를 사용한 조회)
- 객체지향 쿼리 사용 (JPQL)

#### 객체 그래프 탐색
```java
Student findStudent = em.find(Student.class, "student1");
Department department = findStudent.getDepartment(); // 객체 그래프 탐색
```
객체를 통해 연관된 엔티티를 조회하는 것을 말해요.

#### 객체지향 쿼리 사용
```java
private static void queryLogicJoin(EntityManager em) {
	
    String jpql = "select s from Student s join s.department d where " +
		"d.name=:departmentName";
        
    List<Student> resultList = em.createQuery(jpql, Student.class)
    	.setParameter("departmentName", "경제학과")
        .getResultList();
        
    for (Student student : resultList) {
    	System.out.println("[query] student.studentName=" +
			student.getStudentName());
    }
}

/*
 * 결과: [query] student.studentName=홍길동
 * 결과: [query] student.studentName=이순신
*/
```
JPQL의 from Student s join s.department d 부분을 보면 
학생이 학과와 관계를 가지고 있는 필드를 통해서 Student와 Department를 조인했어요.

또한, where 절에서 경제학과에 속한 학생만 검색했어요.

### 수정
경제학과 소속이던 학생을 체육학과에 소속하도록 수정해볼게요.

```java
private static void updateRelation(EntityManager em) {
	
    // 새로운 학과, 체육학과
    Department department2 = new Department("department2", "체육학과");
    
    Student findStudent = em.find(Student.class, "student1");
    findStudent.setDepartment(department2); // 연관관계 수정
    
}
```

이렇게 엔티티 값을 수정하고 트랜잭션이 커밋되면 플러시가 자동으로 일어나면서
더티체킹 기능이 작동하여 변경사항이 데이터베이스에 자동으로 반영돼요.

### 제거
이번엔 체육학과 소속으로 변경된 홍길동 학생이 어느 학과에도 소속되지 않도록 연관관계를 제거해볼게요.
```java
// 학과가 없는 학생은 있을 수 없지만, 연관관계 제거 예제를 위해 0 아니면 1로 설정했어요.
private static void deleteRelation(EntityManager em) {
	
    Student findStudent = em.find(Student.class, "student1");
    findStudent.setDepartment(null); // 연관관계 제거
    
}
```

### 주의사항
연관된 엔티티를 삭제하려면 위 코드처럼 연관관계를 먼저 제거하고 삭제해야 해요.
외래 키 제약조건으로 인해, 데이터베이스에서 오류가 발생하기 때문이에요.

</br>

## 양방향 연관관계
학생에서 학과로만 접근하는 다대일 단방향 매핑을 알아봤어요.
이제는 학과에서 학생으로 접근하는 관계를 추가해서 알아보려고 해요.

![양방향 연관관계](/images/posts/jpa-association-mapping-basics/9617ecee_image.webp)

### 객체 연관관계
먼저 객체 연관관계에서는 학생과 학과는 다대일 관계에요.
반대로 학과에서 학생은 일대다 관계에요.

일대다 관계는 여러 건과 연관관계를 맺을 수 있으므로 컬렉션을 사용했어요.

- 학생 → 학과 (Student.department)
- 학과 → 학생 (Department.students)

### 테이블 연관관계
테이블의 관계는 이미 양방향이었기 때문에 추가할 부분이 없어요.

외래 키를 사용하면 양방향으로 조인이 가능해요.

### 양방향 연관관계 매핑
이미 연관관계를 매핑했던 학생 엔티티에서는 변경되는 부분이 없어요.
```java
@Entity
public class Student {
	
    @Id
    @Column(name="STUDENT_ID")
    private String id;
    
    @Column(name="STUDENT_NAME")
    private String studentName;
    
    @Column(name="STUDENT_NO")
    private String studentNo;
    
    // 연관관계 매핑
    @ManyToOne
    @JoinColumn(name="DEPARTMENT_ID")
    private Department department;
    
    // 연관관계 설정
    public void setDepartment(Department department) {
    	this.department = department;
    }
    
    ... // getter, setter, ..
}

@Entity
public class Department {
	
    @Id
    @Column(name="DEPARTMENT_ID")
    private String id;
    
    private String name;
    
    // 추가된 부분
    @OneToMany(mappedBy="department")
    private List<Student> students = new ArrayList<>();
    
    ... // getter, setter, ..
}
```

학과와 학생은 일대다 관계에요.
따라서 학과 엔티티에 컬렉션인 List&lt;Student&gt; students를 추가했어요.

일대다 관계를 매핑하기 위해 @OneToMany를 사용했어요.

mappedBy 속성은 양방향 매핑일 때 사용하고, 
반대쪽 매핑의 필드 이름을 값으로 입력하면 돼요.

이렇게 하면 학과에서 학생 컬렉션으로 객체 그래프 탐색할 수 있게 돼요.

#### 일대다 컬렉션 조회
학과에서 학생 컬렉션으로 객체 그래프 탐색을 사용해서 조회한 학생들의 이름을 출력하는 코드에요.
```java
public void biDirection() {
	
    Department findDepartment = em.find(Department.class, "department1");
    List<Student> students = findDepartment.getStudents(); // 객체 그래프 탐색
    
    for (Student student : students) {
    	System.out.println("students.studentName = " + 
        	student.getStudentName());
    }
}

/*
 * 결과
 * students.studentName = 홍길동
 * students.studentName = 이순신
 */ 
```

### 연관관계의 주인
mappedBy 속성은 왜 필요한 것일까?

여기서 알아야 할 부분은 **객체에는 양방향 연관관계라는 것이 없다**는 것이에요.

객체의 연관관계는 아래와 같아요.
- 학생 → 학과 (단방향)
- 학과 → 학생 (단방향)

테이블 연관관계는 아래와 같아요.
- 학생 ↔ 학과 (양방향)

객체에는 양방향 연관관계라는 것이 없기 때문에
두 개의 단방향 연관관계를 애플리케이션 로직으로
잘 묶어서 양방향인 것처럼 보이게 하는 것이에요.

하지만 테이블은 외래 키 하나로 두 테이블의 연관관계를 관리해요.

엔티티를 단방향으로 매핑하면 참조를 하나만 사용하므로 이 참조로 외래 키를 관리하면 되지만,
양방향으로 매핑하면 학생 → 학과, 학과 → 학생 두 방향에서 참조할 수 있어요.

**참조는 둘인데, 외래 키는 하나인 상황이 발생해요.**
그러면 어떤 관계를 사용해서 외래 키 관리해야 할까요?

이런 차이를 극복하기 위해 JPA에서는 두 객체 연관관계 중 하나를 정해서
테이블의 외래 키를 관리하는데, 이것을 **연관관계의 주인**이라고 해요.

### 양방향 매핑의 규칙
첫 번째, 양방향 매핑 시 두 연관관계 중 하나를 연관관계의 주인으로 정해야 해요.

연관관계의 주인만이 데이터베이스 연관관계와 매핑되며,
외래 키를 관리(등록, 수정, 삭제)할 수 있어요.

반면에 주인이 아닌 쪽은 읽기만 가능해요.

- 주인은 mappedBy 속성을 사용하지 않아요.
- 주인이 아니면 mappedBy 속성을 사용해서 속성의 값으로 연관관계의 주인을 지정해야 해요.

**연관관계의 주인을 정한다는 것은 외래 키 관리자를 정한다는 말이에요.**

</br>

두 번째, 연관관계의 주인은 외래 키가 있는 곳으로 정해야 해요.

아래에서는 학생 테이블이 외래 키를 가지고 있으므로 Student.department가 주인이 돼요.

주인이 아닌 Department.students에는 mappedBy 속성을 사용해서 주인이 아님을 설정해요.
mappedBy 속성의 값으로는 연관관계의 주인인 department를 사용하면 돼요.

```java
// 학생 → 학과
public class Student {
	
    @ManyToOne
    @JoinColumn(name="DEPARTMENT_ID")
    private Department department;
    
    ...
}

// 학과 → 학생
public class Department {

	@OneToMany(mappedBy="department")
    private List<Student> students = new ArrayList<>();
    
    ...
}                        
```

![연관관계의 주인과 반대편](/images/posts/jpa-association-mapping-basics/cbc3d56a_image.webp)

연관관계의 주인만 데이터베이스 연관관계와 매핑되고 외래 키를 관리할 수 있어요.

주인이 아닌 반대편은 읽기만 가능하고 외래 키를 변경할 수 없어요.

#### 참고
데이터베이스 테이블의 다대일, 일대다 관계에서는 항상 다 쪽이 외래 키를 가져요.
@ManyToOne은 항상 연관관계의 주인이 되므로 mappedBy 속성을 설정할 수 없어요.

</br>

## 양방향 연관관계 저장
양방향 연관관계를 사용해서 학과1, 학생1, 학생2를 저장해보려고 해요.

```java
public void testSave() {
    
    // 학과1, 경제학과 저장
    Department department1 = new Department("department1", "경제학과");
    em.persist(department1);
    
    // 학생1, 홍길동 저장
    Student student1 = new Student("student1", "홍길동", "202312345");
    student1.setDepartment(department1); // 연관관계 설정
    em.persist(student1);
    
    // 학생2, 이순신 저장
    Student student2 = new Student("student2", "이순신", "202300123");
    student2.setDepartment(department1); // 연관관계 설정
    em.persist(student2);
    
}
```

먼저 데이터베이스에서 회원 테이블을 조회하면 결과는 아래와 같아요.

```sql
SELECT * FROM STUDENT;
```

|STUDENT_ID|STUDENT_NAME|STUDENT_NO|DEPARTMENT_ID|
|--|--|--|--|
|student1|홍길동|202312345|department1|
|student2|이순신|202300123|department1|

DEPARTMENT_ID 외래 키에 학과의 기본 키 값이 저장되어 있어요.

```java
// 연관관계의 주인이기 때문에 입력된 값을 사용해서 외래 키를 관리해요.
student1.setDepartment(department1);

// 연관관계의 주인이 아니기 때문에 입력된 값이 외래 키에 영향을 주지 않아요.
department1.getStudents().add(student1);
```

Student.department는 연관관계의 주인이에요.
엔티티 매니저는 이곳에 입력된 값을 사용해서 외래 키를 관리해요.

</br>

## 양방향 연관관계의 주의점
가장 흔히 하는 실수는 연관관계의 주인에는 값을 입력하지 않고
주인이 아닌 곳에만 값을 입력하는 것이에요.

데이터베이스에 외래 키 값이 정상적으로 작동되지 않는다면 이것부터 확인해야 해요.

```java
public void testSaveNonOwner() {
	
    // 학생1, 홍길동 저장
	Student student1 = new Student("student1", "홍길동", "202312345");
    em.persist(student1);
    
    // 학생2, 이순신 저장
    Student student2 = new Student("student2", "이순신", "202300123");
    em.persist(student2);
    
    // 학과1, 경제학과 저장
    Department department1 = new Department("department1", "경제학과");
    
    // 주인이 아닌 곳, 연관관계 설정
    department1.getStudents().add(student1);
    department1.getStudents().add(student2);
    
    em.persist(department1);
    
}
```

학생1, 학생2를 저장하고 학과의 컬렉션(students)에 추가 후 저장했어요.

데이터베이스에서 회원 테이블을 조회하면 결과는 아래와 같아요.

```sql
SELECT * FROM STUDENT;
```

|STUDENT_ID|STUDENT_NAME|STUDENT_NO|DEPARTMENT_ID|
|--|--|--|--|
|student1|홍길동|202312345|null|
|student2|이순신|202300123|null|

외래 키 DEPARTMENT_ID에 null 값이 입력되어 있는 것을 볼 수 있어요.
연관관계의 주인이 아닌 Department.students에만 값을 저장했기 때문이에요.

**즉, 연관관계의 주인만이 외래 키의 값을 변경할 수 있어요.**

### 그렇다면 연관관계의 주인에만 값을 저장할까?
연관관계의 주인만이 외래 키의 값을 변경할 수 있으니까 주인에만 값을 저장하면 될까요?

사실 **객체 관점에서는 양쪽 방향 모두 값을 입력해주는 것이 가장 안전해요.**

양쪽 방향 모두 값을 입력하지 않으면 JPA를 사용하지 않는 순수한 객체 상태에서 큰 문제가 발생할 수 있어요.

```java
student1.setDepartment(department1); // 연관관계의 주인, 외래 키 변경
department1.getStudents().add(student1); // 주인이 아니기에 저장에 사용되지 않아요.
```

순수한 객체 상태에서도 동작하며, 테이블의 외래 키도 정상적으로 입력될 수 있도록
양쪽 모두 값을 저장하여 관계를 맺어주는 것이 안전해요.

### 연관관계 편의 메소드
양방향 연관관계는 결국 양쪽 모두 신경써야 해요.

위 코드처럼 주인, 주인이 아닌 곳 모두 직접 호출하다 보면 
한 쪽만 호출하는 실수를 해서 양방향이 깨질 수도 있어요.

양방향 관계에서는 두 호출은 하나처럼 사용하는 것이 안전해요.

```java
public class Student {

	private Department department;
    
    public void setDepartment(Department newDepartment) {
    	this.department = newDepartment;
        newDepartment.getStudents().add(this);
    }
}
```

setDepartment() 메소드 하나로 양방향 관계를 모두 설정하도록 변경한 것이에요.
이렇게 설정해둔 메소드를 연관관계 편의 메소드라고 해요.

연관관계 편의 메소드를 설정하면 실수도 줄어들고 간단하게 양방향 연관관계를 설정할 수 있어요.

#### 주의사항
사실 위에서 만든 setDepartment() 메소드에는 버그가 있어요.

```java
student1.setDepartment(department1);
student1.setDepartment(department2);
Student findStudent = department1.getStudent();
```

학생1이 소속된 학과를 학과1로 설정했다가 학과2로 다시 설정한 후
학과1에 소속된 학생을 찾으면 여전히 학생1이 조회되는 버그에요.

즉 이전 연관관계가 사라지지 않은 것이에요.

```java
// 첫 번째 코드가 실행되면 아래와 같은 연관관계를 가져요.
student1.setDepartment(department1);
```
![](/images/posts/jpa-association-mapping-basics/4b464890_image.webp)

학생1은 학과1에 소속되어 있으며 학과1에 소속된 학생은 학생1이 있는 상태에요.

```java
// 두 번째 코드가 실행되면 아래와 같은 연관관계를 가져요.
student1.setDepartment(department2);
```
![](/images/posts/jpa-association-mapping-basics/7c7d0b35_image.webp)

학과1에서 학과2로 변경할 때 기존 학과1 → 학생1 관계가 제거되지 않았어요.

이 버그를 해결하기 위해서는 기존 소속된 학과가 있으면
기존 학과와 학생의 연관관계를 제거하는 코드를 추가해야 해요.

```java
public class Student {

	private Department department;
    
    // 수정된 메소드
    public void setDepartment(Department newDepartment) {
    	// 기존 학과가 있다면 연관관계를 제거
    	if (this.department != null) {
        	this.department.getStudents().remove(this);
        }
    	this.department = newDepartment;
        newDepartment.getStudents().add(this);
    }
}
```

변경된 연관관계는 제거하는 것이 안전해요.

이 메소드만 보더라도 서로 다른 단방향 연관관계 2개를
양방향 관계처럼 보이게 하는 일이 많은 고민이 필요한 일인지 알 수 있어요.

</br>

## 정리
단방향 매핑에 비해 양방향 매핑은 꽤 복잡해요.

- 연관관계의 주인 정하기
- 양방향 관계처럼 보이기 위한 로직 추가

위와 같은 작업을 통해 얻은 것은 주인이 아닌 연관관계를 하나 얻고
그것을 통해 반대 방향으로 객체 그래프 탐색이 가능해진 것이에요.

위에서 공부한 것처럼 양방향 매핑은 복잡하기 때문에
반대 뱡향으로 객체 그래프 탐색 기능이 필요하다면
양방향 관계를 추가해도 되기 때문에 우선 단방향 매핑을 사용하는 것이 좋은 것 같아요.

잊지 말아야 할 내용은
> 연관관계의 주인은 비즈니스 중요도가 아닌 외래 키의 위치와 관련해서 정해야 한다는 것이에요.

</br>

## 마무리
단방향 연관관계와 양방향 연관관계에 대해 공부했어요.
특히 객체의 입장과 테이블의 입장에서 바라보는 연관관계를 중점으로 배웠어요.

이 내용을 공부하기 전에는 항상 양방향 매핑을 사용하여 엔티티를 구성했어요.

양쪽 방향에서 객체 그래프 탐색 기능을 사용할 수 있는 것이
서비스 로직을 구성할 때 편했기 때문이에요.

편한 서비스 로직 구성을 위해 항상 양방향 매핑을 사용했다는 것은
제가 객체와 테이블 연관관계 매핑에 대한 이해가 부족했으며
그로 인해 데이터베이스, 엔티티 설계 부분이 부족했음을 이야기하는 것 같아요.

엔티티를 설계할 때 객체의 입장과 테이블의 입장을 모두 생각하는 시간을 가지며
JPA를 JPA답게 사용하기 위해 노력하려고 해요.

추가로 순수 객체 상태일 때의 문제라던가 잘못된 주인 설정으로
성능 문제가 발생할 수 있다는 것도 알게 되었어요.

### 참고 자료
[자바 ORM 표준 JPA 프로그래밍, 김영한](https://product.kyobobook.co.kr/detail/S000000935744)
[Spring Data JPA](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
