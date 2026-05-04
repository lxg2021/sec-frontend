// mock-data-node.tsx
import type { ProcessNode } from "@/features/attack/graph/node/process-node-config";
import type { FileNode } from "@/features/attack/graph/node/file-node-config";
import type { NetNode } from "@/features/attack/graph/node/net-node-config";
import type { DnsNode } from "@/features/attack/graph/node/dns-node-config";
import type { VolumeNode } from "@/features/attack/graph/node/volume-node-config";
import type { FileStreamNode } from "@/features/attack/graph/node/file-stream-node-config";
import type { BitsJobNode, JobFile } from "@/features/attack/graph/node/bits-job-node-config";
import type { TaskNode, TaskImage, TaskTrigger } from "@/features/attack/graph/node/task-node-config";
import type { DllImageNode } from "@/features/attack/graph/node/dll-image-node-config";
import type { DriverImageNode } from "@/features/attack/graph/node/driver-image-node-config";
import type { EnDecryptNode } from "@/features/attack/graph/node/en-decrypt-node-config";
import type { EventNode } from "@/features/attack/graph/node/event-node-config";
import type { FileMappingNode } from "@/features/attack/graph/node/file-mapping-node-config";
import type { MailSlotNode } from "@/features/attack/graph/node/mail-slot-node-config";
import type { MbrNode } from "@/features/attack/graph/node/mbr-node-config";
import type { PipeNode } from "@/features/attack/graph/node/pipe-node-config";
import type { PowershellNode } from "@/features/attack/graph/node/powershell-node-config";
import type { RegKeyNode } from "@/features/attack/graph/node/reg-key-node-config";
import type { RegValueNode } from "@/features/attack/graph/node/reg-value-node-config";
import type { CredentialsNode } from "@/features/attack/graph/node/credentials-node-config";
import type { ImpersonationTokenNode, Token } from "@/features/attack/graph/node/impersonation-token-node-config";
import type { MessageNode } from "@/features/attack/graph/node/message-node-config";
import type { UrlNode } from "@/features/attack/graph/node/url-node-config";
import type { WmiClassNode, ClassAttributeItem } from "@/features/attack/graph/node/wmi-class-node-config";
import type { WmiQueryNode } from "@/features/attack/graph/node/wmi-query-node-config";
import type { WmiExecuteNode, ParameterItem } from "@/features/attack/graph/node/wmi-execute-node-config";
import type { WmiConsumerNode } from "@/features/attack/graph/node/wmi-consumer-node-config";
import type { WmiFilterNode } from "@/features/attack/graph/node/wmi-filter-node-config";
import type { AgentNode } from "@/features/attack/graph/node/agent-node-config";
import type { DeviceChangeNode } from "@/features/attack/graph/node/device-change-node-config";
import type { ServiceNode } from "@/features/attack/graph/node/service-node-config";
import type { AccountGroupNode } from "@/features/attack/graph/node/account-group-node-config";
import type { AccountNode } from "@/features/attack/graph/node/account-node-config";
import type { AttackNode } from "@/features/attack/graph/node/attack-node-config";


export const testProcessNode1: ProcessNode = {
  ElementId: "p1",
  BootTime: "2024/05/03 17:09:33",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 09:34:53",
  UserID: "s-1-5-21-219989340-3751043042-229602202-1000",
  Session: 1,
  ProcessID: 2224,
  ProcessName: "slui.exe",
  ProcessImage: "c:\\windows\\system32\\slui.exe",
  ProcessCommandLine: "c:\\windows\\system32\\slui.exe -embedding",
  ProcessMD5: "393b5457647467b05450ed4e0b7f9713",
  ProcessGuid: "432541c0032808b0003aa91ac39dda01",
  ParentProcessID: 808,
  ParentProcessImage: "c:\\windows\\system32\\svchost.exe",
  ParentProcessCommandLine: "c:\\windows\\system32\\svchost.exe -k dcomlaunch",
  ParentProcessMD5: "3120b24060924f9b94182a1432b2d7f9",
  ParentProcessGuid: "b11c697402740328003a7d5c399dda01",
  OrgFileName: "slui.exe",
  DriverType: 1,
  Signature: 1,
  SignVendor: "microsoft windows",
  RTLO: 0,
  ShowWindowFlag: 0,
  UniqueID: "34e6d255-7b79-407f-8cef-c97daa6bf669"
};

