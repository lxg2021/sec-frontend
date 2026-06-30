# Graph 后台返回契约

本文记录后台 Graph 服务返回到前端的节点、边结构。字段来自后台 `sec-server` 的 Graph proto、Neo4j projection、resolver 和 projection view。

## 1. 查询返回结构

### 1.1 GraphNode

`GraphNode` 是所有节点统一返回结构。

| KEY | VALUE |
| --- | --- |
| `key` | 节点唯一 key |
| `entity_type` | 节点实体类型，例如 `Process`、`File`、`RegistryKey` |
| `display_name` | 后台根据节点属性推导出的展示名 |
| `properties` | 节点属性集合，类型为 `Record<string, string>` |

说明：

| KEY | VALUE |
| --- | --- |
| 字段来源 | Neo4j `properties(n)` |
| 空值处理 | 空字符串不会返回 |
| 类型处理 | 后台最终会转成 `map<string,string>`，前端收到的属性值都是字符串 |
| `display_name` 规则 | 优先取 `display_name/name/process_name/computer_name/device_description/service_name/job_name/task_name/user_name/group_name/class_name/url/path/file_name/org_file_name/object_name/query`，否则尝试 `process_image` basename、endpoint、account 等 |

### 1.2 GraphEdge

`GraphEdge` 是所有边统一返回结构。

| KEY | VALUE |
| --- | --- |
| `scope_type` | 图作用域类型，例如 `case`、`positioning` |
| `scope_id` | 图作用域 ID，例如 `case_id` 或 positioning scope id |
| `relation_type` | 边关系类型，例如 `PROCESS_CREATE_PROCESS` |
| `source_key` | 起点节点 key |
| `target_key` | 终点节点 key |
| `edge_key` | 多边或特殊关系的补充 key；很多普通边为空字符串 |
| `graph_origin` | 图来源，例如 `scope_case`、`scope_drill`、`scope_positioning`、`case_entity_closure` |
| `properties` | 边属性集合，类型为 `Record<string, string>` |

说明：

| KEY | VALUE |
| --- | --- |
| 字段来源 | Neo4j `properties(r)` |
| 空值处理 | 空字符串不会返回 |
| 类型处理 | 后台最终会转成 `map<string,string>`，前端收到的属性值都是字符串 |
| `relation_type` 来源 | projection view 通过 Neo4j `type(r)` 返回真实关系标签；除 `relation_types.go` 常量外，历史/兼容 Cypher 关系标签也可能被前端收到 |
| 去重建议 | 普通边不要只依赖 `edge_key`，建议使用 `scope_type + scope_id + relation_type + source_key + target_key + graph_origin + edge_key` |

### 1.3 Scope / Origin

| KEY | VALUE |
| --- | --- |
| `scope_type=case` | 攻击事件 Case 图 |
| `scope_type=positioning` | 定位图 |
| `graph_origin=scope_case` | Case 初始图 |
| `graph_origin=scope_drill` | 钻探追加图 |
| `graph_origin=scope_positioning` | 定位图 |
| `graph_origin=case_entity_closure` | Case projection view 补充展示用闭包边 |

## 2. 节点索引

### 2.1 业务实体节点

