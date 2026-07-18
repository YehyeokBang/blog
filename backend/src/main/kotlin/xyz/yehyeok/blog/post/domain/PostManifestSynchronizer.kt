package xyz.yehyeok.blog.post.domain

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import xyz.yehyeok.blog.post.infra.PostRepository

@Service
class PostManifestSynchronizer(
    private val postRepository: PostRepository,
) {
    @Transactional
    fun sync(manifestSlugs: Set<String>) {
        val existingPosts = postRepository.findAll().associateBy { it.slug }
        val synchronizedPosts =
            existingPosts.values.map { post ->
                if (post.slug in manifestSlugs) {
                    post.activate()
                } else {
                    post.deactivate()
                }
                post
            } +
                manifestSlugs
                    .filterNot(existingPosts::containsKey)
                    .map(::Post)
        postRepository.saveAll(synchronizedPosts)
    }
}
