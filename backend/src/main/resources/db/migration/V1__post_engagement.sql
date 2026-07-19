CREATE TABLE anonymous_visitor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE post_like (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    visitor_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE RESTRICT,
    CONSTRAINT fk_post_like_visitor FOREIGN KEY (visitor_id) REFERENCES anonymous_visitor(id) ON DELETE CASCADE,
    CONSTRAINT uk_post_like_post_visitor UNIQUE (post_id, visitor_id)
);

CREATE INDEX idx_post_like_post_id ON post_like(post_id);
CREATE INDEX idx_comment_post_slug ON comment(post_slug);
