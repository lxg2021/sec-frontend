# 前端目录结构改造方案

本文档基于当前工程 `sec-frontend` 的完整目录清点和关键入口阅读编写。目标不是为了“目录好看”而搬文件，而是把路由、业务模块、共享组件、mock 数据、类型和 API 边界分清楚，让后续功能开发、联调和重构都更稳。

## 1. 当前工程概况

当前项目是 Next.js App Router 项目，根目录直接包含：

```txt
app/
components/
data/
doc/
hooks/
lib/
public/
styles/
```

排除 `.git`、`.next`、`node_modules` 后，主要文件规模如下：

```txt
app/          44 个文件
components/ 335 个文件
data/        24 个文件
doc/         23 个文件
hooks/        5 个文件
lib/         47 个文件
public/      59 个文件
styles/       2 个文件
```

其中 `components/` 已经明显承担了过多职责：

```txt
components/graph          130 个文件
components/ui             50 个文件
components/event          39 个文件
components/assert         15 个文件
components/patch          13 个文件
components/audit          11 个文件
components/dac             9 个文件
components/computer        7 个文件
components/secconfig       7 个文件
components/hostapproval    6 个文件
components/hosts           6 个文件
components/dash            6 个文件
components/task            5 个文件
```

当前构建已经暴露出目录和引用不一致问题：

```txt
npm run build
Failed to compile.
./app/frame/control/task/api/tasks/[id]/route.ts
Module not found: Can't resolve '@/lib/task-store'
```

同一组 task route 中还同时出现了 `@/lib/task/task-types` 和 `@/types/task-types` 两种类型路径，说明目录边界不清已经转化成实际工程风险。

## 2. 目录设计原则

### 2.1 app 只表达路由

`app/` 是 Next.js 路由目录。它应该回答“页面在哪里、URL 是什么、layout/loading/error 怎么组织”，不应该承载大量业务内部实现。

保留：

```txt
app/frame/vulnerability/page.tsx
app/frame/attack/dashboard/page.tsx
app/frame/reports/page.tsx
```

避免：

```txt
app/frame/attack/graph/node/...
app/frame/vulnerability/components/...
app/frame/control/task/lib/...
```

### 2.2 features 承载业务模块

业务代码按产品能力收敛到 `features/*`。每个 feature 自己管理：

```txt
components/
hooks/
api.ts
types.ts
constants.ts
mock/
utils/
```

比如：

```txt
features/attack/
features/assets/
features/audit/
features/vulnerability/
features/task/
features/baseline/
```

### 2.3 shared 只放真正跨业务复用的能力

`shared/` 只放不属于任何业务域、被多个业务稳定复用的内容：

```txt
shared/ui/        shadcn/radix 基础组件
shared/hooks/     通用 hooks
shared/lib/       cn、request、格式化等通用工具
shared/types/     全局通用类型
shared/components/跨业务复用组件
```

### 2.4 mock 数据靠近业务

现在所有 mock 都在 `data/`，后续建议移动到对应 feature：

```txt
features/attack/mock/
features/assets/mock/
features/audit/mock/
features/vulnerability/mock/
features/baseline/mock/
```

这样 mock 数据和使用它的页面/组件可以一起维护。

### 2.5 API route 放 app/api

如果是 Next.js 后端 route handler，建议放到：

```txt
app/api/tasks/route.ts
app/api/tasks/[id]/route.ts
```

前端客户端 API 封装放：

```txt
features/task/api.ts
```

这样 `/api/tasks` 和 `fetch("/api/tasks")` 一致。

## 3. 推荐目标目录结构

建议先采用“不引入 src”的结构，迁移成本最低：