| ENTITY_TYPE | DOMAIN | PROPERTIES KEYS |
| --- | --- | --- |
| `Account` | 账号 | `key`, `tenant_id`, `scope_kind`, `agent_id`, `sid`, `domain`, `user`, `updated_at` |
| `AccountGroup` | 账号组 | `key`, `tenant_id`, `scope_kind`, `agent_id`, `sid`, `domain`, `group_name`, `updated_at` |
| `Bits` | BITS 任务 | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `job_id`, `job_type`, `job_type_desc`, `job_name`, `job_files`, `job_status`, `job_status_desc`, `unique_id`, `updated_at` |
| `CredentialTheft` | 凭据窃取 | `key`, `tenant_id`, `agent_id`, `process_guid`, `boot_time`, `occurred_at`, `cred_type`, `cred_desc`, `unique_id`, `updated_at` |
| `Crypto` | 加密行为 | `key`, `tenant_id`, `agent_id`, `process_guid`, `boot_time`, `occurred_at`, `crypt_flag`, `crypt_flag_description`, `operation_kind`, `unique_id`, `updated_at` |
| `Device` | 设备 | `key`, `tenant_id`, `agent_id`, `hid`, `device_guid`, `device_type`, `device_description`, `device_flag`, `device_flag_description`, `updated_at` |
| `DnsName` | DNS 名称 | `key`, `tenant_id`, `domain`, `updated_at` |
| `File` | 文件 | `key`, `tenant_id`, `agent_id`, `file_name`, `occurred_at`, `file_md5`, `file_class`, `file_class_description`, `file_format`, `file_format_description`, `signature`, `sign_vendor`, `org_file_name`, `driver_type`, `description`, `file_type`, `number`, `detection_major_type`, `detection_minor_type`, `detection_content`, `unique_id`, `updated_at` |
| `FileMapping` | 文件映射 | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `file_mapping_name`, `unique_id`, `updated_at` |
| `FileStream` | 文件流 / ADS | `key`, `tenant_id`, `agent_id`, `base_path`, `stream_name`, `occurred_at`, `file_md5`, `file_class`, `file_class_description`, `file_format`, `file_format_description`, `driver_type`, `unique_id`, `updated_at` |
| `Host` | 主机 | `key`, `tenant_id`, `agent_id`, `domain`, `computer_name`, `ips`, `unique_id`, `last_seen_at`, `updated_at` |
| `HostRef` | 远端主机引用 | `key`, `tenant_id`, `server_name`, `updated_at` |
| `MailSlot` | MailSlot IPC | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `mail_slot_name`, `unique_id`, `updated_at` |
| `Mbr` | MBR | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `physical_name`, `driver_type`, `unique_id`, `updated_at` |
| `MessageHook` | 消息钩子 | `key`, `tenant_id`, `agent_id`, `process_guid`, `boot_time`, `occurred_at`, `hook_type`, `hook_type_description`, `message_hook_module`, `module_fingerprint`, `unique_id`, `updated_at` |
| `NamedEvent` | 命名事件 | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `event_name`, `manual_reset`, `initial_state`, `desired_access`, `inherit_handle`, `number`, `unique_id`, `updated_at` |
| `NamedPipe` | 命名管道 | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `pipe_name`, `unique_id`, `updated_at` |
| `NetAddress` | 网络地址 | `key`, `tenant_id`, `ip`, `is_ipv6`, `updated_at` |
| `NetEndpoint` | 网络端点 | `key`, `tenant_id`, `ip`, `port`, `protocol`, `is_ipv6`, `updated_at` |
| `PowerShellExecution` | PowerShell 执行 | `key`, `tenant_id`, `agent_id`, `process_guid`, `boot_time`, `occurred_at`, `process_command_line`, `file_name`, `session_id`, `content`, `script_fingerprint`, `unique_id`, `updated_at` |
| `Process` | 进程 | `key`, `tenant_id`, `agent_id`, `process_guid`, `boot_time`, `occurred_at`, `user_id`, `session`, `process_id`, `process_name`, `process_image`, `process_command_line`, `process_md5`, `org_file_name`, `driver_type`, `signature`, `sign_vendor`, `rtlo`, `show_window_flag`, `unique_id`, `updated_at` |
| `RegistryKey` | 注册表键 | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `object_name`, `description`, `classification`, `unique_id`, `updated_at` |
| `RegistryValue` | 注册表值 | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `object_name`, `object_value`, `description`, `classification`, `unique_id`, `updated_at` |
| `ScheduledJob` | Scheduled Job | `key`, `tenant_id`, `agent_id`, `boot_time`, `occurred_at`, `job_id`, `days_of_month`, `days_of_week`, `first_execute_time`, `command`, `job_binary_path_name`, `job_binary_md5`, `flag`, `unique_id`, `updated_at` |
| `Service` | 服务 | `key`, `tenant_id`, `agent_id`, `service_name`, `occurred_at`, `display_name`, `service_type`, `start_type`, `service_binary_md5`, `service_start_name`, `service_binary_path_name`, `unique_id`, `updated_at` |
| `Task` | 计划任务 | `key`, `tenant_id`, `scope_kind`, `scope_value`, `boot_time`, `occurred_at`, `domain`, `user`, `server_name`, `task_path`, `task_name`, `task_image_paths`, `task_image_md5s`, `task_trigger_types`, `unique_id`, `updated_at` |
| `TokenImpersonation` | Token impersonation | `key`, `tenant_id`, `agent_id`, `process_guid`, `boot_time`, `occurred_at`, `operator_token_context`, `target_token_context`, `token_flag`, `token_flag_description`, `operator_token_fingerprint`, `target_token_fingerprint`, `unique_id`, `updated_at` |
| `URLResource` | URL 资源 | `key`, `tenant_id`, `url`, `updated_at` |
| `Volume` | 卷 | `key`, `tenant_id`, `agent_id`, `file_name`, `driver_type`, `occurred_at`, `access_type`, `unique_id`, `updated_at` |
| `WmiClass` | WMI Class | `key`, `tenant_id`, `scope_kind`, `scope_value`, `server_name`, `normalized_server_name`, `user`, `namespace`, `class_name`, `class_path`, `super_class_name`, `class_attributes`, `boot_time`, `occurred_at`, `unique_id`, `updated_at` |
| `WmiConsumer` | WMI Consumer | `key`, `tenant_id`, `scope_kind`, `scope_value`, `server_name`, `normalized_server_name`, `user`, `namespace`, `class_name`, `event_consumer_name`, `event_consumer_type`, `event_consumer_type_description`, `event_consumer_context`, `boot_time`, `occurred_at`, `unique_id`, `updated_at` |
| `WmiExecute` | WMI Execute | `key`, `tenant_id`, `agent_id`, `process_guid`, `scope_kind`, `scope_value`, `target_scope`, `server_name`, `normalized_server_name`, `user`, `namespace`, `class_name`, `method_name`, `method_parameters`, `parameters_fingerprint`, `has_explicit_credential`, `boot_time`, `occurred_at`, `unique_id`, `updated_at` |
| `WmiFilter` | WMI Filter | `key`, `tenant_id`, `scope_kind`, `scope_value`, `server_name`, `normalized_server_name`, `user`, `namespace`, `event_filter_name`, `event_filter_access`, `event_filter_class`, `query`, `query_language`, `boot_time`, `occurred_at`, `unique_id`, `updated_at` |
| `WmiQuery` | WMI Query | `key`, `tenant_id`, `agent_id`, `process_guid`, `scope_kind`, `scope_value`, `target_scope`, `server_name`, `normalized_server_name`, `user`, `namespace`, `query`, `query_language`, `query_fingerprint`, `has_explicit_credential`, `boot_time`, `occurred_at`, `unique_id`, `updated_at` |

