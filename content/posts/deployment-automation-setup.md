---
title: "배포 자동화가 필요해요"
date: "2024-09-21"
description: "개발 환경의 배포 자동화를 구축하게 된 계기와 AWS EC2 기반의 서버 배포, Docker를 활용한 컨테이너화 결정, GitHub Actions와 보안성이 높은 Self-Hosted Runner를 활용한 안전한 배포 파이프라인 구성 방법, 그리고 리버스 프록시 및 로드밸런서로 도입한 Traefik(트래픽)의 자동 구성 실무를 정리합니다."
tags: ["CI/CD", "AWS", "Docker", "GitHub Actions", "Traefik", "Infrastructure"]
---

이번 글에서는 상황에 맞게 선택한 자동 배포 파이프라인에 대해 기록하려고 해요.

# 왜 배포할까?

아무리 좋은 프로그램을 만들어도 사용자들이 그것을 접할 수 없다면 의미가 없어요. 따라서 배포는 단순히 코드를 실행 가능한 상태로 변환하는 것을 넘어, `언제 어디서나 안정적으로` 접속할 수 있는 컴퓨터(서버)를 준비하고, 애플리케이션을 그 서버에서 실행시켜 `사용자들이 접근할 수 있도록` 하는 과정이에요.

## 그럼 자동 배포는?

자동 배포가 필요한 가장 큰 이유는 `개발 생산성을 향상 시키는 것`이에요. 

수동으로 배포를 진행하는 경우 매번 코드 수정 후 빌드, 테스트, 배포 과정을 반복해야 해요. 이는 시간이 많이 소요되고, 사람이 개입하는 과정에서 `휴먼 에러가 발생할 가능성도 높아져요.`

자동 배포 파이프라인을 구축하면 귀찮은 작업과 위험을 크게 줄일 수 있어요. 코드가 변경될 때마다 자동으로 빌드되고, 배포까지 이루어지기 때문에 개발자는 애플리케이션 `로직 구현에 집중`할 수 있게 돼요.

이러한 장점으로 프로젝트 시작과 동시에 자동 배포 파이프라인을 구축한다면, 구현에 집중하여 빠르게 개발할 수 있게 돼요. 

## 이제 필요해요

하지만, 대부분의 배포 작업은 `비용`이 발생하기 때문에 저희 팀은 조금이라도 절약하고자 배포 시기를 미뤘어요. 

로그인 기능이 완성된 지금, 프론트엔드 팀원들도 API를 테스트하며 작업하는 환경을 원하셔서 배포가 필요하다는 것을 느꼈고, 개발 환경 배포 파이프라인을 구축하기로 했어요.

---

# 배포 파이프라인

완성된 배포 파이프라인 흐름은 아래와 같아요. 왜 이런 구조를 선택하게 되었는지 알아볼게요.

![](/images/posts/deployment-automation-setup/5f7ff321-898e-406e-9e97-1111f77e8110_image.webp)

## 흐름
1. `develop` 브랜치에 새로운 작업 결과가 `push` 돼요.
2. 이를 감지하여 `워크 플로우(cd-dev)`가 실행돼요. (GitHub Actions)
3. GitHub 자체 호스팅 서버(러너)로 Docker image `build and push`가 진행돼요. (Docker Hub)
4. 이후 `self-hosted-runner`를 통해 배포 서버에서 나머지 작업이 수행돼요.
5. 나머지 작업은 변경사항 반영 및 서버 재시작이 포함되어 있어요.

---

## 브랜치 상황

```
└── main (절대 안정, 실제 릴리즈)
     └── develop (개발 환경, 새로운 기능 적용 및 테스트)
           ├── {키워드}/#이슈번호
           ├── {키워드}/#이슈번호
           ├── {키워드}/#이슈번호
           ├── {키워드}/#이슈번호
                   ...
           └── {키워드}/#이슈번호
```

우리 팀의 브랜치 상황이에요. `{키워드}`는 feat, fix와 같이 커밋 메시지 컨벤션을 검색하면 쉽게 볼 수 있는 키워드를 의미하고, `#이슈번호`는 깃허브의 이슈 번호를 의미해요. (브랜치명 예시: `feat/#4`)

