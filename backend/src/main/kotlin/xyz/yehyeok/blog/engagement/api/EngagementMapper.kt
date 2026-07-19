package xyz.yehyeok.blog.engagement.api

import xyz.yehyeok.blog.engagement.api.dto.EngagementFeedItemResponse
import xyz.yehyeok.blog.engagement.api.dto.EngagementMutationResponse
import xyz.yehyeok.blog.engagement.api.dto.EngagementPageResponse
import xyz.yehyeok.blog.engagement.api.dto.EngagementResponse
import xyz.yehyeok.blog.engagement.domain.Engagement
import xyz.yehyeok.blog.engagement.domain.EngagementMutation
import xyz.yehyeok.blog.engagement.domain.EngagementPage

fun Engagement.toResponse(): EngagementResponse = EngagementResponse(slug, likeCount, commentCount, liked)

fun EngagementMutation.toResponse(): EngagementMutationResponse =
    EngagementMutationResponse(
        slug = engagement.slug,
        likeCount = engagement.likeCount,
        commentCount = engagement.commentCount,
        liked = engagement.liked,
        changed = changed,
    )

fun EngagementPage.toResponse(): EngagementPageResponse =
    EngagementPageResponse(
        content = content.map { EngagementFeedItemResponse(it.slug, it.likeCount, it.commentCount) },
        page = page,
        size = size,
        totalElements = totalElements,
        totalPages = totalPages,
        last = last,
    )