```txt
app/
  layout.tsx
  loading.tsx
  page.tsx
  globals.css

  login/
    page.tsx

  forgot-password/
    page.tsx

  collection/
    page.tsx

  frame/
    layout.tsx
    page.tsx

    dashboard/
      page.tsx

    computers/
      agentinfo/
        page.tsx
      approve/
        page.tsx

    assets/
      hardware/
        page.tsx
      software/
        details/
          page.tsx
        uninstall/
          page.tsx

    baseline/
      page.tsx
      details/
        page.tsx
      hosts/
        page.tsx
      rules/
        page.tsx

    vulnerability/
      page.tsx
      dashboard/
        page.tsx
      installtask/
        page.tsx
      taskstatus/
        page.tsx

    attack/
      dashboard/
        page.tsx
      drill/
        page.tsx
      positioning/
        page.tsx

    response/
      dac/
        page.tsx

    evidence/
      page.tsx

    reports/
      page.tsx

    control/
      sensor/
        page.tsx
      task/
        page.tsx

    users/
      page.tsx

  api/
    tasks/
      route.ts
      [id]/
        route.ts

features/
  shell/
    components/
      frame-layout.tsx
      sidebar.tsx
      sidebar-user.tsx
      breadcrumb.tsx
    navigation.ts
    types.ts

  auth/
    components/
      login-form.tsx
      login-animation.tsx
      forgot-password-form.tsx
    hooks/
      use-login-handlers.ts
    api.ts
    types.ts

  collection/
    components/
      asset-collector-header.tsx
      scanner-download.tsx
      file-uploader.tsx
      user-info-table.tsx
      asset-collector-footer.tsx
      logic-group-uploader.tsx
      tree-logic-group.tsx
    lib/
      file-parser.ts
      logic-group-converter.ts
      logic-group-parser.ts
      validation.ts
    mock/
      file-uploader-props.ts
      logic-group-uploader-props.ts
      user-info-table-props.ts
      platforms.ts
    types.ts

  assets/
    host/
      components/
      mock/
      types.ts
    approval/
      components/
      mock/
      types.ts
    software/
      components/
      mock/
      types.ts

  baseline/
    dashboard/
      components/
      mock/
    rules/
      components/
      mock/
    dispatch/
      components/
      mock/
    types.ts

  vulnerability/
    dashboard/
      components/
    install/
      components/
    task-status/
      components/
    mock/
    types.ts

  attack/
    dashboard/
      components/
    graph/
      components/
      node/
      edge/
      center/
      menu/
      types.ts
    event/
      components/
      configs/
      types.ts
    kill-chain/
      components/
      types.ts
    search/
      components/
    mock/
    utils.ts

  audit/
    components/
    mock/
    types.ts

  dac/
    components/
    hooks/
    types.ts
    constants.ts

  task/
    components/
      task-creator.tsx
      task-list.tsx
      forms/
    api.ts
    store.ts
    types.ts
    models/

shared/
  ui/
  hooks/
  lib/
  components/
  styles/
  types/

assets/
  docs/
  samples/

public/
  icons/
  logo.svg
  logo1.svg

doc/
  frontend-directory-refactor-plan.md
  guacmole/
  table/
```

如果后续希望更标准，也可以把 `app/features/shared/assets` 全部放到 `src/` 下，但建议第二阶段再做。

## 4. app 路由安排

### 4.1 保留在 app 的文件

当前文件：

```txt
app/layout.tsx
app/loading.jsx
app/page.jsx
app/globals.css
app/login/page.jsx
app/forgot-password/page.jsx
app/collection/page.tsx
app/frame/layout.jsx
app/frame/page.jsx
```

目标安排：

```txt
app/layout.tsx
app/loading.tsx
app/page.tsx
app/globals.css
app/login/page.tsx
app/forgot-password/page.tsx
app/collection/page.tsx
app/frame/layout.tsx
app/frame/page.tsx
```

调整建议：

- `app/page.jsx` 保留 redirect 到 `/login`，后续可以改成 server redirect。
- `app/frame/layout.jsx` 拆成 `features/shell`，`app/frame/layout.tsx` 只调用 `<FrameLayout>{children}</FrameLayout>`。
- `app/login/page.jsx` 拆出 `features/auth/components/login-form.tsx`。
- `app/forgot-password/page.jsx` 拆出 `features/auth/components/forgot-password-form.tsx`。
- `app/collection/page.tsx` 只保留页面编排，具体组件和解析逻辑迁到 `features/collection`。

### 4.2 frame 子路由

当前 `frame` 下路由：

```txt
frame/dashboard
frame/computers/agentinfo
frame/computers/approve
frame/hardware-assets
frame/software-assets/details
frame/software-assets/uninstall
frame/baseline
frame/baseline/details
frame/baseline/hosts
frame/baseline/rules
frame/vulnerability
frame/vulnerability/dashboard
frame/vulnerability/installtask
frame/vulnerability/taskstatus
frame/attack/dashboard
frame/attack/drill
frame/attack/positioning
frame/response/dac
frame/evidence
frame/reports
frame/control/sensor
frame/control/task
frame/users
```

