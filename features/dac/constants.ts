import type { ActionOption } from "./types";

export const FILE_ACTIONS: ActionOption[] = [
  { value: "n", label: "新建", description: "创建新文件" },
  { value: "d", label: "删除", description: "删除文件" },
  { value: "m", label: "移动", description: "移动文件" },
  { value: "t", label: "重命名", description: "重命名文件" },
  { value: "s", label: "设置", description: "设置文件属性" },
  { value: "o", label: "打开", description: "打开文件" },
  { value: "x", label: "执行", description: "执行文件" },
  { value: "r", label: "读取", description: "读取文件内容" },
  { value: "w", label: "写入", description: "写入文件内容" },
];

export const REGISTRY_ACTIONS: ActionOption[] = [
  { value: "n", label: "新建键", description: "创建新注册表键" },
  { value: "d", label: "删除键/值", description: "删除注册表键或值" },
  { value: "q", label: "查询键/值", description: "查询注册表" },
  { value: "t", label: "重命名键", description: "重命名注册表键" },
  { value: "s", label: "设置值", description: "设置注册表值" },
  { value: "o", label: "打开键", description: "打开注册表键" },
  { value: "e", label: "枚举键/值", description: "枚举注册表" },
];

export const PROCESS_ACTIONS: ActionOption[] = [
  { value: "n", label: "创建进程", description: "创建新进程" },
  { value: "d", label: "结束进程", description: "终止进程" },
  { value: "o", label: "打开进程", description: "打开进程句柄" },
  { value: "l", label: "分配内存", description: "分配进程内存" },
  { value: "w", label: "写内存", description: "写入进程内存" },
];