export const testProcessNode2: ProcessNode = {
  ElementId: "p2",
  BootTime: "2024/05/03 17:20:15",
  AgentID: "a9f4b1c2d3e4f5g6106840972c7c9999",
  Time: "2024/05/04 09:40:10",
  UserID: "s-1-5-21-219989340-3751043042-229602202-1001",
  Session: 2,
  ProcessID: 4567,
  ProcessName: "chrome.exe",
  ProcessImage: "c:\\program files\\google\\chrome\\application\\chrome.exe",
  ProcessCommandLine: "\"c:\\program files\\google\\chrome\\application\\chrome.exe\" --type=renderer --no-sandbox",
  ProcessMD5: "5a7f9c8b6e4d3a2f10987654321abcd0",
  ProcessGuid: "532541c0032808b0003aa91ac39ddbbb",
  ParentProcessID: 2224,
  ParentProcessImage: "c:\\windows\\system32\\slui.exe",
  ParentProcessCommandLine: "c:\\windows\\system32\\slui.exe -embedding",
  ParentProcessMD5: "393b5457647467b05450ed4e0b7f9713",
  ParentProcessGuid: "432541c0032808b0003aa91ac39dda01",
  OrgFileName: "chrome.exe",
  DriverType: 1,
  Signature: 1,
  SignVendor: "google llc",
  RTLO: 0,
  ShowWindowFlag: 1,
  UniqueID: "44e7d266-8c80-407f-8cef-c97daa6bf888"
};


export const testProcessNode3: ProcessNode = {
  ElementId: "p2",
  BootTime: "2024/05/03 17:10:10",
  AgentID: "a1f3d2b6c8fe9a77106840972c7c1111",
  Time: "2024/05/04 09:36:20",
  UserID: "s-1-5-21-219989340-3751043042-229602202-1001",
  Session: 2,
  ProcessID: 3333,
  ProcessName: "notepad.exe",
  ProcessImage: "c:\\windows\\system32\\notepad.exe",
  ProcessCommandLine: "c:\\windows\\system32\\notepad.exe test.txt",
  ProcessMD5: "6e5e4f3d2c1b0a998877665544332211",
  ProcessGuid: "552641c0032808b0003aa91ac39dda02",
  ParentProcessID: 1111,
  ParentProcessImage: "c:\\windows\\explorer.exe",
  ParentProcessCommandLine: "c:\\windows\\explorer.exe",
  ParentProcessMD5: "abcde24060924f9b94182a1432b2d7f9",
  ParentProcessGuid: "c22c697402740328003a7d5c399dda02",
  OrgFileName: "notepad.exe",
  DriverType: 1,
  Signature: 1,
  SignVendor: "microsoft windows",
  RTLO: 0,
  ShowWindowFlag: 1,
  UniqueID: "44f7d266-8c80-407f-8cef-d97daa6bf888"
};

export const testFileNode1: FileNode = {
  ElementId: "f1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 14:35:48",
  ProcessGuid: "c1496e8415501580003a4d19e89dda01",
  FileName: "e:\\dnsquery.vmp.exe",
  FileMD5: "3c4b348ab52f5543e4ef225221c5af4f",
  FileClass: 1,
  FileClassDescription: "binary",
  FileFormat: 4,
  FileFormatDescription: "pe_exe",
  Signature: 0,
  SignVendor: "NULL",
  DriverType: 1,
  DetectionMajorType: 1,
  DetectionMinorType: 0,
  DetectionContent: "vmprotect(2.x)[-]",
  Description: "comet tool",
  FileType: 1,
  UniqueID: "d111def1-87b8-41a7-a3f4-06a751728ff9",
  ObjHash: "3c4b348ab52f5543e4ef225221c5af4f",
};