建议长期统一命名：

```txt
frame/assets/hardware
frame/assets/software/details
frame/assets/software/uninstall
```

但如果菜单和外部链接已经依赖现有 URL，可以先不改 URL，只调整内部实现目录。

## 5. 文件迁移安排

### 5.1 根目录配置文件

保留在根目录：

```txt
.gitignore
components.json
next-env.d.ts
next.config.mjs
package.json
package-lock.json
postcss.config.mjs
tailwind.config.ts
tsconfig.json
```

需要处理：

```txt
pnpm-lock.yaml
```

当前同时存在 `package-lock.json` 和 `pnpm-lock.yaml`。建议统一包管理器。由于 `package-lock.json` 完整且项目实际使用了 `npm run build`，建议保留 npm，删除或归档 `pnpm-lock.yaml`。

### 5.2 shared/ui

当前：

```txt
components/ui/*
components/ui.tsx
components/theme-provider.tsx
```

目标：

```txt
shared/ui/*
shared/components/theme-provider.tsx
```

说明：

- `components/ui/*` 是 shadcn/radix 基础组件，应作为全局 UI 基础设施。
- `components/ui/use-mobile.tsx` 和 `components/ui/use-toast.ts` 与根目录 `hooks` 中重复，建议统一到 `shared/hooks`，UI 组件内引用也统一。
- `components/ui.tsx` 需要确认实际用途。如果只是额外封装，应放 `shared/ui/index.ts` 或删除未使用封装。

### 5.3 shared/hooks

当前：

```txt
hooks/use-debounce.ts
hooks/use-mobile.tsx
hooks/use-toast.ts
components/ui/use-mobile.tsx
components/ui/use-toast.ts
```

目标：

```txt
shared/hooks/use-debounce.ts
shared/hooks/use-mobile.ts
shared/hooks/use-toast.ts
```

业务专属 hooks：

```txt
hooks/use-dac-policy-form.ts -> features/dac/hooks/use-dac-policy-form.ts
hooks/useTreeData.js         -> features/baseline/dispatch/hooks/use-tree-data.ts
```

### 5.4 shared/lib

当前适合保留为通用工具：

```txt
lib/utils.ts
lib/responseParser.js
lib/api/endpoints.js
styles/badgeClass.js
```

目标：

```txt
shared/lib/utils.ts
shared/lib/response-parser.ts
shared/lib/endpoints.ts
shared/styles/badge-class.ts
```

说明：

- `lib/utils.ts` 提供 `cn` 之类通用函数。
- `responseParser.js`、`endpoints.js` 需要确认是否真的跨业务使用；如果只服务某个业务，迁入对应 feature。
- `styles/badgeClass.js` 属于样式 token/helper，建议改名并迁到 `shared/styles`。

### 5.5 shell 主框架

当前：

```txt
app/frame/layout.jsx
components/user/sidebar-user.tsx
lib/user/user.ts
```

目标：

```txt
features/shell/
  components/
    frame-layout.tsx
    sidebar.tsx
    sidebar-user.tsx
    breadcrumb.tsx
  navigation.ts
  types.ts

features/user/
  api.ts
  types.ts
```

说明：

- 菜单配置从 `app/frame/layout.jsx` 提取到 `features/shell/navigation.ts`。
- `SidebarUser` 可放 `features/shell/components/sidebar-user.tsx`，如果后续有完整用户管理模块，再迁到 `features/user`。
- `lib/user/user.ts` 是用户 API/mock，建议放 `features/user/api.ts`。

### 5.6 auth 登录模块

当前：

```txt
app/login/page.jsx
app/forgot-password/page.jsx
components/loginanimation.jsx
lib/auth.js
lib/loginHandlers.js
public/logo.svg
```

目标：

```txt
features/auth/
  components/
    login-form.tsx
    forgot-password-form.tsx
    login-animation.tsx
  hooks/
    use-login-handlers.ts
  api.ts
  types.ts
```

页面保留：

```txt
app/login/page.tsx
app/forgot-password/page.tsx
```