모든 기능 개발(및 수정) 브랜치는 `develop` 에서 시작되며, 완성되면 `develop`으로 머지된 후 완성 단계라고 생각되면 `main` 브랜치로 병합하는 흐름을 가져요.

우선 프론트엔드 팀원들이 빠르게 새로운 기능을 테스트하며 개발할 수 있도록 `develop` 브랜치를 기준으로 배포하기로 했어요. 이후 `main` 브랜치의 배포 파이프라인을 따로 구성하여 실제 사용자들이 사용하게 되는 서버를 구축할 예정이에요.

## 간단한 요구사항

- 비용이 적을 수록 좋아요.
- 자동으로 배포가 진행되어야 해요.
- HTTPS 적용이 필요해요.

---

# 어디에 배포할까

> 배포는 `언제 어디서나 안정적으로` 접속할 수 있는 컴퓨터(서버)를 준비하고, 애플리케이션을 그 서버에서 실행시켜 `사용자들이 접근할 수 있도록` 하는 과정이에요.

애플리케이션을 배포하기 위해서는 적절한 서버를 선택해야 해요. ~~집에는 보통 서버를 둘 수 없기 때문에~~, 클라우드 서비스를 활용하는 것이 일반적이에요. 

여기서는 `서버 vs 서버리스`, `클라우드 회사` 등 여러 부분에서 고민해봤어요.

## 서버 vs 서버리스

애플리케이션을 배포할 때, 크게 `서버 기반 배포`와 `서버리스 배포`로 나눌 수 있어요.

### 서버 기반 배포(Server-based Deployment)

- 서버 기반 배포는 물리적 또는 가상 서버에서 애플리케이션을 실행하는 방식이에요. `서버는 항상 켜져 있으며`, 사용자의 요청이 있을 때마다 응답할 준비가 되어 있어요.
- 서버는 항상 실행되어야 하므로, 대부분 일정한 비용이 발생해요.
- 서버 기반 배포는 애플리케이션의 구성과 환경을 세밀하게 제어할 수 있는 유연성을 제공해요. 하지만, 세밀하게 제어할 수 있는 만큼 직접 관리해야 하는 항목도 많아져요. (네트워크 설정, 보안 패치 등)
- AWS의 EC2, GCP의 VM Instance, ...

### 서버리스 배포(Serverless Deployment)

- 서버리스 배포는 클라우드 제공자가 서버 관리를 해주며, 필요에 따라 자동으로 확장해요.
- 사용한 만큼만 비용을 지불하며, 트래픽이 적을 때는 비용이 절감돼요.
- 비교적 `서버 관리에 대한 부담이 줄어들고`, 개발자가 애플리케이션 개발에 집중할 수 있어요. 하지만, 특정 실행 시간 제한이나 제약된 환경 설정 등의 한계가 있을 수 있어요. `클라우드 제공자에 대한 높은 의존성`
- AWS의 Lambda, GCP의 Cloud Functions, ...

### 선택하기

> 아래와 같은 고민으로 **서버 기반 배포**를 선택했어요.
> 
> 개발 환경에서는 우리가 고민했던 `비용`에서 큰 차이를 느끼기 어려웠고, 그렇다면 우리가 더 알아보고 싶은 `서버 기반 배포`를 선택하자!

처음에는 개발 생산성 향상과 효율성을 위해 서버리스 배포를 고려했어요. 서버리스는 서버 관리 부담을 덜어주어 개발자들이 애플리케이션 로직에 집중할 수 있으며, 사용한 만큼만 비용을 지불하는 장점이 있어요.

그러나 아래와 같은 고민으로 마음을 바꾸게 되었어요.

