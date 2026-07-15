import type {
  RemediationOrderItem,
  RemediationTargetSnapshot,
} from "@/features/attack/remediation-order";

export interface RemediationTargetPresentation {
  detail: string;
  displayName: string;
  unavailable: boolean;
}

function firstText(...values: string[]) {
  return values.map((value) => value.trim()).find(Boolean) || "";
}

function basename(value: string) {
  const normalized = value.trim().replace(/[\\/]+$/u, "");
  if (!normalized) return "";
  return normalized.split(/[\\/]/u).filter(Boolean).pop() || normalized;
}

function joinDetails(...values: Array<string | number | undefined>) {
  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

function technicalGraphKey(value: string) {
  return /^(?:process|file|net(?:_address)?|service|task|registry|account|wmi|bits)\s*:/iu.test(
    value.trim(),
  );
}

function genericTargetPresentation(item: RemediationOrderItem) {
  const nodeKey = item.node_key.trim();
  const candidate = firstText(item.display_name, item.object_id);
  if (
    candidate &&
    candidate !== nodeKey &&
    !technicalGraphKey(candidate)
  ) {
    return { displayName: candidate, detail: "" };
  }
  return { displayName: "", detail: "" };
}

function snapshotTargetPresentation(snapshot: RemediationTargetSnapshot) {
  const process = snapshot.process;
  if (process) {
    const displayName = firstText(
      process.process_name,
      basename(process.process_path),
    );
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          process.process_path,
          process.pid ? `PID: ${process.pid}` : "",
          process.process_hash ? `Hash: ${process.process_hash}` : "",
          process.command_line ? `命令行: ${process.command_line}` : "",
        ),
      };
    }
  }

  const file = snapshot.file;
  if (file) {
    const fileName = basename(file.file_path);
    const displayName = file.stream_name
      ? `${fileName || "文件"}:${file.stream_name}`
      : fileName;
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          file.file_path,
          file.file_hash ? `Hash: ${file.file_hash}` : "",
          file.signature ? `签名: ${file.signature}` : "",
          file.signer ? `签发者: ${file.signer}` : "",
        ),
      };
    }
  }

  const network = snapshot.network;
  if (network) {
    const endpoint = network.ip
      ? network.port > 0
        ? `${network.ip}:${network.port}`
        : network.ip
      : "";
    const displayName = firstText(network.url, network.domain, endpoint);
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          endpoint && endpoint !== displayName ? `端点: ${endpoint}` : "",
          network.domain && network.domain !== displayName
            ? `域名: ${network.domain}`
            : "",
          network.url && network.url !== displayName
            ? `URL: ${network.url}`
            : "",
          network.protocol ? `协议: ${network.protocol}` : "",
        ),
      };
    }
  }

  const task = snapshot.scheduled_task;
  if (task) {
    const displayName = firstText(task.task_path, task.task_name, task.job_id);
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          task.command ? `命令: ${task.command}` : "",
          task.binary_path ? `路径: ${task.binary_path}` : "",
          task.binary_hash ? `Hash: ${task.binary_hash}` : "",
          task.run_as ? `运行账户: ${task.run_as}` : "",
          task.state ? `状态: ${task.state}` : "",
        ),
      };
    }
  }

  const service = snapshot.service;
  if (service) {
    const displayName = firstText(service.display_name, service.service_name);
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          service.service_name && service.service_name !== displayName
            ? `服务名: ${service.service_name}`
            : "",
          service.binary_path ? `路径: ${service.binary_path}` : "",
          service.binary_hash ? `Hash: ${service.binary_hash}` : "",
          service.start_account ? `启动账户: ${service.start_account}` : "",
          service.state ? `状态: ${service.state}` : "",
        ),
      };
    }
  }

  const account = snapshot.account;
  if (account) {
    const displayName = account.domain && account.account_name
      ? `${account.domain}\\${account.account_name}`
      : firstText(account.account_name, account.sid);
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          account.sid ? `SID: ${account.sid}` : "",
          account.enabled === undefined ? "" : `已启用: ${account.enabled ? "是" : "否"}`,
          account.locked === undefined ? "" : `已锁定: ${account.locked ? "是" : "否"}`,
        ),
      };
    }
  }

  const registry = snapshot.registry;
  if (registry) {
    const path = [registry.hive, registry.key_path]
      .map((part) => part.trim().replace(/^\\+|\\+$/gu, ""))
      .filter(Boolean)
      .join("\\");
    const displayName = registry.value_name
      ? `${path}${path ? "\\" : ""}${registry.value_name}`
      : path;
    if (displayName) {
      return {
        displayName,
        detail:
          registry.present === undefined
            ? ""
            : `当前存在: ${registry.present ? "是" : "否"}`,
      };
    }
  }

  const wmiClass = snapshot.wmi_class;
  if (wmiClass) {
    const displayName = firstText(wmiClass.class_path, wmiClass.class_name);
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          wmiClass.namespace ? `Namespace: ${wmiClass.namespace}` : "",
          wmiClass.server_name ? `Server: ${wmiClass.server_name}` : "",
        ),
      };
    }
  }

  const subscription = snapshot.wmi_subscription;
  if (subscription) {
    const displayName = [subscription.filter_name, subscription.consumer_name]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" → ");
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          subscription.namespace ? `Namespace: ${subscription.namespace}` : "",
          subscription.consumer_type
            ? `Consumer: ${subscription.consumer_type}`
            : "",
        ),
      };
    }
  }

  const bitsJob = snapshot.bits_job;
  if (bitsJob) {
    const displayName = firstText(bitsJob.job_name, bitsJob.job_id);
    if (displayName) {
      return {
        displayName,
        detail: joinDetails(
          bitsJob.job_id && bitsJob.job_id !== displayName
            ? `Job ID: ${bitsJob.job_id}`
            : "",
          bitsJob.remote_url ? `URL: ${bitsJob.remote_url}` : "",
          bitsJob.job_status ? `状态: ${bitsJob.job_status}` : "",
        ),
      };
    }
  }

  return { displayName: "", detail: "" };
}

export function remediationTargetPresentation(
  item: RemediationOrderItem,
): RemediationTargetPresentation {
  const snapshot = item.target_snapshot;
  const snapshotPresentation = snapshot
    ? snapshotTargetPresentation(snapshot)
    : null;
  const genericPresentation = genericTargetPresentation(item);
  const displayName =
    snapshotPresentation?.displayName || genericPresentation.displayName;
  const detail = snapshotPresentation?.detail || genericPresentation.detail;

  if (displayName) {
    return {
      displayName,
      detail,
      unavailable: false,
    };
  }

  return {
    displayName: "目标信息不可用",
    detail: item.node_key.trim()
      ? `图节点 Key: ${item.node_key.trim()}`
      : "后端未返回目标快照或展示名称。",
    unavailable: true,
  };
}