### 2.2 Case 结构节点

| ENTITY_TYPE | DOMAIN | PROPERTIES KEYS |
| --- | --- | --- |
| `AttackCase` | Case 根节点 | `key`, `case_id`, `tenant_id`, `title`, `summary`, `severity`, `primary_phase`, `phases`, `start_time`, `end_time`, `rule_count`, `group_count`, `instance_count`, `evidence_count`, `host_count`, `rule_ids`, `agent_ids`, `last_event_id`, `last_request_id`, `last_trigger_source`, `last_change_type`, `last_occurred_at`, `projection_version`, `updated_at` |
| `AttackCaseGroup` | Case Group | `key`, `group_id`, `case_id`, `tenant_id`, `rule_id`, `agent_id`, `primary_phase`, `phases`, `start_time`, `end_time`, `instance_count`, `evidence_count`, `updated_at` |
| `AttackCaseInstance` | Case Instance | `key`, `instance_id`, `case_id`, `group_id`, `tenant_id`, `rule_id`, `agent_id`, `primary_phase`, `phases`, `start_time`, `end_time`, `evidence_count`, `updated_at` |
| `AttackCaseEvidence` | Case Evidence | `key`, `evidence_id`, `case_id`, `group_id`, `instance_id`, `tenant_id`, `rule_id`, `agent_id`, `source_unique_id`, `event_type`, `event_name`, `occurred_at`, `ioc_evidence_count`, `ioc_max_risk_score`, `ioc_max_confidence`, `ioc_indicator_keys`, `ioc_entry_ids`, `ioc_types`, `ioc_evidences_json`, `updated_at` |

## 3. 节点字段字典

### 3.1 通用字段

| KEY | VALUE |
| --- | --- |
| `key` | 节点唯一 key |
| `tenant_id` | 租户 ID |
| `agent_id` | Agent ID |
| `boot_time` | 事件上报的 BootTime |
| `occurred_at` | 事件发生时间，通常来自事件字段 `Time` |
| `unique_id` | 事件唯一 ID |
| `updated_at` | 图节点更新时间 |
| `scope_kind` | 作用域类别，例如本机/远端/域等归一化范围 |
| `scope_value` | 作用域值 |

### 3.2 进程与执行字段

| KEY | VALUE |
| --- | --- |
| `process_guid` | 标准化后的 ProcessGuid，小写并去掉 `{}` |
| `process_id` | PID，数字字符串 |
| `process_name` | 进程名，小写 |
| `process_image` | 进程路径，小写，路径分隔符标准化为 `/` |
| `process_command_line` | 进程命令行，连续空白会被压缩 |
| `process_md5` | 进程文件 MD5，小写 |
| `user_id` | 用户 SID，小写 |
| `session` | Session ID |
| `org_file_name` | 原始文件名，小写 |
| `driver_type` | 驱动/文件来源类型，数字字符串 |
| `signature` | 签名状态，数字字符串 |
| `sign_vendor` | 签名厂商 |
| `rtlo` | RTLO 标记，数字字符串 |
| `show_window_flag` | 窗口显示标记，数字字符串 |
| `script_fingerprint` | PowerShell 脚本内容指纹 |
| `session_id` | PowerShell Session ID |
| `content` | PowerShell 内容 |

### 3.3 文件、注册表、服务、任务字段

| KEY | VALUE |
| --- | --- |
| `file_name` | 文件路径或卷路径 |
| `file_md5` | 文件 MD5 |
| `file_class` | 文件分类 |
| `file_class_description` | 文件分类描述 |
| `file_format` | 文件格式 |
| `file_format_description` | 文件格式描述 |
| `file_type` | 文件类型 |
| `number` | 事件数量或对象数量 |
| `description` | 描述 |
| `detection_major_type` | 检测大类 |
| `detection_minor_type` | 检测小类 |
| `detection_content` | 检测内容 |
| `base_path` | ADS 基础路径 |
| `stream_name` | ADS 流名 |
| `file_mapping_name` | FileMapping 名称 |
| `object_name` | 注册表键/值对象名 |
| `object_value` | 注册表值内容 |
| `classification` | 注册表分类 |
| `service_name` | 服务名 |
| `display_name` | 服务显示名或通用显示名 |
| `service_type` | 服务类型 |
| `start_type` | 服务启动类型 |
| `service_binary_md5` | 服务二进制 MD5 |
| `service_start_name` | 服务启动账户 |
| `service_binary_path_name` | 服务二进制路径 |
| `task_path` | 计划任务路径 |
| `task_name` | 计划任务名称 |
| `task_image_paths` | 任务镜像路径数组 |
| `task_image_md5s` | 任务镜像 MD5 数组 |
| `task_trigger_types` | 任务触发器类型数组 |
| `job_id` | BITS 或 ScheduledJob ID |
| `job_name` | BITS 任务名 |
| `job_files` | BITS 文件列表 |
| `job_status` | BITS 状态 |
| `job_status_desc` | BITS 状态描述 |
| `job_type` | BITS 任务类型 |
| `job_type_desc` | BITS 任务类型描述 |
| `days_of_month` | ScheduledJob 月日期 |
| `days_of_week` | ScheduledJob 周日期 |
| `first_execute_time` | ScheduledJob 首次执行时间 |
| `command` | ScheduledJob 命令 |
| `job_binary_path_name` | ScheduledJob 二进制路径 |
| `job_binary_md5` | ScheduledJob 二进制 MD5 |
| `flag` | 标志位 |

