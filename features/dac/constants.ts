import type { ActionOption } from "./types";

export const FILE_ACTIONS: ActionOption[] = [
  { value: "n", label: "Create", description: "Create a new file" },
  { value: "d", label: "Delete", description: "Delete a file" },
  { value: "m", label: "Move", description: "Move a file" },
  { value: "t", label: "Rename", description: "Rename a file" },
  { value: "s", label: "Set", description: "Set file attributes" },
  { value: "o", label: "Open", description: "Open a file" },
  { value: "x", label: "Execute", description: "Execute a file" },
  { value: "r", label: "Read", description: "Read file content" },
  { value: "w", label: "Write", description: "Write file content" },
];

export const REGISTRY_ACTIONS: ActionOption[] = [
  { value: "n", label: "Create Key", description: "Create a new registry key" },
  { value: "d", label: "Delete Key/Value", description: "Delete a registry key or value" },
  { value: "q", label: "Query Key/Value", description: "Query the registry" },
  { value: "t", label: "Rename Key", description: "Rename a registry key" },
  { value: "s", label: "Set Value", description: "Set a registry value" },
  { value: "o", label: "Open Key", description: "Open a registry key" },
  { value: "e", label: "Enumerate Key/Value", description: "Enumerate registry data" },
];

export const PROCESS_ACTIONS: ActionOption[] = [
  { value: "n", label: "Create Process", description: "Create a new process" },
  { value: "d", label: "Terminate Process", description: "Terminate a process" },
  { value: "o", label: "Open Process", description: "Open a process handle" },
  { value: "l", label: "Allocate Memory", description: "Allocate process memory" },
  { value: "w", label: "Write Memory", description: "Write process memory" },
];
