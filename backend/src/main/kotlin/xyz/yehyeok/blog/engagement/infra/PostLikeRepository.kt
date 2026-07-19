package xyz.yehyeok.blog.engagement.infra

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import xyz.yehyeok.blog.engagement.domain.PostLike

interface PostLikeRepository : JpaRepository<PostLike, Long> {
    fun countByPostId(postId: Long): Long

    fun existsByPostIdAndVisitorId(
        postId: Long,
        visitorId: Long,
    ): Boolean

    @Modifying(flushAutomatically = true)
    @Query(
        value = """
            INSERT OR IGNORE INTO post_like(post_id, visitor_id, created_at)
            VALUES (:postId, :visitorId, CURRENT_TIMESTAMP)
            """,
        nativeQuery = true,
    )
    fun insertIfAbsent(
        @Param("postId") postId: Long,
        @Param("visitorId") visitorId: Long,
    ): Int

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM PostLike p WHERE p.postId = :postId AND p.visitorId = :visitorId")
    fun deleteByPostIdAndVisitorId(
        @Param("postId") postId: Long,
        @Param("visitorId") visitorId: Long,
    ): Int
}
