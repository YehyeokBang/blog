---
title: "[GDSC] OAuth 2.0 사용해보기"
date: "2023-10-26"
summary: "GDSC 서버 파트 스터디를 위한 OAuth 2.0 튜토리얼로, GCP 프로젝트 설정부터 Spring Boot를 이용한 Google 로그인 구현 과정까지 다룹니다."
tags: ["GDSC", "OAuth 2.0", "Google Login", "Spring Boot", "Security"]
---

## GDSC
GDSC 서버 파트의 스터디를 위한 자료에요.

## 강의 전 안내
- 자료는 완벽하지 않아요. 만약 하다가 문제가 있을 경우 질문을 해주시면 빠르게 도움을 받으실 수 있어요.
- 시간이 지남에 따라 해당 자료와 같은 방법으로 실습을 진행하지 못할 수 있어요. (버전업 등)
- 진행 중 오류가 발생한 경우 어디서 내가 잘못 작성했나? 보다는 발생한 오류를 파악하고 그 오류를 고치기 위해 노력해보세요. 원활한 실습 진행을 위해 준비한 자료이며, 많이 의존하지 않는 것을 추천해요.
- 항상 이 작업을 왜 하는지 스스로 질문해보는 것을 추천해요.

## OAuth

![](/images/posts/gdsc-oauth2-tutorial/61a58dcd-07ff-4615-b43b-1e4dcd8a5679_image.png)

