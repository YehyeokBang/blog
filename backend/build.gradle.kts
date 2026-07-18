plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.kotlin.jpa)
    alias(libs.plugins.ktlint)
}

group = "xyz.yehyeok"
version = "0.0.1-SNAPSHOT"
description = "Backend for yehyeok blog"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.webmvc)
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.kotlin.reflect)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.kotlin.logging)
    runtimeOnly(libs.sqlite.jdbc)
    implementation(libs.hibernate.community.dialects)
    testImplementation(libs.spring.boot.starter.data.jpa.test)
    testImplementation(libs.spring.boot.starter.webmvc.test)
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.kotlin.test.junit5)
    testRuntimeOnly(libs.junit.platform.launcher)
    testImplementation(libs.mockk)
    testImplementation(libs.kotest.assertions)
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
    doFirst {
        layout.buildDirectory
            .dir("test-db")
            .get()
            .asFile
            .mkdirs()
    }
}

val generatePostsManifest by tasks.registering(Exec::class) {
    workingDir = rootProject.projectDir.parentFile
    commandLine("node", "scripts/generate-posts-manifest.mjs")
}

tasks.processResources {
    dependsOn(generatePostsManifest)
}

ktlint {
    version.set(libs.versions.ktlint.engine)
    android.set(false)
    outputToConsole.set(true)
}
