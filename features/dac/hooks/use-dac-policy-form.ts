import { useState } from "react";
import type { PolicyType, FilePolicy, RegistryPolicy, ProcessPolicy, NetworkPolicy, ActionOption } from "@/features/dac/types";
import { FILE_ACTIONS, REGISTRY_ACTIONS, PROCESS_ACTIONS } from "@/features/dac/constants";

export function useDacPolicyForm() {
  const [policyType, setPolicyType] = useState<PolicyType>("fs");
  const [version, setVersion] = useState("v1.0");
  const [policyName, setPolicyName] = useState("");
  const [level, setLevel] = useState("50");
  const [exceptSource, setExceptSource] = useState("");
  const [subjectSource, setSubjectSource] = useState("");
  const [objectSource, setObjectSource] = useState("");

  const [selectedHosts, setSelectedHosts] = useState<any[]>([]);
  const [selectedHostIds, setSelectedHostIds] = useState<Set<string>>(new Set());

  const [fsPromptActions, setFsPromptActions] = useState<string[]>([]);
  const [fsRejectActions, setFsRejectActions] = useState<string[]>([]);
  const [fsAuditActions, setFsAuditActions] = useState<string[]>([]);

  const [regPromptActions, setRegPromptActions] = useState<string[]>([]);
  const [regRejectActions, setRegRejectActions] = useState<string[]>([]);
  const [regAuditActions, setRegAuditActions] = useState<string[]>([]);

  const [psPromptActions, setPsPromptActions] = useState<string[]>([]);
  const [psRejectActions, setPsRejectActions] = useState<string[]>([]);
  const [psAuditActions, setPsAuditActions] = useState<string[]>([]);

  // Network policy specific states
  const [netDirection, setNetDirection] = useState<"in" | "out">("in");
  const [netAction, setNetAction] = useState<"allow" | "block" | "bypass">("allow");
  const [netProfile, setNetProfile] = useState<"domain" | "private" | "public" | "any">("any");
  const [netProtocol, setNetProtocol] = useState<"tcp" | "udp" | "icmp" | "any">("tcp");
  const [localPort, setLocalPort] = useState("80,443,8080");
  const [remotePort, setRemotePort] = useState("any");
  const [localAddress, setLocalAddress] = useState("any");
  const [remoteAddress, setRemoteAddress] = useState("192.168.1.0/24");
  const [programPath, setProgramPath] = useState("C:\\Program Files\\App\\app.exe");

  const getCurrentActions = (): ActionOption[] => {
    switch (policyType) {
      case "fs":
        return FILE_ACTIONS;
      case "reg":
        return REGISTRY_ACTIONS;
      case "ps":
        return PROCESS_ACTIONS;
      default:
        return [];
    }
  };

  const getCurrentActionStates = () => {
    switch (policyType) {
      case "fs":
        return {
          promptActions: fsPromptActions,
          rejectActions: fsRejectActions,
          auditActions: fsAuditActions,
          setPromptActions: setFsPromptActions,
          setRejectActions: setFsRejectActions,
          setAuditActions: setFsAuditActions,
        };
      case "reg":
        return {
          promptActions: regPromptActions,
          rejectActions: regRejectActions,
          auditActions: regAuditActions,
          setPromptActions: setRegPromptActions,
          setRejectActions: setRegRejectActions,
          setAuditActions: setRegAuditActions,
        };
      case "ps":
        return {
          promptActions: psPromptActions,
          rejectActions: psRejectActions,
          auditActions: psAuditActions,
          setPromptActions: setPsPromptActions,
          setRejectActions: setPsRejectActions,
          setAuditActions: setPsAuditActions,
        };
      default:
        return {
          promptActions: [],
          rejectActions: [],
          auditActions: [],
          setPromptActions: () => {},
          setRejectActions: () => {},
          setAuditActions: () => {},
        };
    }
  };

  const handlePromptActionToggle = (action: string) => {
    const { promptActions, rejectActions, setPromptActions, setRejectActions } = getCurrentActionStates();

    if (promptActions.includes(action)) {
      setPromptActions(promptActions.filter((a) => a !== action));
    } else {
      setPromptActions([...promptActions, action]);
      setRejectActions(rejectActions.filter((a) => a !== action));
    }
  };

  const handleRejectActionToggle = (action: string) => {
    const { promptActions, rejectActions, setPromptActions, setRejectActions } = getCurrentActionStates();

    if (rejectActions.includes(action)) {
      setRejectActions(rejectActions.filter((a) => a !== action));
    } else {
      setRejectActions([...rejectActions, action]);
      setPromptActions(promptActions.filter((a) => a !== action));
    }
  };

  const handleAuditActionToggle = (action: string) => {
    const { auditActions, setAuditActions } = getCurrentActionStates();

    if (auditActions.includes(action)) {
      setAuditActions(auditActions.filter((a) => a !== action));
    } else {
      setAuditActions([...auditActions, action]);
    }
  };

  const resetForm = () => {
    setPolicyType("fs");
    setVersion("v1.0");
    setPolicyName("");
    setLevel("50");
    setExceptSource("");
    setSubjectSource("");
    setObjectSource("");

    setSelectedHosts([]);
    setSelectedHostIds(new Set());

    setFsPromptActions([]);
    setFsRejectActions([]);
    setFsAuditActions([]);

    setRegPromptActions([]);
    setRegRejectActions([]);
    setRegAuditActions([]);

    setPsPromptActions([]);
    setPsRejectActions([]);
    setPsAuditActions([]);

    setNetDirection("in");
    setNetAction("allow");
    setNetProfile("any");
    setNetProtocol("tcp");
    setLocalPort("80,443,8080");
    setRemotePort("any");
    setLocalAddress("any");
    setRemoteAddress("192.168.1.0/24");
    setProgramPath("C:\\Program Files\\App\\app.exe");
  };

  return {
    // State
    policyType,
    version,
    policyName,
    level,
    exceptSource,
    subjectSource,
    objectSource,
    selectedHosts,
    selectedHostIds,
    fsPromptActions,
    fsRejectActions,
    fsAuditActions,
    regPromptActions,
    regRejectActions,
    regAuditActions,
    psPromptActions,
    psRejectActions,
    psAuditActions,
    netDirection,
    netAction,
    netProfile,
    netProtocol,
    localPort,
    remotePort,
    localAddress,
    remoteAddress,
    programPath,

    // Setters
    setPolicyType,
    setVersion,
    setPolicyName,
    setLevel,
    setExceptSource,
    setSubjectSource,
    setObjectSource,
    setSelectedHosts,
    setSelectedHostIds,
    setNetDirection,
    setNetAction,
    setNetProfile,
    setNetProtocol,
    setLocalPort,
    setRemotePort,
    setLocalAddress,
    setRemoteAddress,
    setProgramPath,

    // Actions
    getCurrentActions,
    getCurrentActionStates,
    handlePromptActionToggle,
    handleRejectActionToggle,
    handleAuditActionToggle,
    resetForm,
  };
}