- [출처](https://king-ja.tistory.com/87)


## GCP 프로젝트 만들기

먼저 [Google Cloud Platform](https://console.cloud.google.com/welcome)에서 새 프로젝트를 만들어요.

![](/images/posts/gdsc-oauth2-tutorial/d9773b2c-045a-488b-979b-1b5da6311489_image.png)

![](/images/posts/gdsc-oauth2-tutorial/dddf7463-16ee-4547-817b-1dd749b55bfd_image.png)

오른쪽 상단에서 생성된 것을 확인할 수 있어요.
![](/images/posts/gdsc-oauth2-tutorial/c88c4b7a-bdf9-4d15-9e44-bc2cea11081b_image.png)

만든 프로젝트에서 사용자 인증 정보를 선택해요.
![](/images/posts/gdsc-oauth2-tutorial/5f0114df-5742-4a2e-9bdb-0ad0f4bbb606_image.png)

사용자 인증 정보 만들기 -> OAuth 클라이언트 ID를 선택해요.
![](/images/posts/gdsc-oauth2-tutorial/13e0cef1-c422-42a0-9948-16015bdfb31b_image.png)

![](/images/posts/gdsc-oauth2-tutorial/0bdda463-ce77-4481-9e74-afc9a3276a93_image.png)

User Type은 `External` 을 사용해요.
![](/images/posts/gdsc-oauth2-tutorial/f18a4fa0-6051-45ef-9b52-5caf5577eb72_image.png)

![](/images/posts/gdsc-oauth2-tutorial/db070522-8dd5-4b4e-be7b-374bc90e3c7d_image.png)

이후 테스트 사용자에 본인 이메일만 추가하고 계속 진행하고 완료되면 다시 OAuth 클라이언트 ID를 선택해요.

![](/images/posts/gdsc-oauth2-tutorial/c5671f7d-a35c-4a1d-b3d9-0fbd3be9168c_image.png)

![](/images/posts/gdsc-oauth2-tutorial/8544f15b-4546-40f8-b3d6-1f76be39ce2d_image.png)

만들면 `client_id` 값을 알 수 있어요.
```
curl -X GET "https://accounts.google.com/o/oauth2/v2/auth?client_id=<client_id>&redirect_uri=<redirect_uri>&response_type=code&scope=profile"
```
`http://localhost:8080/c/callback/google` 경로를 `redirect_uri` 로 추가해서 어디다가 잠시 적어두고 스프링 부트 프로젝트를 만들어 볼게요.

## 프로젝트 만들기

다음과 같이 프로젝트를 생성했어요.
![](/images/posts/gdsc-oauth2-tutorial/783262ef-c234-452b-b4b4-87cacfe51809_image.png)

![](/images/posts/gdsc-oauth2-tutorial/af425ffd-60ac-471a-9ba5-e6ddd1db725e_image.png)

추가로 JWT와 JSON 관련 의존성을 추가해야 해요. `build.gradle` 에 추가해요.
추가하고 꼭 적용을 시켜줘야 해요.
```java
dependencies {
	...

    implementation group: 'io.jsonwebtoken', name: 'jjwt-api', version: '0.11.2'
    runtimeOnly group: 'io.jsonwebtoken', name: 'jjwt-impl', version: '0.11.2'
    runtimeOnly group: 'io.jsonwebtoken', name: 'jjwt-jackson', version: '0.11.2'

    implementation 'com.google.code.gson:gson:2.10.1'

	...
}
```

우리는 별도로 라이브러리를 설치하지 않아도 돼요.

![](/images/posts/gdsc-oauth2-tutorial/e9a209da-d430-4a40-9e62-fec79efc3c90_image.png)


아래의 코드는 구글 로그인을 통해 사용자의 정보를 구글로부터 가져오는 방법이에요. 코드만 살펴볼게요.

```java
@RequestMapping("/api/oauth2")
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/callback/google")
    public String googleCallback(@RequestParam(name = "code") String code) {
        return authService.getGoogleAccessToken(code);
    }

    @GetMapping("/user-info")
    public String getUserInfo(@RequestParam(name = "access_token") String accessToken) {
        return authService.getUserInfo(accessToken);
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private final String GOOGLE_CLIENT_ID = <YOUR_CLIENT_ID>;
    private final String GOOGLE_CLIENT_SECRET = <YOUR_CLIENT_SECRET>;
    private final String GOOGLE_REDIRECT_URI = "http://localhost:8080/api/oauth2/callback/google";

    public String getGoogleAccessToken(String code) {
        RestTemplate restTemplate = new RestTemplate();
        Map<String, String> params = Map.of(
                "code", code,
                "client_id", GOOGLE_CLIENT_ID,
                "client_secret", GOOGLE_CLIENT_SECRET,
                "redirect_uri", GOOGLE_REDIRECT_URI,
                "grant_type", "authorization_code"
        );

        ResponseEntity<String> responseEntity = restTemplate.postForEntity(GOOGLE_TOKEN_URL, params, String.class);

        if (responseEntity.getStatusCode().is2xxSuccessful()) {
            return responseEntity.getBody();
        } return null;
    }

    public String getUserInfo(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        RequestEntity<Void> requestEntity = new RequestEntity<>(headers, HttpMethod.GET, URI.create(url));
        ResponseEntity<String> responseEntity = restTemplate.exchange(requestEntity, String.class);

        System.out.println(responseEntity.getBody());
        if (responseEntity.getStatusCode().is2xxSuccessful()) {
            return responseEntity.getBody();
        }
        return null;
    }
}
```


## 테스트 해보기

![](/images/posts/gdsc-oauth2-tutorial/50c58126-591f-4f5b-9e8f-a97d22958180_image.png)

로그인을 하면 스프링 부트로 만들어둔 API가 작동하여 AccessToken을 발견할 수 있어요.

이제 그 AccessToken으로 구글에 접근하여 로그인한 유저의 정보를 가져올 수 있어요.

![](/images/posts/gdsc-oauth2-tutorial/d91df3d9-3bd9-4427-9c17-7398142da103_image.png)

id, 이름 등의 유저 정보를 가져왔어요.

추가로 구글 로그인한 사용자의 이메일을 사용하기 위해서는 범위를 추가해야 해요.

![](/images/posts/gdsc-oauth2-tutorial/6b52e75b-7999-41c2-866c-15ce1b16bb31_image.png)

</br>

## 활용 방법

아래 예시는 구글로 로그인을 진행할 때, 처음 방문한 사용자일 경우 바로 회원가입을 시키고 로그인 즉, 토큰을 발급해주고 한 번 이상 방문한 사용자일 경우 토큰을 발급해주는 방식을 사용할 예정이에요.

구현하려는 서비스를 고려하여 응용할 수 있으면 좋아요.

패키지 구조는 자신만의 이유를 가지고 구성해봐요.

### Domain

```java
@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @Column(name = "USER_ID")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "USER_NAME", nullable = false)
    private String name;

    @Column(name = "USER_EMAIL", nullable = false)
    private String email;

    @Column(name = "USER_PICTURE_URL", nullable = false)
    private String pictureUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "USER_ROLE", nullable = false)
    private Role role;
}
```

```java
public enum Role {
    ROLE_USER, ROLE_ADMIN
}
```

사용자와 권한(역할)을 나타내는 클래스에요.

### dto
```java
@Data
@Builder
@AllArgsConstructor
public class Token {
    @SerializedName("access_token")
    private String accessToken;
}
```
- AccessToken 값을 전달하기 위해 사용해요.
- `@SerializedName("access_token")`는 JSON으로 직렬화하거나 역직렬화할 때 사용할 필드 이름을 지정하는 데 사용해요.

```java
@Data
public class UserInfo {
    private String id;
    private String email;
    @SerializedName("verified_email")
    private Boolean verifiedEmail;
    private String name;
    @SerializedName("given_name")
    private String givenName;
    @SerializedName("family_name")
    private String familyName;
    @SerializedName("picture")
    private String pictureUrl;
    private String locale;
}
```
- 구글 AccessToken으로 사용자의 정보를 받을 때 사용해요.

### SecurityConfig

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final TokenProvider tokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .httpBasic(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sessionManagement -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorizeRequests -> authorizeRequests
                        .requestMatchers("/api/oauth2/**").permitAll()
                        .requestMatchers("/test").authenticated()
                        .anyRequest().authenticated()
                )
                .cors(cors -> cors.configurationSource(configurationSource()))
                .addFilterBefore(new JwtFilter(tokenProvider), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource configurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Access-Control-Allow-Credentials", "Authorization", "Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
```

### JWTFilter

```java
@RequiredArgsConstructor
public class JwtFilter extends GenericFilterBean {
    private final TokenProvider tokenProvider;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        String token = tokenProvider.resolveToken((HttpServletRequest) request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            Authentication authentication = tokenProvider.getAuthentication(token);

            // SecurityContext에 Authentication 객체를 저장 (인증 정보(authentication)를 Spring Security에게 넘김)
            SecurityContextHolder.getContext().setAuthentication(authentication);

        }
        chain.doFilter(request, response);
    }
}
```
- 이 클래스는 모든 요청이 들어올 때마다 실행되는 필터에요. 요청 헤더에서 JWT를 추출하고, 이를 검증해요. JWT가 유효하다면 이를 해독하여 사용자 정보를 얻고, 이를 SecurityContext에 저장하며, 하위 레이어에서는 SecurityContext를 통해 인증된 사용자 정보를 얻을 수 있어요.

### TokenProvider

```java
@Component
public class TokenProvider {
    private final Key key;
    private final long accessTokenValidityTime;

    public TokenProvider(@Value("${jwt.secret}") String secretKey,
                         @Value("${jwt.access-token-validity-in-milliseconds}") long accessTokenValidityTime) {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenValidityTime = accessTokenValidityTime;
    }

    public Token createToken(User user) {
        long nowTime = (new Date()).getTime();

        Date tokenExpiredTime = new Date(nowTime + accessTokenValidityTime);

        String accessToken = Jwts.builder()
                .setSubject(user.getId().toString())
                .claim("auth", user.getRole().name())
                .setExpiration(tokenExpiredTime)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        return Token.builder()
                .accessToken(accessToken)
                .build();
    }

    public Authentication getAuthentication(String accessToken) {
        Claims claims = parseClaims(accessToken);

        if (claims.get("auth") == null) {
            throw new RuntimeException("권한 정보가 없는 토큰입니다.");
        }

        // 위 과정을 통과하면 권한 정보가 있는 토큰임

        Collection<? extends GrantedAuthority> authorities = Arrays.stream(claims.get("auth").toString().split(","))
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        return new UsernamePasswordAuthenticationToken(claims.getSubject(), "", authorities);
    }

    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            return true;
        } catch (UnsupportedJwtException | ExpiredJwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }
}
```

`TokenProvider` 클래스는 JWT(Json Web Token)를 생성하고 검증하는 역할을 해요.
- `TokenProvider 생성자` : 이 클래스의 생성자에서는 JWT를 생성할 때 사용할 비밀키와 액세스 토큰의 유효 시간을 설정해요. 이는 Spring의 @Value 어노테이션을 통해 `application.yml` 파일에서 값을 가져와요.
- `createToken(User user)` : 이 메서드는 사용자의 정보를 받아 JWT를 생성하는 역할을 해요. 사용자의 id와 권한 정보를 토큰에 넣고, 만료 시간을 설정한 후에 토큰을 서명해요.
- `getAuthentication(String accessToken)` : 이 메서드는 주어진 액세스 토큰을 해독하여 사용자의 정보를 얻어요. 해독된 토큰에서 권한 정보를 추출하고, 이를 바탕으로 Authentication 객체를 생성하여 반환해요.
- `resolveToken(HttpServletRequest request)` : 이 메서드는 HTTP 요청의 헤더에서 "Authorization" 헤더 값을 추출하여 토큰을 얻고, "Bearer "로 시작하는 토큰 값에서 "Bearer "를 제거한 토큰 값만 반환해요.
- `validateToken(String token)` : 이 메서드는 주어진 토큰의 유효성을 검증해요. 토큰을 파싱하고 문제가 없다면 true를 반환하고 만약 토큰이 유효하지 않거나 만료되었다면 false를 반환해요.
- `parseClaims(String accessToken)` : 이 메서드는 주어진 액세스 토큰을 파싱하여 토큰에 담긴 정보를 담고 있는 Claims 객체를 반환해요.

### Controller
```java
@RequestMapping("/api/oauth2")
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("callback/google")
    public Token googleCallback(@RequestParam(name = "code") String code) {
        String googleAccessToken = authService.getGoogleAccessToken(code);
        return loginOrSignup(googleAccessToken);
    }

    public Token loginOrSignup(String googleAccessToken) {
        return authService.loginOrSignUp(googleAccessToken);
    }
}
```
- `googleCallback()` 으로 코드를 알아내자마자 구글에게 엑세스 토큰을 요청하여 알아내요. 알아낸 구글 AccessToken을 `loginOrSignup()`에 넘겨주어 가입 여부에 따라 회원가입 진행 후 AccessToken을 발급하여 반환해요.
- `loginOrSignup()` 메서드는 구글 AccessToken 값으로 구글에게 요청하여 유저 정보를 가져와 가입 여부에 따라 회원가입 진행 후 `TokenProvider` 객체를 통해 JWT(AccessToken)를 발급하여 반환해요.

#### 테스트용
```java
@RestController
@RequiredArgsConstructor
public class TestController {
    private final AuthService authService;

