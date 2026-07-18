package xyz.yehyeok.blog.post.domain

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.io.Resource
import org.springframework.stereotype.Component
import xyz.yehyeok.blog.post.infra.PostManifestReader

@Component
class PostManifestStartupSynchronizer(
    private val manifestReader: PostManifestReader,
    private val postManifestSynchronizer: PostManifestSynchronizer,
    @Value("classpath:posts.json") private val manifest: Resource,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        postManifestSynchronizer.sync(manifestReader.read(manifest))
    }
}