说明：

- `lib/auth.js` 体积较大，建议优先 TypeScript 化并迁到 `features/auth/api.ts`。
- `lib/loginHandlers.js` 是登录表单专属 hook，放 `features/auth/hooks`。

### 5.7 collection 信息采集模块

当前页面：

```txt
app/collection/page.tsx
```

当前组件和逻辑：

```txt
components/computer/header.tsx
components/computer/scanner-download.tsx
components/computer/file-uploader.tsx
components/computer/user-info-table.tsx
components/computer/footer.tsx
components/computer/logic-group-uploader.tsx
components/computer/tree-logic-group.tsx

lib/computer/computer.ts
lib/computer/file-uploader-props.ts
lib/computer/logic-group-uploader-props.ts
lib/computer/platforms.ts
lib/computer/table.ts
lib/computer/ui-asset-data.ts
lib/computer/user-info-table-props.ts
lib/computer/utils/file-parser.ts
lib/computer/utils/logic-group-converter.ts
lib/computer/utils/logic-group-parser.ts
lib/computer/utils/validation.ts
```

目标：

```txt
features/collection/
  components/
    asset-collector-header.tsx
    scanner-download.tsx
    file-uploader.tsx
    user-info-table.tsx
    asset-collector-footer.tsx
    logic-group-uploader.tsx
    tree-logic-group.tsx
  lib/
    file-parser.ts
    logic-group-converter.ts
    logic-group-parser.ts
    validation.ts
  mock/
    file-uploader-props.ts
    logic-group-uploader-props.ts
    platforms.ts
    user-info-table-props.ts
  types.ts
```

说明：

- `computer` 这个命名在当前工程中同时指“信息采集”和“主机管理”，建议 `collection` 与 `assets/host` 拆开。

### 5.8 assets 资产模块

资产模块实际包含主机、审批、硬件、软件、卸载状态。

当前页面：

```txt
app/frame/computers/agentinfo/page.tsx
app/frame/computers/approve/page.tsx
app/frame/hardware-assets/page.jsx
app/frame/software-assets/details/page.tsx
app/frame/software-assets/uninstall/page.tsx
```

当前组件：

```txt
components/assert/*
components/hostapproval/*
components/hosts/HostInfoCard.tsx
components/hosts/HostInfoDialog.tsx
components/hosts/HostInfoPopover.tsx
```

当前类型和 mock：

```txt
lib/systemInfo.ts
lib/hardware.ts
lib/software.ts
lib/software-aggregate.ts
lib/hostSummary.ts
lib/task-soft-uninstall.ts
lib/task-soft-uninstall-progress.ts

data/mock-data-agent-info.ts
data/mock-data-hardware-info.ts
data/mock-data-soft-info.ts
data/mock-data-host-summary.ts
data/mock-data-approve.ts
data/mock-data-soft-aggregate.ts
data/mock-soft-uninstall-progress.ts
```

目标：

```txt
features/assets/
  host/
    components/
      host-summary-card.tsx
      host-list-toolbar.tsx
      host-list-table.tsx
      host-details-dialog.tsx
      host-details-tabs.tsx
      host-base-info-card.tsx
      host-hardware-accordion.tsx
      host-software-table.tsx
      host-info-card.tsx
      host-info-dialog.tsx
      host-info-popover.tsx
    mock/
      agent-info.ts
      hardware-info.ts
      software-info.ts
      host-summary.ts
    types.ts

  approval/
    components/
      host-approval.tsx
      host-edit-modal.tsx
      host-filter.tsx
      host-table.tsx
    mock/
      approve.ts
    types.ts
    utils.ts

  software/
    components/
      soft-inventory-table.tsx
      uninstall-soft-task-dialog.tsx
      uninstall-soft-task-list.tsx
      soft-uninstall-progress-header.tsx
      soft-host-uninstall-detail.tsx
      truncate-copyable.tsx
    mock/
      software-aggregate.ts
      soft-uninstall-progress.ts
    types.ts
```

说明：

- 当前目录名 `components/assert` 疑似想表达 `asset`，建议改成 `features/assets`，避免拼写误导。
- `hardware-assets/page.jsx` 当前几乎为空，后续可以并入 `assets/host` 或单独建立 `assets/hardware`。

