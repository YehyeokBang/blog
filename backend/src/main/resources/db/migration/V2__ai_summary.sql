CREATE TABLE ai_summary (
    slug TEXT PRIMARY KEY,
    content_hash TEXT NOT NULL,
    model_id TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    summary TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CONSTRAINT fk_ai_summary_post FOREIGN KEY (slug) REFERENCES post(slug) ON DELETE CASCADE
);

CREATE TABLE ai_daily_usage (
    usage_date TEXT PRIMARY KEY,
    usage_count INTEGER NOT NULL
);