export const testFileNode2: FileNode = {
  ElementId: "f2",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 14:37:41",
  ProcessGuid: "c1496e8415501580003a4d19e89dda01",
  FileName: "e:\\test6.sdb",
  FileMD5: "NULL",
  FileClass: 16,
  FileClassDescription: "db",
  FileFormat: 128,
  FileFormatDescription: "sdb",
  Signature: 0,
  SignVendor: "NULL",
  DriverType: 1,
  DetectionMajorType: 2,
  DetectionMinorType: 0,
  DetectionContent: "runashighest;runasinvoker",
  Description: "sdb file",
  FileType: 2,
  UniqueID: "1794094f-d430-4d22-9609-7857bfd7ce82",
  ObjHash: "NULL",
};

export const testFileNode3: FileNode = {
  ElementId: "f3",
  BootTime: "2024/05/04 14:10:22",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 14:45:30",
  ProcessGuid: "d3517f99155015a2003a4e22e89dda01",
  FileName: "c:\\windows\\system32\\drivers\\evil.sys",
  FileMD5: "e3b0c44298fc1c149afbf4c8996fb924",
  FileClass: 4,
  FileClassDescription: "driver",
  FileFormat: 64,
  FileFormatDescription: "sys",
  Signature: 0,
  SignVendor: "",
  DriverType: 2,
  DetectionMajorType: 1,
  DetectionMinorType: 3,
  DetectionContent: "unsigned kernel driver loaded",
  Description: "Suspicious unsigned kernel driver potentially used for privilege escalation",
  FileType: 3,
  UniqueID: "7e5f1234-6c20-4af7-8b30-3fba47d712e5",
  ObjHash: "hash:e3b0c44298fc1c149afbf4c8996fb924",
};

export const testNetNode: NetNode = {
  ElementId: "n1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 10:55:39",
  ProcessGuid: "8b5c943f1e200fe0003a3a99ce9dda01",
  Protocol: "ipproto_udp",
  Direction: "outbound",
  SourceIsIPv6: 0,
  SourceIP: "192.168.74.129",
  SourcePort: 56428,
  DestinationIsIPv6: 0,
  DestinationIP: "192.168.74.2",
  DestinationPort: 53,
  Number: 1,
  UniqueID: "017a4127-84cf-4a96-846a-ed199bd3dc00",
  ObjHash: "708a3c6f67d4d86d1936654157fd536c",
};

export const testDnsNode: DnsNode = {
  ElementId: "d1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 10:55:39",
  ProcessGuid: "8b5c943f1e200fe0003a3a99ce9dda01",
  Domain: "www.baidu.com",
  IPS: ["183.2.172.42", "183.2.172.185"],
  UniqueID: "7e302a0d-4583-49bb-8734-caea2e1e5c32",
  ObjHash: "708a3c6f67d4d86d1936654157fd536c",
};


export const testVolumeNode: VolumeNode = {
  ElementId: "v1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 15:29:25",
  ProcessGuid: "bc878528158017e0003a9a96f49dda01",
  FileName: "c:",
  DriverType: 0,
  AccessType: 3,
  UniqueID: "a145efa1-b68f-4181-96de-4508f7120e13",
  ObjHash: "",
};


export const testFileStreamNode: FileStreamNode = {
  ElementId: "fs1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 15:18:49",
  ProcessGuid: "4e38c769133c1b74003a3a7ef39dda01",
  FileName: "e:\\test\\win-hide-ntfs-ads\\certutil.txt:test.ps1",
  FileStreamName: "test.ps1",
  FileMD5: "40f4058b140b328ada90e9f4815bf639",
  FileClass: 8,
  FileClassDescription: "script",
  FileFormat: 74,
  FileFormatDescription: "js",
  DriverType: 1,
  UniqueID: "d14f2500-f0cf-4668-97af-e3bcf89fb285",
  ObjHash: "40f4058b140b328ada90e9f4815bf639",
};


