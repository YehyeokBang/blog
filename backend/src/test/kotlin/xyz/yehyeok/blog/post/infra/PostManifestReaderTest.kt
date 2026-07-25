package xyz.yehyeok.blog.post.infra

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test
import org.springframework.core.io.ByteArrayResource
import tools.jackson.module.kotlin.jacksonObjectMapper
import xyz.yehyeok.blog.post.domain.PostManifestEntry

class PostManifestReaderTest {
    private val reader = PostManifestReader(jacksonObjectMapper())

    @Test
    fun `유효한 manifest의 entry를 읽는다`() {
        // given
        val json =
            """
            [
                { "slug": "spring-jpa-osiv", "contentHash": "hash1", "content": "c1" },
                { "slug": "java-enum-guide", "contentHash": "hash2", "content": "c2" }
            ]
            """.trimIndent()
        val resource = ByteArrayResource(json.toByteArray())

        // when
        val result = reader.read(resource)

        // then
        result shouldBe
            listOf(
                PostManifestEntry("spring-jpa-osiv", "hash1", "c1"),
                PostManifestEntry("java-enum-guide", "hash2", "c2"),
            )
    }

    @Test
    fun `빈 manifest는 예외를 던진다`() {
        // given
        val resource = ByteArrayResource("[]".toByteArray())

        // when & then
        shouldThrow<IllegalStateException> {
            reader.read(resource)
        }
    }

    @Test
    fun `허용되지 않은 형식의 slug는 예외를 던진다`() {
        // given
        val json =
            """
            [
                { "slug": "Invalid_slug", "contentHash": "hash", "content": "c" }
            ]
            """.trimIndent()
        val resource = ByteArrayResource(json.toByteArray())

        // when & then
        shouldThrow<IllegalStateException> {
            reader.read(resource)
        }
    }
}