### 3.4 网络、IPC、设备、WMI 字段

| KEY | VALUE |
| --- | --- |
| `domain` | 域名、账号域或主机域 |
| `computer_name` | 主机名 |
| `ips` | IP 数组 |
| `ip` | IP 地址 |
| `is_ipv6` | 是否 IPv6 |
| `port` | 端口 |
| `protocol` | 协议 |
| `url` | URL |
| `server_name` | 远端服务器名 |
| `normalized_server_name` | 标准化后的服务器名 |
| `hid` | 设备 HID |
| `device_guid` | 设备 GUID |
| `device_type` | 设备类型 |
| `device_description` | 设备描述 |
| `device_flag` | 设备状态标记 |
| `device_flag_description` | 设备状态描述 |
| `physical_name` | 物理设备名，例如 MBR 物理盘 |
| `mail_slot_name` | MailSlot 名称 |
| `pipe_name` | NamedPipe 名称 |
| `event_name` | 命名事件名或 Evidence 事件名 |
| `manual_reset` | NamedEvent manual reset |
| `initial_state` | NamedEvent 初始状态 |
| `desired_access` | 访问掩码 |
| `inherit_handle` | 句柄继承标记 |
| `namespace` | WMI namespace |
| `class_name` | WMI class name |
| `class_path` | WMI class path |
| `super_class_name` | WMI superclass |
| `class_attributes` | WMI class attributes |
| `event_consumer_name` | WMI consumer 名称 |
| `event_consumer_type` | WMI consumer 类型 |
| `event_consumer_type_description` | WMI consumer 类型描述 |
| `event_consumer_context` | WMI consumer 上下文 |
| `event_filter_name` | WMI filter 名称 |
| `event_filter_access` | WMI filter access |
| `event_filter_class` | WMI filter class |
| `query` | WMI 查询或通用查询 |
| `query_language` | 查询语言 |
| `query_fingerprint` | 查询指纹 |
| `target_scope` | WMI 目标 scope |
| `method_name` | WMI 方法名 |
| `method_parameters` | WMI 方法参数 |
| `parameters_fingerprint` | WMI 参数指纹 |
| `has_explicit_credential` | 是否包含显式凭据 |

### 3.5 账号、安全、Case 字段

| KEY | VALUE |
| --- | --- |
| `sid` | Windows SID |
| `user` | 用户名 |
| `group_name` | 账号组名 |
| `cred_type` | 凭据窃取类型 |
| `cred_desc` | 凭据窃取描述 |
| `crypt_flag` | 加密行为标记 |
| `crypt_flag_description` | 加密行为描述 |
| `operation_kind` | 加密操作类型 |
| `hook_type` | 消息钩子类型 |
| `hook_type_description` | 消息钩子类型描述 |
| `message_hook_module` | 消息钩子模块路径 |
| `module_fingerprint` | 模块指纹 |
| `operator_token_context` | 操作者 token 上下文 |
| `target_token_context` | 目标 token 上下文 |
| `token_flag` | token 操作标记 |
| `token_flag_description` | token 操作描述 |
| `operator_token_fingerprint` | 操作者 token 指纹 |
| `target_token_fingerprint` | 目标 token 指纹 |
| `case_id` | Case ID |
| `group_id` | Case Group ID |
| `instance_id` | Case Instance ID |
| `evidence_id` | Case Evidence ID |
| `title` | Case 标题 |
| `summary` | Case 摘要 |
| `severity` | Case 严重级别 |
| `primary_phase` | 主 ATT&CK 阶段 |
| `phases` | ATT&CK 阶段数组 |
| `start_time` | Case/Group/Instance 开始时间 |
| `end_time` | Case/Group/Instance 结束时间 |
| `rule_id` | 规则 ID |
| `rule_ids` | 规则 ID 数组 |
| `agent_ids` | Agent ID 数组 |
| `rule_count` | 规则数量 |
| `group_count` | Group 数量 |
| `instance_count` | Instance 数量 |
| `evidence_count` | Evidence 数量 |
| `host_count` | 主机数量 |
| `source_unique_id` | Evidence 对应原始事件 UniqueID |
| `event_type` | Evidence 对应原始事件类型 |
| `ioc_evidence_count` | IOC evidence 数量 |
| `ioc_max_risk_score` | IOC 最大风险分 |
| `ioc_max_confidence` | IOC 最大置信度 |
| `ioc_indicator_keys` | IOC indicator key 数组 |
| `ioc_entry_ids` | IOC entry id 数组 |
| `ioc_types` | IOC 类型数组 |
| `ioc_evidences_json` | IOC evidence JSON |
| `last_event_id` | 最近一次 Case projection 事件 ID |
| `last_request_id` | 最近一次 Case projection request ID |
| `last_trigger_source` | 最近一次触发来源 |
| `last_change_type` | 最近一次变更类型 |
| `last_occurred_at` | 最近一次事件发生时间 |
| `projection_version` | Case projection 版本 |

## 4. 边索引

### 4.1 Case 结构边

