-- host.sql
CREATE TABLE IF NOT EXISTS host (
    host_id CHAR(36) NOT NULL COMMENT '主机唯一 ID',
    hostname VARCHAR(255) NOT NULL COMMENT '主机名',
    ip VARCHAR(50) NOT NULL COMMENT 'IP 地址',
    os_name VARCHAR(100) NOT NULL COMMENT '操作系统',
    os_version VARCHAR(100) NOT NULL COMMENT '系统版本',
    product_id VARCHAR(100) NOT NULL COMMENT '系统产品ID',
    cpu_id VARCHAR(100) NOT NULL COMMENT 'CPU ID',
    harddisk_id JSON NOT NULL COMMENT '硬盘 IDs 列表',
    board_serial VARCHAR(100) NOT NULL COMMENT '主板序列号',
    macs JSON NOT NULL COMMENT 'MAC 地址列表',
    group_id CHAR(36) DEFAULT NULL COMMENT '当前所属逻辑组 ID',
    heartbeat_time DATETIME NOT NULL COMMENT '最近心跳时间',
    status ENUM('online','offline','inactive') NOT NULL COMMENT '主机状态',
    PRIMARY KEY (host_id),
    INDEX idx_group_id (group_id),
    INDEX idx_status (status),
    INDEX idx_heartbeat_time (heartbeat_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主机心跳表';
