# i18n 中文残留扫描与分级报告

扫描时间：2026-05-04

## 扫描范围

本次扫描范围：

- `app`
- `features`
- `shared`
- `i18n`
- `messages/en.json`

排除范围：

- `messages/zh-CN.json`
- `.next`
- `node_modules`
- `.git`
- `dist`
- `build`

## 总体结果

共扫描出中文字符命中：`5091` 处。

按类型分级：

| 分级 | 数量 | 处理建议 |
| --- | ---: | --- |
| `ui-visible` | 708 | 必须迁移。用户可见 UI 文案、按钮、表格列、标题、placeholder、tooltip 等 |
| `runtime-error-or-toast` | 92 | 必须迁移。错误、alert、toast、接口返回 message 等 |
| `demo-or-sample` | 23 | 先确认是否保留可访问；保留则迁，废弃则删除或归档 |
| `needs-review` | 548 | 人工复核。部分是 UI 拼接文本，部分是注释/业务数据/状态映射 |
| `mock-or-business-data` | 879 | 通常不迁。属于模拟业务数据、规则描述、攻击数据、配置数据 |
| `comments` | 2807 | 不影响 i18n，可后置清理或不处理 |
| `console-only` | 34 | 不影响用户界面，可后置清理 |

未发现 `messages/en.json` 中文污染。

## P0：必须优先迁移

这些是明确用户可见或运行时会弹出的中文文案。

### 可见 UI 文案

优先文件：

| 文件 | 命中数 | 说明 |
| --- | ---: | --- |
| `features/attack/graph/components/edge-label.tsx` | 81 | 攻击图边类型 label/description，大量中文映射 |
| `features/attack/graph/components/node-label.tsx` | 37 | 攻击图节点标签 |
| `features/shell/components/sidebar-user.tsx` | 30 | 用户侧栏、用户信息、编辑表单 |
| `features/audit/components/user-activity-audit.tsx` | 29 | 用户活动审计表格/筛选/状态 |
| `features/dac/components/network-policy-form.tsx` | 26 | DAC 网络策略表单 |
| `features/vulnerability/install/components/patch-list.tsx` | 26 | 补丁安装列表 |
| `features/audit/components/defense-audit.tsx` | 21 | 防护审计页面 |
| `features/dac/constants.ts` | 21 | DAC 常量 label，若用于 UI 则必须迁 |
| `features/vulnerability/install/components/patch-detail-dialog.tsx` | 20 | 补丁详情弹窗 |
| `features/audit/components/disposition-audit.tsx` | 19 | 处置审计页面 |
| `features/baseline/dispatch/components/strategy-selector.tsx` | 18 | 基线策略选择 |
| `shared/components/kibana-date-picker.tsx` | 18 | 通用时间选择器，影响多个页面 |
| `features/assets/software/components/soft-uninstall-progress-header.tsx` | 17 | 软件卸载进度页 |
| `features/dac/components/dac-review-card.tsx` | 17 | DAC 预览卡片 |
| `features/audit/components/task-dispatch-audit.tsx` | 16 | 任务下发审计 |
| `features/dac/components/policy-body-form.tsx` | 16 | DAC 策略主体表单 |
| `features/sensor-config/config-table.tsx` | 16 | 传感器配置表格 |

页面级明确残留：

| 文件 | 残留 |
| --- | --- |
| `app/frame/vulnerability/installtask/page.tsx` | `补丁任务部署` |
| `app/frame/vulnerability/taskstatus/page.tsx` | `补丁任务状态`、`刷新中...`、`刷新进度` |
| `app/frame/attack/dashboard/page.tsx` | `无数据` |

### 运行时错误 / toast / alert

优先文件：

| 文件 | 命中数 | 说明 |
| --- | ---: | --- |
| `features/auth/api.js` | 46 | 登录/忘记密码相关接口错误 message |
| `features/user/api.ts` | 12 | 用户接口校验错误 |
| `features/shell/components/sidebar-user.tsx` | 6 | 用户侧栏表单错误/提示 |
| `features/collection/lib/logic-group-parser.ts` | 5 | 组织结构上传解析错误 |
| `features/attack/graph/menu/process-node-menu.tsx` | 4 | 攻击图菜单提示 |
| `features/baseline/dispatch/components/review-card.tsx` | 4 | 基线下发确认/提示 |
| `features/collection/components/logic-group-uploader.tsx` | 4 | 组织结构上传状态 |
| `features/collection/lib/logic-group-converter.ts` | 4 | 组织结构转换错误 |

## P1：确认后处理

这些需要人工判断是否属于 UI、业务数据，或是否仍在使用。

