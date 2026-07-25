package xyz.yehyeok.blog.post.infra

import org.springframework.core.io.Resource
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import xyz.yehyeok.blog.post.domain.PostManifestEntry

private val slugPattern = Regex("^[a-z0-9]+(?:-[a-z0-9]+)*$")

@Component
class PostManifestReader(
    private val objectMapper: ObjectMapper,
) {
    fun read(resource: Resource): List<PostManifestEntry> {
        val entries =
            resource.inputStream.use { inputStream ->
                objectMapper.readValue<List<PostManifestEntry>>(inputStream)
            }
        check(entries.isNotEmpty()) { "posts manifest는 비어 있을 수 없습니다" }
        check(entries.size == entries.distinctBy { it.slug }.size) { "posts manifest에 중복 slug가 있습니다" }
        check(entries.all { slugPattern.matches(it.slug) }) { "posts manifest에 허용되지 않은 slug가 있습니다" }
        return entries
    }
}