export const testBitsJobNode: BitsJobNode = {
  ElementId: "bj1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 13:46:13",
  JobId: "{6d292ca9-ff60-4b63-9bae-fb7e2f605f8a}",
  JobType: 0,
  JobTypeDesc: "bg_job_type_download",
  JobName: "mydownloadjob",
  JobFiles: [
    {
      LocalName: "c:\\test\\bits\\ydark-master.zip",
      RemoteName: "http://20.0.22.148:8080/ydark-master.zip",
    } as JobFile,
  ],
  JobStatus: 0,
  JobStatusDesc: "pending",
  ObjHash: "c0385255f03b226382e7fb72e5ac533a",
};


export const testTaskNode: TaskNode = {
  ElementId: "t1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:37:27",
  Domain: "desktop-p0mgc81",
  User: "lxg",
  ServerName: "NULL",
  TaskName: "testtask",
  TaskPath: "\\microsoft\\windows\\appid",
  ImageMD5s: ["94912c1d73ade68f2486ed4d8ea82de6"],
  TaskImageContext: [
    {
      Image: "c:\\windows\\system32\\cmd.exe",
      ImageMD5: "94912c1d73ade68f2486ed4d8ea82de6",
      Parameters: "cls",
    } as TaskImage,
  ],
  TaskTriggerContext: [
    {
      EndBoundry: "2025-05-04T11:36:38",
      ExecutionTimeLimit: "P3D",
      StartBoundary: "2024-05-04T11:36:38",
      TrigerId: "",
      TrigerType: "logontrigger",
    } as TaskTrigger,
  ],
  ObjHash: "55e48d7805babf5602d38052bf659930",
};



export const testDllImageNode: DllImageNode = {
  ElementId: "dll1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:19:05",
  Image: "c:\\windows\\system32\\user32.dll",
  ImageMD5: "5c85312ff6b4b3d987c8c6fde1e5fede",
  Signature: 1,
  SignVendor: "microsoft windows",
  OrgFileName: "user32",
  UniqueID: "ed7ed908-8141-4a52-9cfc-c202697a6101",
};


export const testDriverImageNode: DriverImageNode = {
  ElementId: "drv1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:27:19",
  Image: "c:\\windows\\system32\\drivers\\srregdrv.sys",
  ImageMD5: "64ac59553b291313a3ed5b3fcc154c2c",
  Signature: 1,
  SignVendor: "wdktestcert,133389079361970735",
  UniqueID: "f7ff10ed-6459-4122-a400-8d500430b399",
};


export const testEnDecryptNode: EnDecryptNode = {
  ElementId: "enc1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 14:05:07",
  CryptFlag: 6,
  CryptFlagDescription: "chrome user data解密",
  UniqueID: "5e77d763-0a7f-4760-affd-1fa3df28866a",
};


export const testEventNode: EventNode = {
  ElementId: "ev1",
  BootTime: "2024/05/04 14:01:16",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 17:34:52",
  EventName: "global\\myevent",
  ObjHash: "b8460351df5c18f883177e1865d54d74",
};


export const testFileMappingNode: FileMappingNode = {
  ElementId: "fm1",
  BootTime: "2024/05/04 14:01:16",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 16:14:48",
  FileMappingName: "global\\myfilemappingobject",
  ObjHash: "c7d407d3a5b5cfa426653f1e7b4efcca",
};


export const testMailSlotNode: MailSlotNode = {
  ElementId: "ms1",
  BootTime: "2024/05/04 14:01:16",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 16:27:26",
  MailSlotName: "\\??\\mailslot\\sample_mailslot",
  ObjHash: "6843a69027d79f0121e60cf89d459a27",
};


export const testMbrNode: MbrNode = {
  ElementId: "mbr1",
  BootTime: "2024/05/04 14:01:16",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 17:42:20",
  PhysicalName: "\\\\.\\physicaldrive0",
  DriverType: 0,
  UniqueID: "c6f73f49-a3c9-49f5-a97d-fff6db471089",
};


export const testPipeNode: PipeNode = {
  ElementId: "pipe1",
  BootTime: "2024/05/04 14:01:16",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 16:23:18",
  PipeName: "\\??\\pipe\\mynamedpipe",
  ObjHash: "c7148c08c28c0137bd8cf5d238c5c8b6",
};


