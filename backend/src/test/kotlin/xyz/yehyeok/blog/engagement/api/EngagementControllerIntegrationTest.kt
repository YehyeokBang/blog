package xyz.yehyeok.blog.engagement.api

import org.hamcrest.Matchers.containsString
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.HttpHeaders
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import xyz.yehyeok.blog.comment.domain.Comment
import xyz.yehyeok.blog.comment.infra.CommentRepository
import xyz.yehyeok.blog.engagement.infra.AnonymousVisitorRepository
import xyz.yehyeok.blog.engagement.infra.PostLikeRepository
import xyz.yehyeok.blog.post.domain.Post
import xyz.yehyeok.blog.post.infra.PostRepository

@SpringBootTest
@AutoConfigureMockMvc
class EngagementControllerIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var postRepository: PostRepository

    @Autowired
    lateinit var commentRepository: CommentRepository

    @Autowired
    lateinit var anonymousVisitorRepository: AnonymousVisitorRepository

    @Autowired
    lateinit var postLikeRepository: PostLikeRepository

    @Autowired
    lateinit var jdbcTemplate: JdbcTemplate

    @BeforeEach
    fun setUp() {
        postLikeRepository.deleteAll()
        anonymousVisitorRepository.deleteAll()
        jdbcTemplate.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS uk_post_like_post_visitor ON post_like(post_id, visitor_id)",
        )
        commentRepository.deleteAll()
        postRepository.deleteAll()
        postRepository.save(Post("active-post"))
        postRepository.save(Post("inactive-post", active = false))
        commentRepository.save(
            Comment(
                postSlug = "active-post",
                authorName = "활기찬고양이",
                authorAvatar = "https://example.com/avatar.svg",
                content = "기존 댓글",
            ),
        )
    }

    @Test
    fun `목록 projection은 active post의 좋아요와 댓글 수를 함께 반환한다`() {
        // given

        // when & then
        mockMvc
            .perform(get("/api/post-engagements").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].slug").value("active-post"))
            .andExpect(jsonPath("$.content[0].likeCount").value(0))
            .andExpect(jsonPath("$.content[0].commentCount").value(1))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").value(20))
    }

    @Test
    fun `좋아요 선택과 취소는 cookie를 통해 멱등적으로 동작한다`() {
        // given
        val origin = "http://localhost:3000"

        // when
        val firstLike =
            mockMvc
                .perform(put("/api/posts/active-post/like").header(HttpHeaders.ORIGIN, origin))
                .andExpect(status().isOk)
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("blog_anonymous_id=")))
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.changed").value(true))
                .andExpect(jsonPath("$.likeCount").value(1))
                .andReturn()
        val cookie = requireNotNull(firstLike.response.getCookie("blog_anonymous_id"))

        // then
        mockMvc
            .perform(put("/api/posts/active-post/like").header(HttpHeaders.ORIGIN, origin).cookie(cookie))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.changed").value(false))
            .andExpect(jsonPath("$.likeCount").value(1))

        mockMvc
            .perform(delete("/api/posts/active-post/like").header(HttpHeaders.ORIGIN, origin).cookie(cookie))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.liked").value(false))
            .andExpect(jsonPath("$.changed").value(true))
            .andExpect(jsonPath("$.likeCount").value(0))
    }

    @Test
    fun `다른 origin의 좋아요 변경은 403을 반환한다`() {
        // given

        // when & then
        mockMvc
            .perform(put("/api/posts/active-post/like").header(HttpHeaders.ORIGIN, "https://attacker.example"))
            .andExpect(status().isForbidden)
            .andExpect(jsonPath("$.code").value("FORBIDDEN"))
    }
}
