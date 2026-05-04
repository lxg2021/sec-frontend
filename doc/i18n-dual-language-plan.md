# 前端中英双语切换方案

## 目标

- 支持中文 / 英文切换
- 切换后全站文案、菜单、页面标题、空状态、按钮文案同步变化
- 刷新后保留用户选择
- 首次访问可根据浏览器语言自动选择
- 不影响现有主题切换

## 现状判断

- 当前工程没有接入 i18n 框架
- 当前 `app/layout.tsx` 只加载全局样式，没有 locale 结构
- 当前页面文案多为硬编码中文，后续需要逐步抽离
- 当前已经有主题切换按钮，说明顶部工具栏适合再放一个语言切换按钮

## 推荐方案

建议使用 `next-intl` 作为国际化方案。

原因：

- 适配 Next.js App Router
- 支持服务端和客户端
- 支持按路由加载语言包
- 支持 SEO 友好的 locale 路由
- 维护成本比手写 `Context + JSON` 更低

## 路由策略

建议采用带 locale 前缀的路由：

- `/zh-CN/...`
- `/en/...`

默认访问根路径时：

- 如果浏览器语言是中文，跳转到 `/zh-CN`
- 如果浏览器语言是英文，跳转到 `/en`
- 如果用户手动切换过语言，优先使用本地保存的选择

## 目录建议

```txt
app/
  [locale]/
    layout.tsx
    page.tsx
    frame/
      ...
middleware.ts

messages/
  zh-CN.json
  en.json

shared/
  i18n/
    index.ts
    locales.ts
    navigation.ts
```

## 实现步骤

### 1. 引入 i18n 基础

- 安装 `next-intl`
- 配置 locale 列表
- 增加 middleware 做语言重定向
- 增加 locale layout

### 2. 建立语言包

- 把菜单、标题、按钮、表头、空状态、提示语拆成 key
- `zh-CN.json` 和 `en.json` 保持同一套 key

### 3. 页面逐步接入

优先改这几类：

- `features/shell/navigation.ts`
- `features/shell/components/frame-layout.tsx`
- `app/frame/**/page.tsx`
- 各业务组件里的 title、label、placeholder、tooltip、empty text

### 4. 增加语言切换按钮

建议放在顶部栏，和主题切换并列：

- 主题按钮：`Sun/Moon`
- 语言按钮：`中 / EN` 或 `A/文`

切换后：

- 更新路由 locale
- 更新 `localStorage`
- 刷新仍保持

### 5. 处理浏览器语言

首次进入站点时：

- 先读本地保存的语言
- 没有则读 `navigator.language` / `Accept-Language`
- 中文环境默认 `zh-CN`
- 英文环境默认 `en`

## 字体建议

双语站点建议分开字体栈：

- 英文主字体：`Inter`
- 中文优先字体：`PingFang SC`、`Microsoft YaHei UI`、`Microsoft YaHei`

推荐回退顺序：

```css
font-family:
  Inter,
  "PingFang SC",
  "Microsoft YaHei UI",
  "Microsoft YaHei",
  "Noto Sans CJK SC",
  "Source Han Sans SC",
  Arial,
  sans-serif;
```

## 文案组织原则

- 页面标题、菜单、按钮统一走语言包
- 数据字段名、空状态、提示、tooltip 也要抽离
- 业务数据本身不要翻译，只有 UI 文案翻译
- 专有名词如 `WatchPoint`、`APT`、`DAC` 维持原样

## 推荐的文件分层

```txt
features/
  shell/
    navigation.ts
    components/
      frame-layout.tsx
      language-switch.tsx
      theme-switch.tsx

messages/
  zh-CN.json
  en.json

shared/
  i18n/
    locales.ts
    navigation.ts
    storage.ts
```

## 迁移顺序

1. 搭 i18n 基础
2. 先改 shell 外壳文案
3. 再改核心页面标题和菜单
4. 最后改表格、弹窗、空状态
5. 全量检查英文页面是否还有中文残留

## 验收标准

- 顶部可切换中文 / 英文
- 刷新后语言保留
- 首次访问可自动识别浏览器语言
- 菜单、标题、按钮、提示都能切换
- 不影响当前主题切换
- `npm run build` 通过

## 备注

如果后续想进一步优化，可以把 locale 和主题都做成统一的用户偏好设置，和账户信息一起保存到后端。