| RELATION_TYPE | SOURCE -> TARGET | BUSINESS PROPERTIES |
| --- | --- | --- |
| `CASE_HAS_GROUP` | `AttackCase` -> `AttackCaseGroup` | `display_order` |
| `GROUP_HAS_INSTANCE` | `AttackCaseGroup` -> `AttackCaseInstance` | `display_order` |
| `INSTANCE_HAS_EVIDENCE` | `AttackCaseInstance` -> `AttackCaseEvidence` | `display_order` |
| `EVIDENCE_REFER_ENTITY` | `AttackCaseEvidence` -> 任意业务实体 | `role`, `entity_key`, `entity_type`, `display_order`, `evidence_id`, `case_id`, `group_id`, `instance_id`, `tenant_id`, `rule_id`, `agent_id`, `source_unique_id`, `event_type`, `event_name`, `occurred_at` |

### 4.2 Process 与执行行为边

| RELATION_TYPE | SOURCE -> TARGET | BUSINESS PROPERTIES |
| --- | --- | --- |
| `PROCESS_CREATE_PROCESS` | 父 `Process` -> 子 `Process` | `created_at` |
| `PROCESS_TERMINATE_PROCESS` | 操作者 `Process` -> 目标 `Process` | `self_exit` |
| `PROCESS_ACCESS_PROCESS` | 操作者 `Process` -> 目标 `Process` | `occurred_at`, `granted_access`, `call_trace` |
| `PROCESS_CROSS_MEMORY_EXECUTE` | 操作者 `Process` -> 目标 `Process` | `occurred_at`, `address`, `page_protect` |
| `PROCESS_CREATE_REMOTE_THREAD` | 操作者 `Process` -> 目标 `Process` | `occurred_at`, `thread_id` |
| `PROCESS_ADJUST_TOKEN_PRIVILEGES` | 操作者 `Process` -> 目标 `Process` | `occurred_at`, `privileges`, `token_flag`, `token_flag_description`, `self` |
| `PROCESS_SET_TOKEN` | 父/操作者 `Process` -> 目标 `Process` | `occurred_at`, `operator_token_context`, `target_token_context`, `token_flag`, `token_flag_description` |
| `PROCESS_EXECUTE_CRYPTO` | `Process` -> `Crypto` | `event_count`, `first_seen_at`, `last_seen_at`, `first_source_unique_id`, `last_source_unique_id` |
| `PROCESS_EXECUTE_POWERSHELL` | `Process` -> `PowerShellExecution` | `event_count`, `first_seen_at`, `last_seen_at`, `first_source_unique_id`, `last_source_unique_id` |
| `PROCESS_STEAL_CREDENTIALS` | `Process` -> `CredentialTheft` | `event_count`, `first_seen_at`, `last_seen_at`, `first_source_unique_id`, `last_source_unique_id` |
| `PROCESS_SET_MESSAGE_HOOK` | `Process` -> `MessageHook` | `event_count`, `first_seen_at`, `last_seen_at`, `first_source_unique_id`, `last_source_unique_id` |
| `PROCESS_IMPERSONATE_TOKEN` | `Process` -> `TokenImpersonation` | `event_count`, `first_seen_at`, `last_seen_at`, `first_source_unique_id`, `last_source_unique_id` |

### 4.3 文件、URL、BITS、卷边

| RELATION_TYPE | SOURCE -> TARGET | BUSINESS PROPERTIES |
| --- | --- | --- |
| `PROCESS_CREATE_BITS` | `Process` -> `Bits` | `occurred_at`, `job_id`, `job_type`, `job_type_desc`, `job_name`, `job_files`, `job_status`, `job_status_desc` |
| `PROCESS_ADD_FILES_TO_BITS` | `Process` -> `Bits` | `occurred_at`, `job_id`, `job_type`, `job_type_desc`, `job_name`, `job_files` |
| `PROCESS_CHANGE_BITS_STATUS` | `Process` -> `Bits` | `occurred_at`, `job_id`, `job_status`, `job_status_desc`, `job_name` |
| `BITS_REMOTE_URL` | `Bits` -> `URLResource` | `pair_index` |
| `BITS_LOCAL_FILE` | `Bits` -> `File` | `pair_index` |
| `URL_DOWNLOAD_TO_FILE` | `URLResource` -> `File` | `pair_index`, `edge_key` |
| `PROCESS_CREATE_FILE` | `Process` -> `File` | `occurred_at` |
| `PROCESS_DELETE_FILE` | `Process` -> `File` | `occurred_at` |
| `PROCESS_READ_FILE` | `Process` -> `File` | `occurred_at` |
| `PROCESS_WRITE_FILE` | `Process` -> `File` | `occurred_at` |
| `PROCESS_SET_FILE_EA` | `Process` -> `File` | `occurred_at` |
| `PROCESS_LOAD_DLL` | `Process` -> `File` | `loaded_at` |
| `PROCESS_LOAD_DRIVER` | `Process` -> `File` | `loaded_at` |
| `PROCESS_RENAME_FILE` | `Process` -> 新 `File` | `occurred_at`, `old_path`, `new_path` |
| `PROCESS_MOVE_FILE` | `Process` -> 新 `File` | `occurred_at`, `old_path`, `new_path` |
| `PROCESS_CHANGE_FILE_ATTRIBUTES` | `Process` -> `File` | `occurred_at`, `flag`, `org_create_time`, `new_create_time` |
| `FILE_RENAME_TO` | 旧 `File` -> 新 `File` | `old_path`, `new_path` |
| `FILE_MOVE_TO` | 旧 `File` -> 新 `File` | `old_path`, `new_path` |
| `PROCESS_CREATE_FILE_STREAM` | `Process` -> `FileStream` | `occurred_at` |
| `PROCESS_DELETE_FILE_STREAM` | `Process` -> `FileStream` | `occurred_at` |
| `FILE_HAS_STREAM` | `File` -> `FileStream` | `relation_kind` |
| `PROCESS_ACCESS_URL` | `Process` -> `URLResource` | `visited_at` |
| `PROCESS_ACCESS_VOLUME` | `Process` -> `Volume` | `access_type`, `driver_type` |

