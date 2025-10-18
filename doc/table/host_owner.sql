-- host_owner.sql
CREATE TABLE IF NOT EXISTS host_owner (
    host_id CHAR(36) NOT NULL COMMENT '主机 ID',
    user_id CHAR(36) NOT NULL COMMENT '用户唯一 ID',
    owner_name VARCHAR(255) NOT NULL COMMENT '用户名',
    phone VARCHAR(50) DEFAULT NULL COMMENT '电话',
    email VARCHAR(255) DEFAULT NULL COMMENT '邮箱',
    owner_role VARCHAR(50) DEFAULT NULL COMMENT '角色（管理员/使用者）',
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    expired_at DATETIME DEFAULT NULL COMMENT '到期时间（可选）',
    PRIMARY KEY (host_id, user_id),
    INDEX idx_owner_name (owner_name),
    INDEX idx_owner_role (owner_role),
    INDEX idx_assigned_at (assigned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主机负责人表';
