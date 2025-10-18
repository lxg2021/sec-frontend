-- logic_group.sql
-- 逻辑组表
CREATE TABLE `logic_group` (
  `id` CHAR(36) NOT NULL COMMENT '主键 UUID',
  `parent_id` CHAR(36) DEFAULT NULL COMMENT '父节点 ID（NULL 表示顶层公司）',
  `tenant_id` CHAR(36) DEFAULT NULL COMMENT '所属租户（可选）',
  `name` VARCHAR(255) NOT NULL COMMENT '节点名称',
  `full_path` VARCHAR(512) NOT NULL COMMENT '完整路径，例如：AcmeCorp/安全部/终端组',
  `full_path_ids` JSON DEFAULT NULL COMMENT '层级 ID 数组，用于快速过滤，例如：[1,2,3]',
  `company_name` VARCHAR(255) NOT NULL COMMENT '冗余字段：公司名称',
  `department_name` VARCHAR(255) DEFAULT NULL COMMENT '冗余字段：部门名称',
  `description` TEXT DEFAULT NULL COMMENT '描述',
  `created_by` CHAR(36) NOT NULL COMMENT '创建者用户 ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_parent_id` (`parent_id`),
  INDEX `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='逻辑组表';