### 4.4 网络、DNS、设备、IPC 边

| RELATION_TYPE | SOURCE -> TARGET | BUSINESS PROPERTIES |
| --- | --- | --- |
| `DEVICE_BELONG_TO_HOST` | `Device` -> `Host` | `first_seen_at`, `last_seen_at`, `last_change_at`, `last_change_type`, `is_present`, `last_source_unique_id` |
| `PROCESS_CONNECT_ENDPOINT` | `Process` -> `NetEndpoint` | `protocol`, `direction`, `local_ip`, `local_port`, `remote_ip`, `remote_port` |
| `PROCESS_QUERY_DNS_NAME` | `Process` -> `DnsName` | `first_seen_at`, `last_seen_at`, `last_source_unique_id`, `query_count` |
| `DNS_NAME_RESOLVE_ADDRESS` | `DnsName` -> `NetAddress` | `resolved_at` |
| `ADDRESS_HAS_ENDPOINT` | `NetAddress` -> `NetEndpoint` | 无业务字段，仅通用 scope 字段 |
| `PROCESS_CREATE_NAMED_EVENT` | `Process` -> `NamedEvent` | `occurred_at` |
| `PROCESS_OPEN_NAMED_EVENT` | `Process` -> `NamedEvent` | `occurred_at` |
| `PROCESS_CREATE_FILE_MAPPING` | `Process` -> `FileMapping` | `occurred_at`, `stack_module` |
| `PROCESS_CONNECT_FILE_MAPPING` | `Process` -> `FileMapping` | `occurred_at`, `stack_module` |
| `PROCESS_CREATE_MAIL_SLOT` | `Process` -> `MailSlot` | `occurred_at` |
| `PROCESS_CONNECT_MAIL_SLOT` | `Process` -> `MailSlot` | `occurred_at` |
| `PROCESS_CREATE_NAMED_PIPE` | `Process` -> `NamedPipe` | `occurred_at` |
| `PROCESS_CONNECT_NAMED_PIPE` | `Process` -> `NamedPipe` | `occurred_at` |
| `PROCESS_TOUCH_MBR` | `Process` -> `Mbr` | `driver_type` |

### 4.5 账号、账号组边