- `콜드 스타팅` : 완전 관리형 서버리스 컨테이너 서비스인 GCP의 Cloud Run을 사용한 경험이 있는데, 개발 및 테스트 과정에서 콜드 스타팅으로 인해 초기 응답 시간이 지연되는 문제가 발생했어요. 이를 해결하기 위해 최소 인스턴스 개수를 1개 이상으로 설정할 수 있었지만, 이는 결국 서버리스의 비용 효율성을 떨어뜨린다고 생각했어요. (자주 호출하여 인스턴스가 꺼지지 않게 하는 방법도 위와 동일하다고 생각했어요.)
- `크게 차이나지 않는 비용` : 사용한 만큼 지불하는 메리트가 있지만, 클라우드 제공자의 초기 할인 정책(AWS 프리티어, GCP의 $300 무료 크레딧 등)을 활용하면, 개발 단계에서는 두 방식 모두 무료로 구축할 수 있어요. 오히려 서버리스 배포는 클라우드 제공자가 관리를 도와주기 때문에 최소 비용은 더 높아질 수 있어요.
- `구조로 발생한 제약` : 특정 시간에 작업 완료 알림을 보내는 기능도 구상하고 있었기에 서버리스 구조가 제약이 될 것 같은 걱정도 있었어요.

서버 기반 배포는 직접 관리할 수 있는 항목이 많아져요. 따라서 배포 환경에서 발생한 문제를 해결하는 것은 저희 팀에게 `좋은 성장의 기회`가 될 수 있다고 생각했어요. 또한, 팀원들이 `리눅스 환경에 익숙`해지며, 직접 관리하는 경험을 원했어요.

또한, 서버 기반 배포는 대부분 일정한 비용이 발생하므로, 예산 계획이 용이하고. 앞서 말한 것처럼 클라우드 제공자의 할인 정책을 활용하면 거의 `무료로 사용`할 수 있어요.

## 클라우드 제공자

> 우리 팀은 **AWS**를 선택했어요.

대표적인 클라우드 제공자로는 `AWS(Amazon Web Services)`, `GCP(Google Cloud Platform)`, `OCI(Oracle Cloud Infrastructure)` 가 있어요.

![](/images/posts/deployment-automation-setup/627ccc92-4a8c-4452-8a78-86777d6889d0_image.webp)

구글 트렌드 검색 결과, `AWS`의 검색량이 다른 제공자들보다 압도적으로 높았어요. 검색량이 많다는 것은 그만큼 많은 관심을 받고 있으며, 레퍼런스도 풍부할 것이라고 생각했어요.

세 업체 모두 소규모 인스턴스 사용에 있어 무료 사용량이 제공되어 비용 부담은 없어요. 그러나 `AWS`는 12개월 동안 프리티어로 여러 추가 서비스(RDS 등)를 제공해요. (GCP의 무료 크레딧은 3개월만 유효해요.) 그래서 결국 `AWS`를 선택하자고 했어요. ~~OCI는 상대적으로 관심도가 적어서 포기했어요.~~

---

# 실행 환경 고민하기

이제 컴퓨터(AWS의 EC2 인스턴스 생성)를 구했으니 프로그램을 실행시켜야 해요. Spring Boot 애플리케이션을 실행시키는 방법은 간단해요. JAR 파일을 직접 실행하거나 (도커) 이미지를 통한 컨테이너를 띄우는 방식이 있어요.

> 우리 팀은 **컨테이너화 방식**을 선택했어요.
>
> 팀원들은 모두 `Docker` 및 `docker-compose` 사용 경험이 있었기 때문에 러닝 커브에 대한 우려가 적은 편이었고, 모두 다른 개발 환경에서 개발하는 우리에게 `일관된 환경으로 실행 가능`의 장점이 크게 느껴졌어요. 
>
> ~~미래에 더 좋고 무료인 서버를 사용할 수 있으면 바로 이사갈 마음을 가지고 있기 때문에~~

## JAR 파일 실행 방식

```bash
java -jar application.jar
```

Java 런타임만 준비되어 있다면, JAR 파일을 쉽게 실행할 수 있어요. `추가적인 학습이 필요하지 않고` 바로 배포할 수 있다는 것이 장점이에요. 하지만, Java 버전과 서버 설정 등 `환경에 따라` 애플리케이션이 제대로 작동하지 않을 가능성이 있어요.

## 컨테이너화 방식

컨테이너화는 애플리케이션과 그 의존성을 하나의 패키지로 묶어, `일관된 환경에서 실행할 수 있도록 하는 기술`이에요. Docker는 가장 널리 사용되는 컨테이너화 도구 중 하나에요.

