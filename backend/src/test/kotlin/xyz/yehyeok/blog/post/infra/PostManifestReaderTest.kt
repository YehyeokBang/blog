package xyz.yehyeok.blog.post.infra

import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test
import org.springframework.core.io.ByteArrayResource
import tools.jackson.module.kotlin.jacksonObjectMapper

class PostManifestReaderTest {
    private val reader = PostManifestReader(jacksonObjectMapper())

    @Test
    fun `유효한 manifest의 slug를 정렬된 집합으로 읽는다`() {
        // given
        val resource = ByteArrayResource("[\"spring-jpa-osiv\", \"java-enum-guide\"]".toByteArray())

        // when
        val result = reader.read(resource)

        // then
        result shouldBe sortedSetOf("java-enum-guide", "spring-jpa-osiv")
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
        val resource = ByteArrayResource("[\"Invalid_slug\"]".toByteArray())

        // when & then
        shouldThrow<IllegalStateException> {
            reader.read(resource)
        }
    }
}
