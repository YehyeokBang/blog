package xyz.yehyeok.blog.post.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id

@Entity
class Post(
    @Column(nullable = false, unique = true, updatable = false)
    var slug: String,
    @Column(nullable = false)
    var active: Boolean = true,
) {
    @Id
    @Column(columnDefinition = "INTEGER")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set

    fun activate() {
        active = true
    }

    fun deactivate() {
        active = false
    }
}