export const testPowershellNode: PowershellNode = {
  ElementId: "ps1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 15:29:25",
  ProcessCommandLine: `"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"`,
  FileName: "E:\\test\\win-direct-volume-access.ps1",
  SessionID: 10,
  Content: `$buffer = New-Object byte[] 11
$handle = New-Object IO.FileStream "\\\\.\\C:", 'Open', 'Read', 'ReadWrite'
$handle.Read($buffer, 0, $buffer.Length)
$handle.Close()
Format-Hex -InputObject $buffer`,
  UniqueID: "247cfce7-bd39-4470-bb7d-58cac8f8129d",
};


export const testRegKeyNode: RegKeyNode = {
  ElementId: "reg1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 15:57:09",
  ObjectName: "hkey_local_machine\\software\\microsoft\\terminal server client\\servers\\rdp0\\",
  Description: "connection histrory",
  Classification: "rdp",
  ObjHash: "b8401a3e-8ab9-4807-807b-cbb2d46359be",
};

export const testRegKeyNode2: RegKeyNode = {
  ElementId: "reg2",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 15:57:11",
  ObjectName: "hkey_local_machine\\software\\microsoft\\terminal server client\\servers\\test\\",
  Description: "connection histrory",
  Classification: "rdp",
  ObjHash: "302b410f-66bd-48c6-b384-c7732a998b4e",
};

export const testRegValueNode1: RegValueNode = {
  ElementId: "regvalue1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 16:01:33",
  ObjectName: "hkey_local_machine\\system\\currentcontrolset\\control\\lsa\\runasppl",
  ObjectValue: "0x00000000",
  Description: "ppl protected",
  Classification: "lsass",
  ObjHash: "faca7d5e-416a-4720-bcff-a931aa156207",
};


export const testCredentialsNode: CredentialsNode = {
  ElementId: "cred1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 14:27:21",
  CredType: 12,
  CredDesc: "[lsass]:read lsass security dll memory lsasrv.dll",
  ObjHash: "29efd64dd3c7fe1e2b022b7ad73a1ba5",
};


const operatorToken: Token = {
  AccountName: "system",
  ImpersonationLevel: "",
  IntegrityLevel: "system",
  Privilege:
    "seassignprimarytokenprivilege;selockmemoryprivilege;seincreasequotaprivilege;setcbprivilege;setakeownershipprivilege;seloaddriverprivilege;sesystemprofileprivilege;seprofilesingleprocessprivilege;seincreasebasepriorityprivilege;secreatepagefileprivilege;secreatepermanentprivilege;sebackupprivilege;serestoreprivilege;seshutdownprivilege;sedebugprivilege;seauditprivilege;sechangenotifyprivilege;seimpersonateprivilege;secreateglobalprivilege;seincreaseworkingsetprivilege;setimezoneprivilege;secreatesymboliclinkprivilege;sedelegatesessionuserimpersonateprivilege",
  SessionID: 0,
  SID: "s-1-5-18",
  TokenType: "tokenprimary",
};

const targetToken: Token = {
  AccountName: "system",
  ImpersonationLevel: "",
  IntegrityLevel: "system",
  Privilege:
    "seassignprimarytokenprivilege;selockmemoryprivilege;seincreasequotaprivilege;setcbprivilege;setakeownershipprivilege;seloaddriverprivilege;sesystemprofileprivilege;seprofilesingleprocessprivilege;seincreasebasepriorityprivilege;secreatepagefileprivilege;secreatepermanentprivilege;sebackupprivilege;serestoreprivilege;seshutdownprivilege;sedebugprivilege;seauditprivilege;sechangenotifyprivilege;seimpersonateprivilege;secreateglobalprivilege;seincreaseworkingsetprivilege;setimezoneprivilege;secreatesymboliclinkprivilege;sedelegatesessionuserimpersonateprivilege",
  SessionID: 1,
  SID: "s-1-5-18",
  TokenType: "tokenprimary",
};

export const testImpersonationTokenNode: ImpersonationTokenNode = {
  ElementId: "tok1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 14:12:17",
  OperatorTokenContext: operatorToken,
  TargetTokenContext: targetToken,
  TokenFlag: 3,
  TokenFlagDescription: "operator->target token operation (flag=3)",
  ObjHash: "b365af317ae730a67c936f21432b9c71",
};

