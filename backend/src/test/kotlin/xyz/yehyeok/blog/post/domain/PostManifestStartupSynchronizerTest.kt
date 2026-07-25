package xyz.yehyeok.blog.post.domain

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.boot.DefaultApplicationArguments

class PostManifestStartupSynchronizerTest {
    private val postManifestRegistry = mockk<PostManifestRegistry>()
    private val synchronizer = mockk<PostManifestSynchronizer>(relaxed = true)
    private val startupSynchronizer = PostManifestStartupSynchronizer(postManifestRegistry, synchronizer)

    @Test
    fun `애플리케이션 시작 시 manifest를 읽어 posts를 동기화한다`() {
        // given
        every { postManifestRegistry.getAll() } returns listOf(PostManifestEntry("java-enum-guide", "hash", "c"))

        // when
        startupSynchronizer.run(DefaultApplicationArguments())

        // then
        verify(exactly = 1) { synchronizer.sync(listOf(PostManifestEntry("java-enum-guide", "hash", "c"))) }
    }
}
