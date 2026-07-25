package xyz.yehyeok.blog.post.domain

import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import xyz.yehyeok.blog.ai.infra.AiSummaryRepository
import xyz.yehyeok.blog.post.infra.PostRepository

@Component
class PostManifestSynchronizer(
    private val postRepository: PostRepository,
    private val aiSummaryRepository: AiSummaryRepository,
) {
    @Transactional
    fun sync(manifestEntries: List<PostManifestEntry>) {
        val manifestSlugs = manifestEntries.map { it.slug }.toSet()
        val existingPosts = postRepository.findAll().associateBy { it.slug }
        val synchronizedPosts =
            existingPosts.values.map { post ->
                if (post.slug in manifestSlugs) {
                    post.activate()
                } else {
                    post.deactivate()
                    aiSummaryRepository.deleteById(post.slug)
                }
                post
            } +
                manifestSlugs
                    .filterNot(existingPosts::containsKey)
                    .map { Post(slug = it) }

        // For existing active posts that changed hash, we also need to invalidate cache
        manifestEntries.forEach { entry ->
            val existing = existingPosts[entry.slug]
            if (existing != null && existing.active) {
                aiSummaryRepository.deleteById(entry.slug)
            }
        }

        postRepository.saveAll(synchronizedPosts)
    }
}