export const testMessageNode: MessageNode = {
  ElementId: "msg1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 14:12:14",
  HookType: 4,
  HookTypeDescription: "wh_callwndproc",
  MessageHookModule: "c:\\windows\\system32\\shcore.dll",
  ObjHash: "b365af317ae730a67c936f21432b9c71",
};


export const testUrlNode: UrlNode = {
  ElementId: "url1",
  BootTime: "2024/05/04 14:00:41",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 15:00:00",
  URL: "http://20.0.22.148:8080/ydark-master.zip",
  ObjHash: "40f4058b140b328ada90e9f4815bf639", // 可用资源的 MD5/哈希或自定义值
};


export const testWmiClassNode: WmiClassNode = {
  ElementId: "wmi1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:46:51",
  ServerName: "NULL",
  User: "NULL",
  Namespace: "NULL",
  ClassName: "example",
  ClassPath: "NULL",
  SuperClassName: "NULL",
  WmiAttrs: [
    { AttrName: "__genus", AttrValue: "1", IsBase64: true },
    { AttrName: "__class", AttrValue: "example", IsBase64: false },
    { AttrName: "__superclass", AttrValue: "", IsBase64: false },
    { AttrName: "__dynasty", AttrValue: "example", IsBase64: true },
    { AttrName: "__relpath", AttrValue: "example", IsBase64: false },
    { AttrName: "__property_count", AttrValue: "3", IsBase64: false },
    { AttrName: "__derivation", AttrValue: "", IsBase64: false },
    { AttrName: "__server", AttrValue: "", IsBase64: false },
    { AttrName: "__namespace", AttrValue: "", IsBase64: false },
    { AttrName: "__path", AttrValue: "", IsBase64: false },
    { AttrName: "index", AttrValue: "", IsBase64: false },
    { AttrName: "intval", AttrValue: "", IsBase64: false },
    { AttrName: "otherinfo", AttrValue: "<default>", IsBase64: false },
  ],
  UniqueID: "a1ca720ee3882319a55438bf2991a1fc",
};


export const testWmiQueryNode: WmiQueryNode = {
  ElementId: "wmiQuery1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:44:34",
  ServerName: "NULL",
  User: "NULL",
  Namespace: "root/cimv2",
  Query: "select * from win32_operatingsystem",
  QueryLanguage: "wql",
  UniqueID: "00a41e6d-2dc9-4e20-aeb2-dea0d6e655f4",
};


export const testWmiExecuteNode: WmiExecuteNode = {
  ElementId: "wmiExec1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:58:07",
  ServerName: "NULL",
  User: "NULL",
  Namespace: "root\\cimv2",
  ClassName: "win32_process",
  MethodName: "create",
  Parameters: [
    {
      ParameterName: "commandline",
      ParameterValue: "cmd.exe",
    } as ParameterItem,
  ],
  UniqueID: "22ac911b-cb5f-475c-b2ea-1ac0ce3f2276",
};


export const testWmiConsumerNode: WmiConsumerNode = {
  ElementId: "wmiConsumer1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:49:14",
  ServerName: "127.0.0.1",
  User: "NULL",
  Namespace: "root\\cimv2",
  ClassName: "activescripteventconsumer",
  EventConsumerName: "defaulteventconsumer",
  EventConsumerType: 1,
  EventConsumerContext: {
    scriptfilemd5: "",
    scriptfilename: "",
    scripttext: `dim oshell
set oshell = createobject("wscript.shell")
oshell.run("powershell.exe -executionpolicy bypass -encodedcommand zqbjaggabwagahqazqbzahqa")
`,
    scriptingengine: "vbscript",
  },
  UniqueID: "87ae6221-e045-4dbd-a9fd-22e3158a02a3",
};


export const testWmiFilterNode: WmiFilterNode = {
  ElementId: "wmiFilter1",
  BootTime: "2024/05/04 10:50:36",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024/05/04 11:49:14",
  ServerName: "127.0.0.1",
  User: "NULL",
  Namespace: "root\\cimv2",
  EventFilterName: "defaulteventfilter",
  EventFilterAccess: "NULL",
  EventFilterClass: "__eventfilter",
  Query: "select * from win32_processstarttrace where processname = 'notepad.exe'",
  QueryLanguage: "wql",
  UniqueID: "1cfb12f8-db41-47ef-91db-c8fd5c329471",
};


