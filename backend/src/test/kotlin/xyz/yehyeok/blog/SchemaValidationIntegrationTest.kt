package xyz.yehyeok.blog

import io.kotest.matchers.shouldBe
import org.junit.jupiter.api.Test
import org.springframework.boot.WebApplicationType
import org.springframework.boot.builder.SpringApplicationBuilder
import org.springframework.context.ConfigurableApplicationContext
import org.springframework.core.io.ClassPathResource
import org.springframework.core.io.support.EncodedResource
import org.springframework.jdbc.datasource.init.ScriptUtils
import java.nio.file.Files
import java.sql.DriverManager

class SchemaValidationIntegrationTest {
    @Test
    fun `빈 SQLite DB에 전체 migration chain을 적용하면 스키마 검증으로 백엔드가 시작된다`() {
        // given
        val database = Files.createTempFile("blog-schema-validation", ".db")
        val databaseUrl = "jdbc:sqlite:$database"

        try {
            DriverManager.getConnection(databaseUrl).use { connection ->
                ScriptUtils.executeSqlScript(
                    connection,
                    EncodedResource(ClassPathResource("db/migration/V0__core_schema.sql")),
                )
                ScriptUtils.executeSqlScript(
                    connection,
                    EncodedResource(ClassPathResource("db/migration/V1__post_engagement.sql")),
                )
            }

            // when
            val context = startApplication(databaseUrl, "validate")

            // then
            context.isActive shouldBe true
            context.close()
        } finally {
            Files.deleteIfExists(database)
        }
    }

    private fun startApplication(
        databaseUrl: String,
        ddlAuto: String,
    ): ConfigurableApplicationContext =
        SpringApplicationBuilder(BlogBackendApplication::class.java)
            .web(WebApplicationType.NONE)
            .run(
                "--spring.datasource.url=$databaseUrl",
                "--spring.jpa.hibernate.ddl-auto=$ddlAuto",
            )
}