### 5.9 baseline 安全基线模块

当前页面：

```txt
app/frame/baseline/page.jsx
app/frame/baseline/details/page.jsx
app/frame/baseline/hosts/page.jsx
app/frame/baseline/rules/page.jsx
```

当前组件和数据：

```txt
components/dash/*
components/secline/*
components/rules/*
components/hosts/HostSelector.jsx
components/hosts/TreeNodeWithState.jsx
components/hosts/VirtualizedTree.jsx
components/strategy/*
components/review/ReviewCard.tsx

data/mockData.js
data/strategyMockData.js
```

目标：

```txt
features/baseline/
  dashboard/
    components/
      overview-cards.tsx
      trend-chart.tsx
      risk-chart.tsx
      category-table.tsx
      compliance-map.tsx
      count-up.tsx

  details/
    components/
      baseline-manager.tsx
      details-card.tsx
      host-list.tsx

  rules/
    components/
      rule-info-card.tsx
      rule-info-popover.tsx

  dispatch/
    components/
      host-selector.tsx
      tree-node-with-state.tsx
      virtualized-tree.tsx
      strategy-selector.tsx
      strategy-guide.tsx
      review-card.tsx
    mock/
      host-tree.ts
      strategy.ts

  types.ts
```

说明：

- `components/dash` 是 baseline dashboard，不建议继续使用泛化名字 `dash`。
- `components/hosts/HostSelector.jsx` 当前服务基线策略下发，不应与资产主机详情混在同一目录。

### 5.10 vulnerability 漏洞与补丁模块

当前页面：

```txt
app/frame/vulnerability/page.tsx
app/frame/vulnerability/dashboard/page.tsx
app/frame/vulnerability/installtask/page.tsx
app/frame/vulnerability/taskstatus/page.tsx
```

当前组件和类型：

```txt
components/patch/*
lib/patch.ts
lib/patch-dashboard.ts
lib/patchInstall.ts
lib/patchSelection.ts
lib/taskInstall.ts
lib/taskProgress.ts

data/patch-mock-data.ts
data/coverage-install-mock-data.ts
data/moc-data-task-progress.ts
```

目标：

```txt
features/vulnerability/
  dashboard/
    components/
      patch-dashboard-header.tsx
      coverage-trend-chart.tsx
      security-level-pie.tsx
      top-host-risk-list.tsx

  install/
    components/
      patch-management-system.tsx
      patch-list.tsx
      patch-detail-dialog.tsx
      selected-patch-panel.tsx
      install-task-dialog.tsx
      install-task-list.tsx

  task-status/
    components/
      task-progress-header.tsx
      patch-progress-table.tsx
      patch-host-detail-dialog.tsx

  mock/
    patch-dashboard.ts
    coverage-install.ts
    task-progress.ts

  types.ts
```

说明：

- 当前 `app/frame/vulnerability/page.tsx` 实际是 Security Event Dashboard demo，内容更像 `attack/event` 展示页，不建议留在 vulnerability。
- 如果 `vulnerability/page.tsx` 只是 demo，应迁到 `features/attack/event/demo` 或 `app/frame/attack/demo`，正式漏洞首页应跳到 `/frame/vulnerability/dashboard`。

### 5.11 attack 攻击溯源模块

当前页面：

```txt
app/frame/attack/dashboard/page.jsx
app/frame/attack/drill/page.tsx
app/frame/attack/positioning/page.tsx
app/frame/attack/demo.tsx
```

当前组件：

```txt
components/attck/*
components/charts/attack-top10.tsx
components/charts/stage-host-distribution-chart.tsx
components/graph/*
components/event/*
components/killchain/*
components/search/Search.tsx
```

当前类型、工具、mock：

```txt
lib/attck-utils.ts
lib/kill-chain.ts
lib/stageColor.ts
lib/stageIcon.ts
lib/statusColor.ts

data/attmock-data.js
data/attmockData.json
data/drill-mock-data.tsx
data/event-mock-data.tsx
data/mock-data-node.tsx
data/mock-data-edge.tsx
data/killchain-attck-mapping.json
```

目标：

