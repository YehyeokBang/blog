package xyz.yehyeok.blog.post.domain

import jakarta.annotation.PostConstruct
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.io.Resource
import org.springframework.stereotype.Component
import xyz.yehyeok.blog.post.infra.PostManifestReader

@Component
class PostManifestRegistry(
    private val manifestReader: PostManifestReader,
    @Value("classpath:posts.json") private val manifestResource: Resource,
) {
    private lateinit var entries: Map<String, PostManifestEntry>

    @PostConstruct
    fun init() {
        entries = manifestReader.read(manifestResource).associateBy { it.slug }
    }

    fun get(slug: String): PostManifestEntry? = entries[slug]

    fun getAll(): List<PostManifestEntry> = entries.values.toList()
}