    @GetMapping("/test")
    public User test(Principal principal) {
        return authService.test(principal);
    }
}
```

### Service

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private final String GOOGLE_CLIENT_ID = <YOUR_CLIENT_ID>;
    private final String GOOGLE_CLIENT_SECRET = <YOUR_CLIENT_SECRET>;
    private final String GOOGLE_REDIRECT_URI = "http://localhost:8080/api/oauth2/callback/google";

    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;

    public String getGoogleAccessToken(String code) {
        RestTemplate restTemplate = new RestTemplate();
        Map<String, String> params = Map.of(
                "code", code,
                "scope", "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
                "client_id", GOOGLE_CLIENT_ID,
                "client_secret", GOOGLE_CLIENT_SECRET,
                "redirect_uri", GOOGLE_REDIRECT_URI,
                "grant_type", "authorization_code"
        );

        ResponseEntity<String> responseEntity = restTemplate.postForEntity(GOOGLE_TOKEN_URL, params, String.class);

        if (responseEntity.getStatusCode().is2xxSuccessful()) {
            String json = responseEntity.getBody();
            Gson gson = new Gson();

            return gson.fromJson(json, Token.class)
                    .getAccessToken();
        }

        throw new RuntimeException("구글 엑세스 토큰을 가져오는데 실패했습니다.");
    }

    public Token loginOrSignUp(String googleAccessToken) {
        UserInfo userInfo = getUserInfo(googleAccessToken);

        if (!userInfo.getVerifiedEmail()) {
            throw new RuntimeException("이메일 인증이 되지 않은 유저입니다.");
        }

        User user = userRepository.findByEmail(userInfo.getEmail()).orElseGet(() ->
                userRepository.save(User.builder()
                        .email(userInfo.getEmail())
                        .name(userInfo.getName())
                        .pictureUrl(userInfo.getPictureUrl())
                        .role(Role.ROLE_USER) // 최초 가입시 USER로 설정, 원하는 대로 변경할 수 있는 응용력 필요
                        .build())
        );

        return tokenProvider.createToken(user);
    }

    public UserInfo getUserInfo(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        RequestEntity<Void> requestEntity = new RequestEntity<>(headers, HttpMethod.GET, URI.create(url));
        ResponseEntity<String> responseEntity = restTemplate.exchange(requestEntity, String.class);

        if (responseEntity.getStatusCode().is2xxSuccessful()) {
            String json = responseEntity.getBody();
            Gson gson = new Gson();
            return gson.fromJson(json, UserInfo.class);
        }

        throw new RuntimeException("유저 정보를 가져오는데 실패했습니다.");
    }

    public User test(Principal principal) {
        Long id = Long.parseLong(principal.getName());

        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
    }
}
```