```txt
features/attack/
  dashboard/
    components/
      header.tsx
      overview-card.tsx
      overview-carousel.tsx
      stage-details.tsx
      attack-top10.tsx
      stage-host-distribution-chart.tsx

  graph/
    components/
      graph-visualization.tsx
      edge-label.tsx
      link-direction.tsx
      node-edge-accordion.tsx
      node-label.tsx
    center/
      register-edge-center.tsx
      register-node-center.tsx
    edge/
      *.tsx
    node/
      *.tsx
    menu/
      process-node-menu.tsx
      use-process-menu-store.ts
    types.ts

  event/
    components/
      event-card.tsx
    configs/
      *.tsx
      index.ts
    types.ts
    config-interfaces.ts

  kill-chain/
    components/
      kill-chain-details.tsx
      kill-chain-node.tsx
      kill-chain-timeline.tsx
    types.ts

  search/
    components/
      search.tsx

  mock/
    dashboard.ts
    drill.ts
    event.ts
    graph-node.ts
    graph-edge.ts
    killchain-attck-mapping.json

  utils.ts
```

说明：

- `graph` 130 个文件，已经是独立子模块，应优先从 `components` 顶层移出。
- `event` 39 个文件，也应作为 `attack/event` 子模块。
- `components/charts/*` 当前只服务 attack dashboard，放到 `features/attack/dashboard/components`。

### 5.12 audit 审计中心模块

当前页面：

```txt
app/frame/reports/page.tsx
```

当前组件和数据：

```txt
components/audit/*
lib/audit/*

data/mock-defense-audit.ts
data/mock-disposition-audit.ts
data/mock-task-dispatch-report.ts
data/mock-user-audit.ts
```

目标：

```txt
features/audit/
  components/
    audit-center.tsx
    defense-audit.tsx
    defense-audit-card.tsx
    disposition-audit.tsx
    disposition-audit-card.tsx
    task-dispatch-audit.tsx
    task-dispatch-card.tsx
    user-activity-audit.tsx
    user-activity-card.tsx
    global-filters.tsx
    pagination.tsx
  mock/
    defense-audit.ts
    disposition-audit.ts
    task-dispatch-report.ts
    user-audit.ts
  types.ts
```

说明：

- 当前路由名是 `reports`，页面标题是“审计中心”。可以保留 URL `/frame/reports`，但业务模块命名应为 `audit`。

### 5.13 dac 处置响应模块

当前页面：

```txt
app/frame/response/dac/page.tsx
```

当前组件和 hook：

```txt
components/dac/*
hooks/use-dac-policy-form.ts
```

目标：

```txt
features/dac/
  components/
    action-card.tsx
    action-control-form.tsx
    dac-policy-form.tsx
    dac-review-card.tsx
    network-policy-form.tsx
    policy-body-form.tsx
    policy-header-form.tsx
  hooks/
    use-dac-policy-form.ts
  constants.ts
  types.ts
```

说明：

- `components/dac/dacpolicy.ts` 应改为 `features/dac/types.ts`。
- `components/dac/action-configs.ts` 应改为 `features/dac/constants.ts`。

### 5.14 task 控制中心任务模块

当前页面和 API：

```txt
app/frame/control/task/page.tsx
app/frame/control/task/api/tasks/route.ts
app/frame/control/task/api/tasks/[id]/route.ts
```

当前组件和模型：

```txt
components/task/task-creator.tsx
components/task/task-list.tsx
components/task/task-forms/*

lib/task/api.ts
lib/task/task-store.ts
lib/task/task-types.ts
lib/task/task-base.ts
lib/task/attck-scan-task.ts
lib/task/baseline-scan-task.ts
lib/task/vulnerability-scan-task.ts
```

目标：

```txt
app/api/tasks/
  route.ts
  [id]/
    route.ts

features/task/
  components/
    task-creator.tsx
    task-list.tsx
    forms/
      attck-scan-form.tsx
      baseline-scan-form.tsx
      vulnerability-scan-form.tsx
  api.ts
  store.ts
  types.ts
  models/
    task-base.ts
    attck-scan-task.ts
    baseline-scan-task.ts
    vulnerability-scan-task.ts
```

说明：

- 这是第一优先级迁移模块，因为当前构建失败直接来自这里。
- `app/api/tasks` 和 `features/task/api.ts` 的 `fetch("/api/tasks")` 应保持一致。

### 5.15 secconfig 与 sensor 控制中心配置模块

