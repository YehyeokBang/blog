package xyz.yehyeok.blog.comment.api

import org.hamcrest.Matchers.containsString
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import xyz.yehyeok.blog.comment.infra.CommentRepository
import xyz.yehyeok.blog.post.domain.Post
import xyz.yehyeok.blog.post.infra.PostRepository

@SpringBootTest
@AutoConfigureMockMvc
class CommentControllerIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var postRepository: PostRepository

    @Autowired
    lateinit var commentRepository: CommentRepository

    @BeforeEach
    fun setUp() {
        commentRepository.deleteAll()
        postRepository.deleteAll()
        postRepository.save(Post("active-post"))
        postRepository.save(Post("inactive-post", active = false))
    }

    @Test
    fun `active slug 댓글 작성은 201과 Location을 반환한다`() {
        // given
        val body = """{"authorName":"활기찬고양이","authorAvatar":"https://example.com/avatar.svg","content":"댓글입니다"}"""

        // when & then
        mockMvc
            .perform(post("/api/posts/active-post/comments").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated)
            .andExpect(header().string("Location", containsString("/api/posts/active-post/comments/")))
            .andExpect(jsonPath("$.content").value("댓글입니다"))
    }

    @Test
    fun `inactive slug 댓글 작성은 404 ProblemDetail을 반환한다`() {
        // given
        val body = """{"authorName":"활기찬고양이","authorAvatar":"https://example.com/avatar.svg","content":"댓글입니다"}"""

        // when & then
        mockMvc
            .perform(post("/api/posts/inactive-post/comments").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("NOT_FOUND"))
    }

    @Test
    fun `없는 slug 댓글 조회는 빈 배열을 반환한다`() {
        // given

        // when & then
        mockMvc
            .perform(get("/api/posts/unknown-post/comments"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andExpect(jsonPath("$").isEmpty)
    }
}