export const testAgentNode: AgentNode = {
  ElementId: "agent-001",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024-05-04T15:00:00Z",
  Domain: "DESKTOP-P0MGC81",
  ComputerName: "DESKTOP-P0MGC81",
  IPS: ["192.168.1.100", "10.0.0.5"],
  UniqueID: "ae3b2f40-8c2a-4e3f-bd5f-1a2b3c4d5e6f",
};


export const testDeviceChangeNode: DeviceChangeNode = {
  ElementId: "devicechange-001",
  BootTime: "2024-05-04T10:50:36Z",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024-05-04T11:19:04Z",
  DeviceGUID: "{4d36e965-e325-11ce-bfc1-08002be10318}",
  HID: "scsi\\cdromnecvmwarvmware_sata_cd011.00",
  DeviceType: 2,
  DeviceDescription: "device_type_cdrom",
  DeviceFlag: 0,
  DeviceFlagDescription: "No special flags",
  ObjHash: "129f245e-1650-40ec-a6c0-58a2c91105de",
};


export const testServiceNode: ServiceNode = {
  ElementId: "service-001",
  BootTime: "2024-05-04T10:50:36Z",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024-05-04T11:00:34Z",
  ServiceName: "processhackerhaccqppdvrabjqb",
  DisplayName: "processhackerhaccqppdvrabjqb",
  ServiceType: 16,
  StartType: 3,
  ServiceBinaryMD5: "b365af317ae730a67c936f21432b9c71",
  ServiceStartName: "localsystem",
  ServiceBinaryPathName: "\"c:\\program files\\process hacker 2\\processhacker.exe\" -ras \"processhackerhaccqppdvrabjqb\"",
  ObjHash: "e722ddec-1e7c-4e62-8d57-1a930ec03834",
};


export const testAccountGroupNode: AccountGroupNode = {
  ElementId: "agr",
  BootTime: "2024-05-04T10:50:36Z",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024-05-04T11:05:20Z",
  GroupName: "Administrators",
  GroupDomainName: "CORP-DOMAIN",
  GroupSid: "S-1-5-32-544",
  SamAccountName: "CORP-DOMAIN\\Administrators",
  ObjHash: "a5e27b31-5b5f-4a1d-bef4-4bcf9986b8b3",
};


export const testAccountNode: AccountNode = {
  ElementId: "account-node-001",
  BootTime: "2024-05-04T10:50:36Z",
  AgentID: "d0c951b3b2fe6bba106840972c7c904f",
  Time: "2024-05-04T11:06:12Z",
  UserName: "jdoe",
  DomainName: "CORP-DOMAIN",
  Sid: "S-1-5-21-3623811015-3361044348-30300820-1013",
  SamAccountName: "CORP-DOMAIN\\jdoe",
  ObjHash: "d3b9f42f-42f0-4f77-9df8-66b3b6e13b82",
};



export const testAttackNode: AttackNode = {
  ElementId: "attack-node-001",
  ID: "T1059.001",
  Title: "PowerShell 执行恶意命令",
  Status: "active",
  Author: "Red Team - Internal Lab",
  Date: "2024-05-04T11:10:00Z",
  Description:
    "攻击者利用 PowerShell 执行恶意命令，尝试下载并执行远程载荷。此行为常用于后渗透阶段以绕过传统防护机制。",
  Modified: "2024-05-04T12:00:00Z",
  References: [
    "https://attack.mitre.org/techniques/T1059/001/",
    "https://docs.microsoft.com/en-us/powershell/",
  ],
  AttTags: ["Execution", "Living-off-the-Land", "PowerShell"],
  Phases: ["Execution", "Persistence"],
  RuleFile: "powershell_execution_rule.yar",
  Conditions: [
    "powershell.exe -encodedcommand",
    "网络流量出现可疑 Base64 编码",
  ],
};