컨테이너는 `여러 환경에서 동일하게 동작`하므로, 환경 차이로 인한 문제를 줄일 수 있어요. 또한, 각 컨테이너는 독립적으로 실행되므로, 애플리케이션 간의 충돌을 방지할 수 있어요.

`Docker Compose` 와 같은 오케스트레이션 도구를 사용하여 손쉽게 여러 컨테이너를 효율적으로 관리할 수 있어요.

---

# 자동 배포 파이프라인

이제 애플리케이션을 어디에, 어떻게 배포할 것인지 결정했기 때문에 그 과정을 자동화해야 해요.

![](/images/posts/deployment-automation-setup/fdd33f7a-e227-4f5a-8eb8-9a95a2e961f8_image.webp)

구글에 자동 배포를 검색하면 `Jenkins`, `GitHub Actions` 이 두개를 많이 활용한다는 것을 알 수 있어요. 직접 다 써보고 비교하기엔 시간이 오래 걸리기 때문에 ChatGPT를 활용하여 빠르게 비교해봤어요.

## GPT의 비교 및 제안

![](/images/posts/deployment-automation-setup/ed16c722-c79f-416a-aba6-ffe860419eb8_image.webp)

> ### ChatGPT 답변
> 소규모 팀과 프로젝트의 경우, **`GitHub Actions가 Jenkins보다 더 적합한 선택일 가능성이 큽니다.`** GitHub Actions는 `설정과 관리가 간편`하고, `GitHub과의 통합`이 자연스러워 초기 설정 시간을 단축시킬 수 있습니다. 또한, 비용 효율성 측면에서도 소규모 프로젝트에 적합한 프리티어를 제공하므로, 팀의 리소스를 효율적으로 사용할 수 있습니다.
>
> 반면, Jenkins는 고유한 빌드 요구사항이나 높은 커스터마이징이 필요한 경우, 또는 자체 서버 관리에 대한 경험이 있는 팀에게 더 적합할 수 있습니다. 하지만, 소규모 팀에서는 관리 부담과 초기 설정의 복잡성을 고려할 때 GitHub Actions가 더 효율적일 것입니다.

이미 GitHub를 활용하여 코드 관리를 하고 있기 때문에, `GitHub Actions`를 사용하여 구성 및 통합하기 편하고 설정 방법이 직관적이에요. 또한 `Jenkins` 자체는 무료지만 자체 서버 비용이 추가되며, `GitHub Actions`은 Public Repository라면 무료로 시작할 수 있어요.

> 그래서 우리 팀은 **GitHub Actions**를 사용하기로 했어요.

## GitHub Actions

구성을 위해 레퍼런스를 찾아보니 거의 대부분이 아래와 같은 흐름을 가지고 있었어요. (JAR 파일 실행 방식인 경우에는 Code Deploy와 S3를 활용한 방식이 많았어요.)

```yml
name: `Actions 구분을 위한 이름`

on:
  push:
    branches: `대상 브랜치`

jobs:
  build:
    `우분투 환경에서 GitHub에 업로드한 소스 코드 사용하여 이미지 build 및 Docker Hub에 push`

  deploy:
    `ssh로 인스턴스에 접속하여 도커 이미지 pull 및 재시작 명령어 실행`
```

이런 흐름을 그냥 따라가려고 했지만, 마음에 들지 않았던 두 가지 부분이 있었어요.

1. 빌드 과정에서 실행에 필요한 환경변수를 모두 넣고 이미지를 만드는 방식 (가끔 이렇게 구현하신 분이 계셨어요.)
2. GitHub Actions를 통해 인스턴스를 접근하는 방식 (인스턴스 호스트, 비밀 키 등을 GitHub Secrets에 넣어요.)

### 1. 환경변수를 모두 넣고 이미지를 만드는 방식
빌드 단계에서 환경변수를 Docker 이미지에 포함시키는 방식은 위험할 수 있어요. 예를 들어, 특정 서비스의 API Key가 이미지에 하드코딩된 상태로 이미지가 외부에 유출될 경우 문제가 발생할 수 있어요. 