`AuthService` 클래스는 Google OAuth2 인증을 통한 사용자 로그인 및 회원가입을 처리하는 역할을 해요.
- `getGoogleAccessToken(String code)` : 이 메서드는 Google OAuth2 인증 서버에 액세스 토큰을 요청하는 역할을 해요. 인증 코드, 스코프, 클라이언트 ID, 클라이언트 시크릿, 리다이렉트 URI, 그리고 인증 코드를 이용해 토큰을 요청하는 방식인 "authorization_code"를 매개변수로 제공해요.
- `loginOrSignUp(String googleAccessToken)` : 이 메서드는 주어진 Google 액세스 토큰을 이용해 사용자 정보를 얻고, 이를 통해 사용자를 로그인하거나 회원가입 시키는 역할을 해요. 먼저 사용자의 이메일이 인증된 이메일인지 확인한 후, 사용자 정보를 바탕으로 사용자를 DB에서 찾거나 새로 저장하고, 마지막으로 JWT를 생성하여 반환해요.
- `getUserInfo(String accessToken)` : 이 메서드는 주어진 Google 액세스 토큰을 이용해 사용자 정보를 얻는 역할을 해요. 토큰을 이용해 Google에 사용자 정보를 요청하고, 응답을 UserInfo 객체로 변환하여 반환해요.
- `test(Principal principal)` : 이 메서드는 주어진 Principal 객체를 이용해 사용자를 찾는 테스트용 메소드에요. Principal 객체의 getName() 메소드를 이용해 사용자 ID를 얻고, 이를 이용해 DB에서 사용자를 찾아 반환해요. 만약 해당 ID의 사용자가 없다면 예외를 발생시켜요. 해당 강의 테스트 용도이기 때문에 좋은 코드는 아니에요.

