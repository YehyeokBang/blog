package xyz.yehyeok.blog.post.domain

import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test

class PostTest {
    @Test
    fun `새 post는 저장 전 Long 대리키가 없다`() {
        // given
        val post = Post("java-enum-guide")

        // when
        val id = post.id

        // then
        id shouldBe null
    }
}