| RELATION_TYPE | SOURCE -> TARGET | BUSINESS PROPERTIES |
| --- | --- | --- |
| `PROCESS_CREATE_ACCOUNT` | `Process` -> `Account` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `PROCESS_ENABLE_ACCOUNT` | `Process` -> `Account` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `PROCESS_RESET_ACCOUNT_PASSWORD` | `Process` -> `Account` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `PROCESS_DISABLE_ACCOUNT` | `Process` -> `Account` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `PROCESS_DELETE_ACCOUNT` | `Process` -> `Account` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `PROCESS_MODIFY_ACCOUNT` | `Process` -> `Account` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `PROCESS_ADD_ACCOUNT_TO_GROUP` | `Process` -> `AccountGroup` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name`, `member_name`, `member_sid` |
| `PROCESS_REMOVE_ACCOUNT_FROM_GROUP` | `Process` -> `AccountGroup` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `member_name`, `member_sid` |
| `PROCESS_CREATE_ACCOUNT_GROUP` | `Process` -> `AccountGroup` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `PROCESS_DELETE_ACCOUNT_GROUP` | `Process` -> `AccountGroup` | `occurred_at`, `subject_user_sid`, `subject_user_name`, `subject_domain_name`, `subject_logon_id`, `target_sid`, `target_user_name`, `target_domain_name`, `sam_account_name` |
| `ACCOUNT_GROUP_HAS_MEMBER` | `AccountGroup` -> `Account` | `last_change_at`, `last_change_type`, `is_present`, `member_name`, `member_sid` |

### 4.6 注册表、服务、任务、WMI 边

| RELATION_TYPE | SOURCE -> TARGET | BUSINESS PROPERTIES |
| --- | --- | --- |
| `PROCESS_CREATE_REGISTRY_KEY` | `Process` -> `RegistryKey` | `occurred_at` |
| `PROCESS_DELETE_REGISTRY_KEY` | `Process` -> `RegistryKey` | `occurred_at` |
| `PROCESS_RENAME_REGISTRY_KEY` | `Process` -> 新 `RegistryKey` | `occurred_at`, `old_object_name`, `new_object_name` |
| `REGISTRY_KEY_RENAME_TO` | 旧 `RegistryKey` -> 新 `RegistryKey` | `old_object_name`, `new_object_name` |
| `PROCESS_SET_REGISTRY_VALUE` | `Process` -> `RegistryValue` | `occurred_at`, `value_exist` |
| `PROCESS_DELETE_REGISTRY_VALUE` | `Process` -> `RegistryValue` | `occurred_at` |
| `PROCESS_QUERY_REGISTRY_VALUE` | `Process` -> `RegistryValue` | `occurred_at`, `value_exist` |
| `PROCESS_CREATE_SERVICE` | `Process` -> `Service` | `occurred_at`, `service_binary_path_name`, `service_binary_md5` |
| `PROCESS_START_SERVICE` | `Process` -> `Service` | `occurred_at`, `service_binary_path_name`, `service_binary_md5`, `service_start_args` |
| `PROCESS_DELETE_SERVICE` | `Process` -> `Service` | `occurred_at`, `service_binary_path_name`, `service_binary_md5` |
| `PROCESS_STOP_SERVICE` | `Process` -> `Service` | `occurred_at`, `service_control_code` |
| `PROCESS_CONTROL_SERVICE` | `Process` -> `Service` | `occurred_at`, `service_control_code` |
| `PROCESS_CONFIG_SERVICE` | `Process` -> `Service` | `occurred_at`, `org_service_binary_path_name`, `new_service_binary_path_name`, `org_service_binary_md5`, `new_service_binary_md5`, `binding_state` |
| `PROCESS_CREATE_TASK` | `Process` -> `Task` | `occurred_at` |
| `PROCESS_DELETE_TASK` | `Process` -> `Task` | `occurred_at` |
| `PROCESS_CREATE_SCHEDULED_JOB` | `Process` -> `ScheduledJob` | `occurred_at`, `job_binary_path_name`, `job_binary_md5` |
| `PROCESS_DELETE_SCHEDULED_JOB` | `Process` -> `ScheduledJob` | `occurred_at`, `job_binary_path_name`, `job_binary_md5` |
| `PROCESS_CREATE_WMI_CLASS` | `Process` -> `WmiClass` | `occurred_at` |
| `PROCESS_CREATE_WMI_CONSUMER` | `Process` -> `WmiConsumer` | `occurred_at` |
| `PROCESS_CREATE_WMI_FILTER` | `Process` -> `WmiFilter` | `occurred_at` |
| `PROCESS_QUERY_WMI` | `Process` -> `WmiQuery` | `occurred_at` |
| `PROCESS_EXECUTE_WMI` | `Process` -> `WmiExecute` | `occurred_at` |
| `WMI_FILTER_BIND_CONSUMER` | `WmiFilter` -> `WmiConsumer` | `occurred_at` |
| `TARGET_REMOTE_HOST` | 任意支持远端目标的实体 -> `HostRef` | `server_name`, `normalized_server_name`, `target_remote_kind`, `has_explicit_credential` |
| `ASSOCIATED_WITH_FILE` | 任意支持文件关联的实体 -> `File` | `associated_file_kind`, `match_kind`, `matched_md5` |
| `MESSAGE_HOOK_MODULE_MATCH_FILE` | `MessageHook` -> `File` | 历史/兼容具体关系标签；语义等价于 `ASSOCIATED_WITH_FILE` + `associated_file_kind=message_hook_module`，可能包含 `match_kind`, `matched_md5` |
| `POWERSHELL_SCRIPT_MATCH_FILE` | `PowerShellExecution` -> `File` | 历史/兼容具体关系标签；语义等价于 `ASSOCIATED_WITH_FILE` + `associated_file_kind=powershell_script`，可能包含 `match_kind`, `matched_md5` |
| `SERVICE_IMAGE_MATCH_FILE` | `Service` -> `File` | 历史/兼容具体关系标签；语义等价于 `ASSOCIATED_WITH_FILE` + `associated_file_kind=service_image`，可能包含 `match_kind`, `matched_md5` |
| `TASK_IMAGE_MATCH_FILE` | `Task` -> `File` | 历史/兼容具体关系标签；语义等价于 `ASSOCIATED_WITH_FILE` + `associated_file_kind=task_image`，可能包含 `match_kind`, `matched_md5` |

## 5. 边字段字典

### 5.1 通用边字段

| KEY | VALUE |
| --- | --- |
| `scope_type` | 图作用域类型 |
| `scope_id` | 图作用域 ID |
| `graph_origin` | 图来源 |
| `edge_key` | 多边/特殊边补充 key |
| `updated_at` | 图边更新时间 |
| `view_origin` | projection view 补充边来源，例如 `case_entity_closure` |
| `original_scope_type` | projection view 补充边原始作用域类型 |
| `original_scope_id` | projection view 补充边原始作用域 ID |
| `original_graph_origin` | projection view 补充边原始图来源 |
| `display_order` | Case 结构边展示顺序 |
| `role` | Evidence 指向实体时的角色，例如 primary/related/target |
| `entity_key` | Evidence 指向实体时的实体 key |
| `entity_type` | Evidence 指向实体时的实体类型 |

### 5.2 行为时间与计数字段

| KEY | VALUE |
| --- | --- |
| `occurred_at` | 行为发生时间 |
| `created_at` | 创建时间，例如子进程创建时间 |
| `loaded_at` | 加载时间，例如 DLL/Driver 加载 |
| `visited_at` | URL 访问时间 |
| `resolved_at` | DNS 解析时间 |
| `first_seen_at` | 首次观察时间 |
| `last_seen_at` | 最近观察时间 |
| `event_count` | 聚合事件数量 |
| `query_count` | DNS 查询聚合数量 |
| `first_source_unique_id` | 首次来源事件 UniqueID |
| `last_source_unique_id` | 最近来源事件 UniqueID |

### 5.3 进程、网络、安全字段

| KEY | VALUE |
| --- | --- |
| `self_exit` | 是否自退出 |
| `granted_access` | 进程访问权限 |
| `call_trace` | 调用栈 |
| `address` | 内存地址 |
| `page_protect` | 内存页保护属性 |
| `thread_id` | 线程 ID |
| `privileges` | 权限列表 |
| `token_flag` | Token 操作标记 |
| `token_flag_description` | Token 操作描述 |
| `operator_token_context` | 操作者 token 上下文 |
| `target_token_context` | 目标 token 上下文 |
| `self` | 是否作用于自身 |
| `protocol` | 网络协议 |
| `direction` | 网络方向 |
| `local_ip` | 本地 IP |
| `local_port` | 本地端口 |
| `remote_ip` | 远端 IP |
| `remote_port` | 远端端口 |

### 5.4 文件、注册表、服务、任务字段

| KEY | VALUE |
| --- | --- |
| `old_path` | 旧文件路径 |
| `new_path` | 新文件路径 |
| `flag` | 文件属性变更标记 |
| `org_create_time` | 原始创建时间 |
| `new_create_time` | 新创建时间 |
| `relation_kind` | 关系类别，例如 ADS |
| `old_object_name` | 旧注册表对象名 |
| `new_object_name` | 新注册表对象名 |
| `value_exist` | 注册表值是否存在 |
| `access_type` | 卷访问类型 |
| `driver_type` | 驱动类型 |
| `stack_module` | 调用栈模块 |
| `service_binary_path_name` | 服务二进制路径 |
| `service_binary_md5` | 服务二进制 MD5 |
| `service_start_args` | 服务启动参数 |
| `service_control_code` | 服务控制码 |
| `org_service_binary_path_name` | 原服务二进制路径 |
| `new_service_binary_path_name` | 新服务二进制路径 |
| `org_service_binary_md5` | 原服务二进制 MD5 |
| `new_service_binary_md5` | 新服务二进制 MD5 |
| `binding_state` | 服务配置关联状态 |
| `job_binary_path_name` | Job 二进制路径 |
| `job_binary_md5` | Job 二进制 MD5 |
| `job_id` | BITS Job ID |
| `job_type` | BITS Job 类型 |
| `job_type_desc` | BITS Job 类型描述 |
| `job_name` | BITS Job 名称 |
| `job_files` | BITS Job 文件列表 |
| `local_name` | BITS `job_files` JSON 内部字段，本地文件名或路径 |
| `remote_name` | BITS `job_files` JSON 内部字段，远端 URL 或名称 |
| `job_status` | BITS Job 状态 |
| `job_status_desc` | BITS Job 状态描述 |
| `pair_index` | BITS URL/File 配对索引 |
| `match_kind` | 文件关联匹配方式 |
| `matched_md5` | 文件关联命中的 MD5 |
| `associated_file_kind` | 关联文件类型 |

### 5.5 账号、远端、设备字段

| KEY | VALUE |
| --- | --- |
| `subject_user_sid` | 操作主体 SID |
| `subject_user_name` | 操作主体用户名 |
| `subject_domain_name` | 操作主体域 |
| `subject_logon_id` | 操作主体 logon id |
| `target_sid` | 目标 SID |
| `target_user_name` | 目标用户名 |
| `target_domain_name` | 目标域 |
| `sam_account_name` | SAM 账号名 |
| `member_name` | 组成员名 |
| `member_sid` | 组成员 SID |
| `last_change_at` | 最近变更时间 |
| `last_change_type` | 最近变更类型 |
| `is_present` | 当前是否存在 |
| `server_name` | 远端服务器名 |
| `normalized_server_name` | 标准化远端服务器名 |
| `target_remote_kind` | 远端目标类别 |
| `has_explicit_credential` | 是否包含显式凭据 |

## 6. 重要注意事项

| KEY | VALUE |
| --- | --- |
| Process Hash | `Process` 节点使用 `process_md5`，当前后台没有返回 `md5`、`sha1`、`sha256` 作为 Process 属性 |
| Process 最小字段 | 当 `Process` 只是作为关系参与者被引用时，通常只有 `key`、`tenant_id`、`agent_id`、`process_guid`、`updated_at` |
| Process 完整字段 | 当来源事件提供进程快照时，才会出现 `process_name`、`process_image`、`process_command_line`、`process_md5` 等字段 |
| ProcessCreate 方向 | `PROCESS_CREATE_PROCESS` 的 `source_key` 是父进程，`target_key` 是子进程 |
| 普通边 edge_key | 很多普通边的 `edge_key` 为空字符串，不能单独作为唯一标识 |
| 多边 edge_key | `URL_DOWNLOAD_TO_FILE`、BITS pair 等多边/配对关系会使用 `edge_key` 或 `pair_index` 区分 |
| Case 闭包边 | `case_entity_closure` 是 projection view 为 Case 展示补充的边，会保留 `view_origin`、`original_scope_type`、`original_scope_id`、`original_graph_origin` 等元数据 |
| 文件关联边 | 当前主路径统一使用 `ASSOCIATED_WITH_FILE`；`MESSAGE_HOOK_MODULE_MATCH_FILE`、`POWERSHELL_SCRIPT_MATCH_FILE`、`SERVICE_IMAGE_MATCH_FILE`、`TASK_IMAGE_MATCH_FILE` 是历史/兼容具体关系标签，查询侧可能通过 Neo4j `type(r)` 返回，前端边配置需要兼容 |
