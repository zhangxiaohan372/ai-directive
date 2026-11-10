-- ==============================================================================
-- 迷雾剧场（MysteryStage）- PostgreSQL 生产级数据模型 Schema
-- 《午夜画廊》AI 互动推理剧本杀
-- ==============================================================================

-- 1. 房间主表
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    room_code VARCHAR(12) UNIQUE NOT NULL,
    phase VARCHAR(32) NOT NULL DEFAULT 'BRIEFING',
    host_player_id VARCHAR(64) NOT NULL,
    case_id VARCHAR(64) NOT NULL DEFAULT 'case_midnight_gallery_01',
    hint_level INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 玩家表
CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    avatar VARCHAR(16) DEFAULT '🕵️',
    is_host BOOLEAN DEFAULT FALSE,
    is_bot BOOLEAN DEFAULT FALSE,
    ready BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 勘验搜查与已解锁物证表
CREATE TABLE IF NOT EXISTS discovered_clues (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    clue_id VARCHAR(64) NOT NULL,
    discovered_by VARCHAR(64) REFERENCES players(id),
    location_id VARCHAR(64) NOT NULL,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, clue_id)
);

-- 4. 案件推演关联链 (线索 -> 人物 / 时间线)
CREATE TABLE IF NOT EXISTS clue_links (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    clue_id VARCHAR(64) NOT NULL,
    target_id VARCHAR(64) NOT NULL, -- suspectId 或 timelineIndex
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. 玩家笔记表
CREATE TABLE IF NOT EXISTS player_notes (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    player_id VARCHAR(64) REFERENCES players(id) ON DELETE CASCADE,
    note_content TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, player_id)
);

-- 6. 对话与审问记录表
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    sender_name VARCHAR(64) NOT NULL,
    sender_role VARCHAR(32) NOT NULL, -- 'host' | 'suspect' | 'player' | 'system'
    suspect_id VARCHAR(32),
    content TEXT NOT NULL,
    emotion VARCHAR(32),
    spoiler_risk NUMERIC(3, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. 案件审计日志与防剧透拦截表 (Security & Audit)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL, -- 'INSPECT_LOCATION' | 'REVEAL_HINT' | 'SUBMIT_VOTE' | 'MCP_TOOL'
    actor_id VARCHAR(64),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spoiler_interceptions (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    risk_score NUMERIC(3, 2) NOT NULL,
    interception_reason TEXT,
    sanitized_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. 终局投票指控表
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    player_id VARCHAR(64) REFERENCES players(id) ON DELETE CASCADE,
    suspect_id VARCHAR(32) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, player_id)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_room_clues ON discovered_clues(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_room_audit ON audit_logs(room_id, created_at);
