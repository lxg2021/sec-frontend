export type PolicyType = "fs" | "reg" | "ps" | "net";

export interface PolicyHeader {
  version: string;
  from: string;
  to: string;
  id: string;
  group: string;
  name: string;
  level: number;
  domain: string;
  time: string;
  type: PolicyType;
}

export interface FilePolicy {
  header: PolicyHeader & { type: "fs" };
  body: {
    except: { type: "ps"; source: string };
    subject: { type: "ps"; source: string };
    object: { type: "fs"; source: string };
    prompt: { action: string };
    reject: { action: string };
    audit: { action: string };
  };
}

export interface RegistryPolicy {
  header: PolicyHeader & { type: "reg" };
  body: {
    except: { type: "ps"; source: string };
    subject: { type: "ps"; source: string };
    object: { type: "rg"; source: string };
    prompt: { action: string };
    reject: { action: string };
    audit: { action: string };
  };
}

export interface ProcessPolicy {
  header: PolicyHeader & { type: "ps" };
  body: {
    except: { type: "ps"; source: string };
    subject: { type: "ps"; source: string };
    object: { type: "ps"; source: string };
    prompt: { action: string };
    reject: { action: string };
    audit: { action: string };
  };
}

export interface NetworkPolicy {
  header: PolicyHeader & { type: "net" };
  body: {
    rule: {
      direction: "in" | "out";
      action: "allow" | "block" | "bypass";
      profile: "domain" | "private" | "public" | "any";
    };
    protocol: {
      type: "tcp" | "udp" | "icmp" | "any";
      localport: string;
      remoteport: string;
    };
    address: {
      local: string;
      remote: string;
    };
    program: {
      path: string;
    };
  };
}

export type DacPolicy = FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy;

export interface ActionOption {
  value: string;
  label: string;
  description: string;
}

export interface DacPolicyFormProps {
  onPolicyGenerate?: (policy: FilePolicy | RegistryPolicy | ProcessPolicy | NetworkPolicy) => void;
}
