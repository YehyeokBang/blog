package xyz.yehyeok.blog

import io.kotest.matchers.types.shouldBeInstanceOf
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.web.context.WebApplicationContext

@SpringBootTest
class BlogBackendApplicationTests {
    @Autowired
    private lateinit var applicationContext: ApplicationContext

    @Test
    fun contextLoads() {
    }

    @Test
    fun `server application type should be Servlet WebMVC, not WebFlux`() {
        applicationContext.shouldBeInstanceOf<WebApplicationContext>()

        val contextClassName = applicationContext::class.java.name
        // Reactive web context class name shouldn't be the context class
        if (contextClassName.contains("Reactive")) {
            throw AssertionError("ApplicationContext should not be reactive, but was: $contextClassName")
        }
    }
}