当前页面：

```txt
app/frame/control/sensor/page.tsx
```

当前组件：

```txt
components/secconfig/*
```

目标：

```txt
features/sensor-config/
  components/
    config-create-dialog.tsx
    config-list.tsx
    config-table.tsx
  data/
    config-storage.ts
    default-config-category.ts
  types.ts
```

说明：

- `components/secconfig/data/configStorage.ts` 当前是业务数据存储，不应放在组件目录下。

### 5.16 evidence 和 users 占位页面

当前：

```txt
app/frame/evidence/page.jsx
app/frame/users/page.jsx
```

目标：

```txt
features/evidence/
  components/
  api.ts
  types.ts

features/user-management/
  components/
  api.ts
  types.ts
```

说明：

- 当前页面内容较少，可以先不拆，只保留 app route。
- 当功能增长时再建立 feature。

### 5.17 public 静态资源

当前：

```txt
public/logo.svg
public/logo1.svg
public/placeholder-*
public/icons/audit/*
public/icons/avatars/*
public/icons/computer/*
public/icons/nodes/*
public/icons/system/*
```

建议保留在 `public`，因为这些资源通过 `/icons/...` 或 `/logo.svg` 直接访问。

可优化命名：

```txt
public/icons/attack/nodes/*
public/icons/audit/*
public/icons/assets/*
public/icons/system/*
```

迁移静态资源时需要同步所有 `src="/icons/..."` 引用。

### 5.18 doc 和非源码资料

当前：

```txt
doc/guacmole/*
doc/table/*
doc/logic_group_template.yml
doc/logic_group_test.yml
doc/self-agent-template.json
components/agent/*
data/org event card.rar
```

目标：

```txt
doc/
  guacmole/
  table/
  frontend-directory-refactor-plan.md

assets/docs/
  logic_group_template.yml
  logic_group_test.yml
  self-agent-template.json

assets/samples/
  agent/
    agent.rar
    import.yaml
    logic-group.yml
    logicgroup.ts
    table.ts
    table.txt
    思路.md
  org-event-card.rar
```

说明：

- `components/agent` 中存在 `.rar`、`.yaml`、`.txt`、`.md`，不属于 React 组件目录。
- `data/org event card.rar` 是压缩包，也不属于运行时 mock 数据。

## 6. 推荐迁移阶段

### 阶段一：修构建和建立目录骨架

目标：

- 修复 task API route 构建错误。
- 建立 `features/`、`shared/`、`assets/` 目录。
- 不大规模改业务逻辑。

动作：

```txt
app/frame/control/task/api/tasks/* -> app/api/tasks/*
lib/task/*                         -> features/task/*
components/task/*                  -> features/task/components/*
```

同时修正 import：

```txt
@/lib/task/task-types -> @/features/task/types
@/lib/task/task-store -> @/features/task/store
@/lib/task/api        -> @/features/task/api
@/components/task/... -> @/features/task/components/...
```

验收：

```txt
npm run build
```

至少不再因为 task import 失败。

### 阶段二：抽 shared 与 shell

目标：

- `app/frame/layout` 变薄。
- UI、hooks、通用工具统一。

动作：

```txt
components/ui/*          -> shared/ui/*
hooks/use-toast.ts       -> shared/hooks/use-toast.ts
hooks/use-mobile.tsx     -> shared/hooks/use-mobile.ts
hooks/use-debounce.ts    -> shared/hooks/use-debounce.ts
components/theme-provider.tsx -> shared/components/theme-provider.tsx

app/frame/layout.jsx     -> features/shell/components/frame-layout.tsx
菜单配置                  -> features/shell/navigation.ts
```

验收：

- 登录、frame 页面可打开。
- 菜单高亮、展开、跳转行为不变。

### 阶段三：迁移中型业务模块

优先级：

```txt
features/dac
features/audit
features/collection
features/baseline
features/assets
features/vulnerability
```

原则：

- 每次只迁一个 feature。
- 先移动文件，再统一 import。
- 迁完立刻跑 build。

### 阶段四：迁移 attack 大模块

`attack` 最大，建议最后迁：

```txt
components/graph -> features/attack/graph
components/event -> features/attack/event
components/attck -> features/attack/dashboard
components/killchain -> features/attack/kill-chain
components/search -> features/attack/search
```