| 文件 | 命中数 | 建议 |
| --- | ---: | --- |
| `features/baseline/dashboard/components/category-table.tsx` | 51 | 很可能是 UI 状态/分类文案，建议迁 |
| `features/sensor-config/config-list.tsx` | 30 | 很可能是 UI 列表/状态文案，建议迁 |
| `features/shell/components/sidebar-user.tsx` | 28 | 与 P0 合并处理 |
| `features/collection/lib/logic-group-parser.ts` | 20 | 与组织结构上传合并处理 |
| `features/baseline/dispatch/components/strategy-selector.tsx` | 18 | 与基线下发合并处理 |
| `app/frame/baseline/details/page.tsx` | 15 | 当前多为 mock 用户/部门/合规状态；需决定英文模式是否翻译 mock |
| `features/collection/components/tree-logic-group.tsx` | 14 | 组织树编辑器 UI，建议迁 |
| `features/attack/dashboard/components/header.tsx` | 12 | 攻击页面头部/状态，建议迁 |
| `features/baseline/dispatch/components/review-card.tsx` | 12 | 基线确认卡片，建议迁 |
| `shared/lib/status-color.ts` | 12 | 若返回展示 label，则必须迁 |

## P2：demo 或样例页面

`app/frame/attack/demo.tsx` 有 23 处中文文案。

处理建议二选一：

1. 如果这个页面仍可访问或用于演示，则接入 i18n。
2. 如果只是临时 demo，则从路由中删除或移入文档/实验目录，避免影响验收。

## P3：通常不迁移

这些主要是业务数据、mock 数据、规则描述或安全配置内容。

| 文件 | 命中数 | 说明 |
| --- | ---: | --- |
| `features/sensor-config/data/default-config-category.ts` | 165 | 传感器配置业务规则描述；如果英文模式要求规则描述也英文，再单独迁 |
| `features/attack/mock/attmock-data.json` | 86 | 攻击 mock 数据 |
| `features/attack/mock/dashboard.js` | 84 | 攻击 mock 数据 |
| `features/vulnerability/mock/patch-dashboard.ts` | 63 | 漏洞 mock 数据 |
| `features/audit/mock/defense-audit.ts` | 58 | 审计 mock 数据 |
| `features/audit/mock/disposition-audit.ts` | 49 | 审计 mock 数据 |
| `features/collection/mock/user-info-table-props.ts` | 48 | 信息采集 mock 组织数据 |
| `features/audit/mock/task-dispatch-report.ts` | 37 | 审计 mock 报表数据 |
| `features/assets/software/mock/soft-uninstall-progress.ts` | 36 | 软件卸载 mock 数据 |
| `features/baseline/dispatch/mock/strategy.js` | 36 | 基线策略 mock 数据 |

注意：如果这些 mock 数据在英文模式页面直接展示，并且产品验收要求“页面完全无中文”，则需要另做“mock 数据双语化”或替换英文 mock。

## P4：注释和 console

注释命中 `2807` 处，console 命中 `34` 处。

处理建议：

- 不作为 i18n 验收阻塞项。
- 后续可单独做代码卫生清理。
- 不建议在当前 i18n 迁移中混入大规模注释翻译，容易制造无意义 diff。

## 建议迁移顺序

1. `app/frame/vulnerability/installtask/page.tsx`、`app/frame/vulnerability/taskstatus/page.tsx`、`app/frame/attack/dashboard/page.tsx`  
   小而明确，适合作为下一批快速收尾。

2. `features/vulnerability/install/components/patch-list.tsx`、`patch-detail-dialog.tsx`、`features/vulnerability/task-status/**`  
   漏洞补丁模块仍有明显列表、弹窗、进度页文案。

3. `features/audit/components/user-activity-audit.tsx`、`defense-audit.tsx`、`disposition-audit.tsx`、`task-dispatch-audit.tsx`  
   审计中心深层 tab 表格继续迁。

4. `features/attack/graph/components/edge-label.tsx`、`node-label.tsx`  
   数量大，但集中在映射表，适合单独做一批。

5. `features/shell/components/sidebar-user.tsx`  
   用户侧栏属于全局入口，建议单独迁并测试。

6. `shared/components/kibana-date-picker.tsx`  
   通用组件，迁完收益高，但要注意所有调用方。

## 验收建议

每完成一批：

1. 补齐 `messages/zh-CN.json` 和 `messages/en.json` 同构 key。
2. 运行 JSON 解析检查。
3. 运行 `npm run build`。
4. 用英文模式打开相关页面，确认无明显中文 UI 文案。

