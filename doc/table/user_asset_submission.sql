CREATE TABLE `user_asset_submission` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  
  -- 用户信息
  `user_id` VARCHAR(64) NOT NULL COMMENT '提交用户ID',
  `user_name` VARCHAR(128) NOT NULL COMMENT '提交用户名',
  
  -- 资产信息
  `host_id` VARCHAR(64) NOT NULL COMMENT '主机ID',
  `host_name` VARCHAR(128) NOT NULL COMMENT '主机名',
  `ip` JSON NOT NULL COMMENT 'IP地址数组',
  `os_name` VARCHAR(64) NOT NULL COMMENT '操作系统名称',
  `os_version` VARCHAR(64) NOT NULL COMMENT '操作系统版本',
  `product_id` VARCHAR(64) DEFAULT NULL COMMENT '产品ID',
  `cpu_id` VARCHAR(64) DEFAULT NULL COMMENT 'CPU ID',
  `harddisk_id` JSON DEFAULT NULL COMMENT '硬盘ID数组',
  `board_serial` VARCHAR(64) DEFAULT NULL COMMENT '主板序列号',
  `macs` JSON NOT NULL COMMENT 'MAC地址数组',
  
  -- 组织信息
  `department_path` VARCHAR(256) DEFAULT NULL COMMENT '部门路径',
  
  -- 用户填写信息
  `owner_name` VARCHAR(128) DEFAULT NULL COMMENT '使用人姓名',
  `owner_role` VARCHAR(64) DEFAULT NULL COMMENT '使用人角色',
  `phone` VARCHAR(32) DEFAULT NULL COMMENT '电话',
  `email` VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
  
  -- 审核相关
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending' COMMENT '审核状态',
  `submit_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  `review_time` DATETIME NULL COMMENT '管理员审核时间',
  `reviewer_id` VARCHAR(64) NULL COMMENT '审核管理员ID',
  `reviewer_name` VARCHAR(128) NULL COMMENT '审核管理员姓名',
  `comments` TEXT NULL COMMENT '审核备注或修改说明',
  
  PRIMARY KEY (`id`),
  INDEX `idx_user_status` (`user_id`, `status`),
  INDEX `idx_status` (`status`),
  INDEX `idx_submit_time` (`submit_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户提交资产的临时表，展开所有字段';