原因：

- `graph` 文件最多，引用链最长。
- 很多 node/edge/config 文件是注册中心依赖，迁移时需要一次性保证路径一致。

### 阶段五：清理 mock、资料和命名

动作：

```txt
data/* -> features/*/mock/*
components/agent/* -> assets/samples/agent/*
data/*.rar -> assets/samples/*
styles/* -> shared/styles/*
```

最后处理：

- `.jsx` 逐步改 `.tsx`。
- 删除重复 hook。
- 删除未使用 import。
- 统一文件命名 kebab-case。

## 7. import 别名建议

当前 `tsconfig.json`：

```json
"paths": {
  "@/*": ["./*"]
}
```

迁移后可继续使用 `@/*`，也可以增强可读性：

```json
"paths": {
  "@/*": ["./*"],
  "@/app/*": ["./app/*"],
  "@/features/*": ["./features/*"],
  "@/shared/*": ["./shared/*"],
  "@/assets/*": ["./assets/*"]
}
```

注意：如果不引入 `src/`，不需要大改 alias 根目录。

## 8. 命名规范建议

### 8.1 文件名

建议统一 kebab-case：

```txt
DacReviewCard.tsx       -> dac-review-card.tsx
PatchHostDetailDialog.tsx -> patch-host-detail-dialog.tsx
TaskProgressHeader.tsx  -> task-progress-header.tsx
HostApproval.tsx        -> host-approval.tsx
Search.tsx              -> search.tsx
```

### 8.2 目录名

建议修正或统一：

```txt
assert       -> assets
attck        -> attack-dashboard 或 attack
dash         -> baseline/dashboard
secline      -> baseline/details
secconfig    -> sensor-config
reports      -> audit 业务名，路由可继续 reports
```

### 8.3 类型文件

避免多个业务类型散落在 `lib` 顶层：

```txt
lib/systemInfo.ts        -> features/assets/host/types.ts
lib/patch.ts             -> features/vulnerability/types.ts
lib/dacpolicy.ts         -> features/dac/types.ts
lib/task/task-types.ts   -> features/task/types.ts
```

## 9. 需要特别注意的风险

### 9.1 App Router route handler 路径

当前 task API route 放在：

```txt
app/frame/control/task/api/tasks
```

这不是 `/api/tasks`。如果前端继续调用 `/api/tasks`，route 应迁到：

```txt
app/api/tasks
```

### 9.2 mock store 只适合开发

`features/task/store.ts` 如果仍然使用内存数组，刷新或多实例部署会丢数据。文档结构允许保留它，但要标注为 mock/dev store。

### 9.3 大规模移动会影响 import

建议用小批次迁移，并每批执行：

```txt
npm run build
```

不要一次性移动 `components` 全部文件。

### 9.4 public 资源路径

`public` 下资源通过绝对路径引用，例如：

```tsx
<img src="/icons/system/windows.svg" />
```

移动 public 内文件时必须同步页面中的路径。

### 9.5 当前存在未跟踪文件

当前 git 状态显示：

```txt
components/agent/import.yaml
components/agent/logic-group.yml
components/agent/logicgroup.ts
components/agent/table.ts
components/agent/table.txt
components/agent/思路.md
```

这些文件在迁移前需要确认是否纳入版本管理。如果是资料，建议移动到 `assets/samples/agent` 后再决定是否提交。

## 10. 最终效果

改造后，页面入口会变成很薄的编排层：

```tsx
import { PatchDashboardPage } from "@/features/vulnerability/dashboard"

export default function Page() {
  return <PatchDashboardPage />
}
```

业务内部实现集中在 feature：

```txt
features/vulnerability/dashboard/components/*
features/vulnerability/mock/*
features/vulnerability/types.ts
```

这样目录表达会更清晰：

- `app` 管 URL 和 Next.js 路由。
- `features` 管业务能力。
- `shared` 管跨业务复用。
- `public` 管浏览器直接访问的静态资源。
- `assets` 管样例、归档、非运行时代码资料。
- `doc` 管工程和外部系统文档。

这套结构适合当前项目规模，尤其适合现在已经比较重的 `attack/graph/event`、`assets/software/host`、`vulnerability/patch` 这些模块。