### Repository

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String userEmail);
}
```
- Spring Data JPA를 사용하여 간단하게 사용자 정보를 저장하거나 조회할 수 있어요.

## 테스트 해보기

> https://accounts.google.com/o/oauth2/v2/auth?client_id=(YOUR_CLIENT_ID)&redirect_uri=http://localhost:8080/api/oauth2/callback/google&response_type=code&scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email

자신의 클라이언트 아이디를 넣고 실행하면 다음과 같이 구글 로그인 화면을 볼 수 있어요.

![](/images/posts/gdsc-oauth2-tutorial/473749c8-1ed9-43d4-92ba-29da35283454_image.png)

자신의 아이디로 로그인하면 스프링 서버에서 사용하는 AccessToken을 받을 수 있어요.

![](/images/posts/gdsc-oauth2-tutorial/70b9c3d2-9a05-4cb7-828c-9cedb9692996_image.png)

Postman을 사용하여 "/test" API를 실행하면 자신의 정보를 조회할 수 있어요. (회원가입이 진행되면서 유저 정보가 저장됐어요.)

![](/images/posts/gdsc-oauth2-tutorial/9c8d88d4-aa72-4e2b-bcd2-bcbde8065a90_image.png)

사용자의 아이디와 비밀번호를 직접 암호화하거나 가지고 있지 않아도 로그인을 구현할 수 있어요.

## 참고

- [Google Cloud OAuth 2.0](https://cloud.google.com/apigee/docs/api-platform/security/oauth/oauth-home?hl=ko)
- [Spring Security](https://spring.io/projects/spring-security)
- [참고 블로그](https://darrenlog.tistory.com/40)
- [참고 블로그](https://oozoowos.tistory.com/entry/Spring-Boot-Security-%EC%97%86%EC%9D%B4-OAuth2%EB%A1%9C-Google-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EA%B5%AC%ED%98%84-%EC%9C%A0%EC%A0%80-%EC%A0%95%EB%B3%B4-%EC%96%BB%EA%B8%B0)