최근에 읽은 [도커 이미지로 AWS 계정이 털린다? - 양예성](https://velog.io/@yeseong0412/%EB%AA%85%EB%A0%B9%EC%96%B4-%EB%AA%87%EC%A4%84%EB%A1%9C-%EB%8F%84%EC%BB%A4-%ED%95%B4%ED%82%B9%ED%95%98%EA%B8%B0) 포스팅에서도 이러한 위험성을 언급하고 있어요. 해당 포스팅을 읽고 그럴 수도 있겠다... 라는 마음으로 첫 번째 방식이 마음에 들지 않았어요.

하지만, 이 문제는 `런타임에 환경변수를 주입`하거나, 애플리케이션이 시작될 때 외부에서 설정을 불러올 수 있도록 [`Spring Cloud Config Server`](https://docs.spring.io/spring-cloud-config/docs/current/reference/html/)를 도입하는 방식으로 해결할 수 있어요.

### 2. GitHub Actions를 통해 인스턴스를 접근하는 방식

**GitHub Secrets을 믿지 못하겠다는 이야기는 아니에요.**

만약 `GitHub 계정이 털리거나 레포지토리가 노출될 경우`, 인스턴스에 대한 접근 권한이 유출될 수 있다고 생각했어요. 또한, GitHub Actions 서버가 우리 인스턴스에 접근하기 위해 `보호막(방화벽 규칙)을 풀어야 하는 것`도 보안상의 취약점이 될 수 있다고 생각해요. 

물론 가볍게 보면 유난으로 보일 수 있지만, AWS 자격 증명 유출로 악의적인 사용자에 의해(또는 실수로) 서버 비용이 많이 나와 선처를 구하는 블로그(AWS 환불 후기 등) 글이 많은 것을 보면 중요한 문제라고 생각해요.

우리 팀은 이러한 보안 위협을 줄이고자 `Self-Hosted Runner`를 도입했어요.

## Self-Hosted-Runner

`Self-Hosted Runner`는 GitHub Actions에서 제공하는 기본 클라우드 호스팅 환경 대신, 직접 관리하는 서버에서 워크플로우를 실행할 수 있게 해주는 기능이에요. 이를 통해 배포 환경을 더 세부적으로 제어하고, 보안을 강화할 수 있어요.

GitHub Repository에서 Settings &rarr; Actions &rarr; Runner 순서로 들어가서 `New self-hosted-runner` 버튼을 누르면 Runner를 생성할 수 있고, 구성 방법을 쉽고 자세하게 알려줘요. 더 자세한 내용은 [공식 문서](https://docs.github.com/ko/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)에서 확인할 수 있어요.


```yml
name: cd-dev

on:
  push:
    branches: develop

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"

      - name: Sign in Dockerhub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build the Docker image
        run: docker build -t ${{ secrets.DOCKER_USERNAME }}/${{ secrets.DOCKER_HUB_REPOSITORY }}:latest .

      - name: Push the Docker image
        run: docker push ${{ secrets.DOCKER_USERNAME }}/${{ secrets.DOCKER_HUB_REPOSITORY }}:latest

  deploy:
    needs: build
    runs-on: self-hosted

    steps:
      - name: Docker Image pull
        run: sudo docker pull ${{ secrets.DOCKER_USERNAME }}/${{ secrets.DOCKER_HUB_REPOSITORY }}:latest

      - name: Docker Compose Restart
        run: |
          cd ~/app
          sudo docker-compose down
          sudo docker-compose up -d
```

- `build (호스팅된 GitHub Actions 서버에서 실행)` :
 이 과정에서는 GitHub에 업로드한 소스 코드로 Docker 이미지를 빌드하여 Docker Hub에 push하는 과정이에요.
- `deploy (Self-Hosted Runner에서 실행)` : 
미리 설정한 인스턴스에서 실행될 작업이에요. Docker Hub에서 최신 이미지를 pull 받고, 인스턴스의 app 디렉터리로 이동하여 미리 작성해둔 docker-compose.yml을 통해 컨테이너를 재시작 하는 과정이에요.

![](/images/posts/deployment-automation-setup/6b85eba0-f1ca-4ac2-aadc-67a49bac8185_image.webp)

이러한 워크 플로우를 통해 빌드 및 이미지 푸시 작업을 GitHub의 호스팅 서버에서 처리하고, 배포는 `Self-Hosted Runner`를 사용해 인스턴스 자체에서 안전하게 실행돼요. 

이제 AWS 자격 증명을 `GitHub Secrets에 저장할 필요가 없기 때문에`, 자격 증명이 외부에 노출될 확률이 낮아져요. 또한, 이전 방식에선 호스팅된 GitHub Actions 서버(외부)에서 인스턴스에 접근하기 때문에 외부에서 인스턴스로 진입할 수 있는 입구가 하나 생긴다는 단점이 있지만, `Self-Hosted Runner`는 `내부 네트워크에서 실행`되므로 문제가 생길 확률이 줄어들어요.

추가로 외부에서 인스턴스에 접속할 수 없도록 IP 제한이 걸린 경우 이 방식이 유용할 것 같아요. (회사 내부 IP에서만 인스턴스에 접속할 수 있는 경우..?)

> ### 주의 사항
>
> Self-Hosted Runner는 자체 서버에서 실행되며, Runner가 idle 상태여야 하기 때문에 서버의 리소스(CPU, 메모리 사용량 등)를 잘 확인해야 해요. 저는 우선 swap 메모리를 설정했어요.
>
> Runner가 항상 원활하게 작동하도록 유지하는 것(가용성)을 위해 시스템 서비스로 등록하거나 모니터링 및 알림 설정을 할 수 있을 것 같아요.

물론, 이렇게 하더라도 GitHub 계정에 문제가 발생한 경우에는 막기 어려울 수 있으니 계정 관리도 잘해야 해요. 아니면 외부 트리거를 설정하여 진행하거나, private 이미지 저장소를 사용하는 방법이 나은 선택이 될 수 있을 것 같아요. (비용이 발생할 수 있어요. 예시: AWS Code Pipeline, GCP Cloud Build)

# 리버스 프록시

![](/images/posts/deployment-automation-setup/3d0f6862-2c8d-4db3-96bf-d72a7af770a7_image.webp)

우리 팀은 `traefik`을 사용하여 리버스 프록시를 구축했어요. 

저는 [깃허브](https://github.com/traefik/traefik/)를 구경하다가 우연히 알게 되었는데. 좀 찾아보니 괜찮은 도구라고 생각해서 도입하자고 제안했어요.

## træfik?

![](/images/posts/deployment-automation-setup/ddd17e1d-4ede-4fdb-8bf6-13bffc53ecf9_image.webp)


Traefik은 오픈 소스 애플리케이션 프록시로, 서비스를 쉽게 운영할 수 있도록 돕는 도구에요. 무엇보다도 설정 과정이 복잡하지 않고 자동화되어 있어 `마이크로서비스 환경`이나 `컨테이너 기반 시스템`에서 많은 개발자들에게 사랑받고 있다고 해요.

Traefik을 사용하면 복잡한 프록시 설정 작업을 줄일 수 있어, 개발자는 애플리케이션 개발에 더 집중할 수 있다고 강조해요. 또한, 다양한 클러스터 환경에서 유연하게 동작하며, 특히 Docker 및 Kubernetes와 같은 환경에서 서비스 배포를 간소화해준다고 해요.

Traefik의 가장 큰 장점 중 하나는 `자동 구성 기능`이에요. Traefik은 인프라를 스캔하여 각 서비스가 어떤 요청을 처리해야 하는지 자동으로 파악하고, 별도의 수작업 없이 적절한 라우팅을 설정해주기 때문에 각 서비스에 맞는 라우팅 규칙을 수동으로 작성할 필요 없이, Traefik이 알아서 모든 작업을 처리해요. Traefik은 설정이 실시간으로 반영되기 때문에, 서비스를 중단하거나 재시작할 필요가 없다고 해요.

추가로 `Let's Encrypt`와의 통합을 통해 `SSL 인증서를 자동으로 발급 및 갱신`해 주며, 별도의 작업 없이 안전한 HTTPS 트래픽을 관리할 수 있어요.

### 자동 구성 테스트

![](/images/posts/deployment-automation-setup/095cd8f3-6524-4021-9cac-0b3811ba722f_image.webp)

Traefik 컨테이너를 먼저 실행시키고, 추가로 2개의 컨테이너를 실행시켰어요. Traefik 컨테이너를 재시작하지 않아도 자동으로 구성에 추가된 것을 볼 수 있어요.

> 특히, 저는 `Docker와의 통합`과 `SSL 인증서 자동 발급 및 관리`가 너무 편했어요.

## 어떻게 사용해

처음에는 [Quick Start with Docker - traefik docs](https://doc.traefik.io/traefik/getting-started/quick-start/)를 참고하여 직접 써보면서 학습했고 나머지는 공식 문서를 통해 학습했어요. v2 레퍼런스는 꽤 있었지만, v3 레퍼런스는 거의 없었고 공식 문서가 학습하기 더 편했어요.

### 테스트 

아래는 제가 `GET - api/v1/health` API만 제공하는 스프링 부트 애플리케이션을 이미지로 만들어서 테스트에 사용했던 `docker-compose.yml` 이에요.

```yml
version: '3.9'

services:
  reverse-proxy:
    image: traefik:v3.1
    command:
      # Traefik API를 비밀번호 없이 접근 가능하게 설정
      - "--api.insecure=true"
       # Docker에서 컨테이너의 정보를 가져오기 위해 설정
      - "--providers.docker=true" 
       # HTTP 요청을 처리할 포트 80 설정
      - "--entrypoints.web.address=:80"
      # Traefik 대시보드에 접근할 포트 8080 설정
      - "--entrypoints.traefik.address=:8080"
      - "--api.dashboard=true"
      - "--log.level=INFO"
      - "--accesslog=true"
    ports:
      # {호스트의 포트} : {컨테이너의 포트} 연결
      - "80:80"
      - "8080:8080"
    volumes:
	  # Docker 소켓을 마운트하여 Traefik이 Docker 컨테이너를 관리하도록 허용
      - "/var/run/docker.sock:/var/run/docker.sock"
    networks:
      - traefik-test

  my-app:
    # 배포할 스프링 부트 애플리케이션의 Docker 이미지
    image: `사용할 이미지`
    deploy:
      # 애플리케이션의 복제본 수 설정, 3개의 컨테이너가 실행
      replicas: 3
    labels:
      # Traefik이 이 서비스를 인식하도록 설정
      - "traefik.enable=true"
      # 특정 호스트와 경로에 대한 라우팅 규칙 설정
      - "traefik.http.routers.my-app.rule=Host(`localhost`) && PathPrefix(`/api/v1`)"
      # 로드밸런서가 서비스의 8080 포트로 요청을 전달하도록 설정
      - "traefik.http.services.my-app.loadbalancer.server.port=8080"
    networks:
      - traefik-test

networks:
  traefik-test:
    driver: bridge
```

### 설정 요약

- `Traefik` : 리버스 프록시로서 애플리케이션의 요청을 처리하고, 대시보드를 통해 상태를 모니터링할 수 있어요.
- `my-app` : Docker 이미지를 기반으로 한 스프링 부트 애플리케이션으로, Traefik에 의해 로드밸런싱 돼요.
- `로드밸런싱` : replicas: 3 설정으로 애플리케이션의 인스턴스가 3개 실행되며, 자동으로 요청을 나눠줘요.
- `라우팅 규칙` : Host와 PathPrefix를 기반으로 요청을 라우팅하여, /api/v1 경로로 시작하는 요청이 my-app으로 전달돼요.


### 요청 테스트

스프링 부트 애플리케이션에 요청을 보내려면 다음과 같은 URL을 사용하면 돼요.
`GET - http://localhost/api/v1/health` (OK 문자열만 응답하게 구성했어요.)

요청을 보내면 Traefik이 요청을 받아 3개의 my-app 서비스로 균형있게 전달해요.

![](/images/posts/deployment-automation-setup/3618f0ff-fa70-46a4-b554-7999c2838b88_image.webp)

아래의 reverse-proxy(traefik 컨테이너 이름) 로그를 보면 같은 요청이지만, 다른 호스트로 전달하고 있는 것을 볼 수 있어요. (모두 스프링 부트 애플리케이션으로 전달돼요.)

### 대시보드

위 구성에서는 브라우저에 `http://localhost:8080/dashboard/` 를 입력하면 대시보드를 확인할 수 있어요. Traefik이 제공해주는 기능이에요.

![](/images/posts/deployment-automation-setup/8e2dfe5e-d001-4eee-90e6-3da094148d1d_image.webp)

Services 탭에 들어가면 아래와 같이 구성된 서비스들의 정보를 확인할 수 있어요.

![](/images/posts/deployment-automation-setup/fe8dacb3-3c45-42f9-b5c5-7145c895a9ec_image.webp)

앞서 설정한 것처럼 3개의 복제본이 실행된 상태이기 때문에 서브넷 내의 IP 주소가 3개인 것을 볼 수 있고, 앞에서 본 reverse-proxy 로그에 나왔던 주소와 똑같은 것을 볼 수 있어요.

아래에는 설정했던 라우팅 규칙이 명시되어 있어요.

> SSL 인증서 자동 발급 및 관리 설정은 공식 문서에서 [문서 1](https://doc.traefik.io/traefik/user-guides/docker-compose/acme-tls/)과 [문서 2](https://doc.traefik.io/traefik/https/acme/)를 보면 쉽게 구현할 수 있을 거에요.

# 기타 내용

- AWS의 `RDS`를 활용하여 MySQL 데이터베이스를 사용할 수 있게 추가했습니다.
- [로그인 세션 관리](https://velog.io/@hyeok_1212/%EC%96%B4%EB%94%94%EC%97%90-%EC%84%B8%EC%85%98%EC%9D%84-%EB%B3%B4%EA%B4%80%ED%95%A0%EA%B9%8C)를 위해 `Amazon ElastiCache`를 사용해보려고 해요.
- 환경 변수가 포함된 docker-compose.yml 파일은 인스턴스 내부에 존재해요.

## 마무리

![](/images/posts/deployment-automation-setup/5f7ff321-898e-406e-9e97-1111f77e8110_image.webp)

이러한 고민과 선택으로 개발 환경 배포 파이프라인을 구성했어요. 아래는 구성하면서 생긴 궁금증이에요.

- 이처럼 한 인스턴스 내부에 복제하여 실행한 환경이 과연 가용성 향상에 도움이 될까요?
- 만약 Runner가 종료되면 어떻게 감지할까요?
- 현재는 재배포가 시작되면 들어오던 요청도 무시될텐데 어떡할까요? Graceful Shutdown?
- 또한 배포 사이에 공백이 존재해요. 무중단 배포?

긴 글 읽어주셔서 감사합니다. 

## 참고 자료

- [[AWS & Github Actions] CI/CD 파이프라인 구축 (Spring + Docker) - 데굴데굴 개발자의 기록](https://sjh9708.tistory.com/237)
- [Jenkins → GitHub Action 이전기 - 민돌v](https://thalals.tistory.com/470)
- [도커 이미지로 AWS 계정이 털린다? - 양예성](https://velog.io/@yeseong0412/%EB%AA%85%EB%A0%B9%EC%96%B4-%EB%AA%87%EC%A4%84%EB%A1%9C-%EB%8F%84%EC%BB%A4-%ED%95%B4%ED%82%B9%ED%95%98%EA%B8%B0)
- [Spring Cloud Config Server - Spring Docs](https://docs.spring.io/spring-cloud-config/docs/current/reference/html/)
- [Self-Hosted-Runner - GitHub Docs](https://docs.github.com/ko/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)
- [Self-hosted Runner로 서버 배포 자동화하기 - Amaranth](https://amaran-th.github.io/%EC%9D%B8%ED%94%84%EB%9D%BC/[CICD]%20Self-hosted%20Runner%EB%A1%9C%20%EC%84%9C%EB%B2%84%20%EB%B0%B0%ED%8F%AC%20%EC%9E%90%EB%8F%99%ED%99%94%ED%95%98%EA%B8%B0/)
- [Traefik Docs](https://doc.traefik.io/traefik/)
