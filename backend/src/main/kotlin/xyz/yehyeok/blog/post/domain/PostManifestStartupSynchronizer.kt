package xyz.yehyeok.blog.post.domain

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component

@Component
class PostManifestStartupSynchronizer(
    private val postManifestRegistry: PostManifestRegistry,
    private val postManifestSynchronizer: PostManifestSynchronizer,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        postManifestSynchronizer.sync(postManifestRegistry.getAll())
    }
}
