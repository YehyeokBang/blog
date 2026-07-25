package xyz.yehyeok.blog.post.domain

data class PostManifestEntry(
    val slug: String,
    val contentHash: String,
    val content: String,
)
