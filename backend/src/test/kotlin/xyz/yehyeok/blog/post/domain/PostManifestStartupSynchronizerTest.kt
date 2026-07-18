package xyz.yehyeok.blog.post.domain

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.core.io.ByteArrayResource
import xyz.yehyeok.blog.post.infra.PostManifestReader

class PostManifestStartupSynchronizerTest {
    private val manifestReader = mockk<PostManifestReader>()
    private val synchronizer = mockk<PostManifestSynchronizer>(relaxed = true)
    private val manifest = ByteArrayResource("[\"java-enum-guide\"]".toByteArray())
    private val startupSynchronizer = PostManifestStartupSynchronizer(manifestReader, synchronizer, manifest)

    @Test
    fun `애플리케이션 시작 시 manifest를 읽어 posts를 동기화한다`() {
        // given
        every { manifestReader.read(manifest) } returns sortedSetOf("java-enum-guide")

        // when
        startupSynchronizer.run(DefaultApplicationArguments())

        // then
        verify(exactly = 1) { synchronizer.sync(sortedSetOf("java-enum-guide")) }
    }
}
