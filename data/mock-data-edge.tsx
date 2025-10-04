// mock-data-edge.tsx
import type { ShipElementID } from "@/components/graph/edge/ShipElementID";
import type { ProcessCreateShip } from "@/components/graph/edge/ProcessCreateShip";
import type { ReverseProcessCreateFileShip } from "@/components/graph/edge/ProcessCreateFileShip";
import type { ProcessNetShip } from "@/components/graph/edge/ProcessNetShip";
import type { ProcessDnsShip } from "@/components/graph/edge/ProcessDnsShip";
import type { ProcessTerminateShip } from "@/components/graph/edge/ProcessTerminateShip";
import type { ProcessAccessShip } from "@/components/graph/edge/ProcessAccessShip";
import type { NetDnsShip } from "@/components/graph/edge/NetDnsShip";
import type { NetLateralMovementShip } from "@/components/graph/edge/NetLateralMovementShip";
import type { ReverseProcessAccessVolumeShip } from "@/components/graph/edge/ProcessAccessVolumeShip";
import type { ReverseProcessDeleteFileShip } from "@/components/graph/edge/ProcessDeleteFileShip";
import type { ReverseProcessReadFileShip } from "@/components/graph/edge/ProcessReadFileShip";
import type { ReverseProcessWriteFileShip } from "@/components/graph/edge/ProcessWriteFileShip";
import type { ReverseProcessSetFileEaShip } from "@/components/graph/edge/ProcessSetFileEaShip";
import type { ReverseProcessRenameFileShip } from "@/components/graph/edge/ProcessRenameFileShip";
import type { RenameFilePeerShip } from "@/components/graph/edge/RenameFilePeerShip";
import type { ReverseProcessMoveFileShip } from "@/components/graph/edge/ProcessMoveFileShip";
import type { MoveFilePeerShip } from "@/components/graph/edge/MoveFilePeerShip";
import type { ReverseProcessChangeFileAttributesShip } from "@/components/graph/edge/ProcessChangeFileAttributesShip";
import type { ReverseProcessCreateFileStreamShip } from "@/components/graph/edge/ProcessCreateFileStreamShip";
import type { ReverseProcessDeleteFileStreamShip } from "@/components/graph/edge/ProcessDeleteFileStreamShip";
import type { FilePeerStreamShip, StreamPeerFileShip } from "@/components/graph/edge/StreamPeerFileShip";
import type { NewFilePeerStreamShip } from "@/components/graph/edge/NewFilePeerStreamShip";
import type { ReverseProcessBitsCreateShip } from "@/components/graph/edge/ProcessBitsCreateShip";
import type { ReverseProcessBitsAddFileShip } from "@/components/graph/edge/ProcessBitsAddFileShip";
import type { ReverseProcessBitsStatusChangeShip } from "@/components/graph/edge/ProcessBitsStatusChangeShip";
import type { ReverseProcessCreateTaskShip } from "@/components/graph/edge/ProcessCreateTaskShip";
import type { FileTaskImageMd5PeerShip, ReverseFileTaskImageMd5PeerShip } from "@/components/graph/edge/FileTaskImageMd5PeerShip";
import type { TaskLateralMovementShip } from "@/components/graph/edge/TaskLateralMovementShip";
import type { ReverseProcessDeleteTaskShip } from "@/components/graph/edge/ProcessDeleteTaskShip";
import type { ReverseProcessCrossMemoryExecuteShip } from "@/components/graph/edge/ProcessCrossMemoryExecuteShip";
import type { ReverseProcessDllLoadShip } from "@/components/graph/edge/ProcessDllLoadShip";
import type { ReverseFileDllImageMd5PeerShip, FileDllImageMd5PeerShip } from "@/components/graph/edge/FileDllImageMd5PeerShip";
import type { ReverseProcessDriverLoadShip } from "@/components/graph/edge/ProcessDriverLoadShip";
import type { ReverseFileDriverImageMd5PeerShip, FileDriverImageMd5PeerShip } from "@/components/graph/edge/FileDriverImageMd5PeerShip";
import type { ReverseProcessEnDecryptShip } from "@/components/graph/edge/ProcessEnDecryptShip";
import type { ReverseProcessCreateEventShip } from "@/components/graph/edge/ProcessCreateEventShip";
import type { ReverseProcessOpenEventShip } from "@/components/graph/edge/ProcessOpenEventShip";
import type { ReverseProcessCreateFileMappingShip } from "@/components/graph/edge/ProcessCreateFileMappingShip";
import type { ReverseProcessConnectFileMappingShip } from "@/components/graph/edge/ProcessConnectFileMappingShip";
import type { ReverseProcessCreateMailSlotShip } from "@/components/graph/edge/ProcessCreateMailSlotShip";
import type { ReverseProcessConnectMailSlotShip } from "@/components/graph/edge/ProcessConnectMailSlotShip";
import type { ReverseProcessModifyMbrShip } from "@/components/graph/edge/ProcessModifyMbrShip";
import type { ReverseProcessCreatePipeShip } from "@/components/graph/edge/ProcessCreatePipeShip";
import type { ReverseProcessConnectPipeShip } from "@/components/graph/edge/ProcessConnectPipeShip";
import type { ReverseProcessPowershellShip } from "@/components/graph/edge/ProcessPowershellShip";
import type { ReverseProcessCreateRegKeyShip } from "@/components/graph/edge/ProcessCreateRegKeyShip";
import type { ReverseProcessDeleteRegKeyShip } from "@/components/graph/edge/ProcessDeleteRegKeyShip";
import type { ReverseProcessRenameRegKeyShip } from "@/components/graph/edge/ProcessRenameRegKeyShip";
import type { RenameRegKeyPeerShip } from "@/components/graph/edge/RenameRegKeyPeerShip";
import type { ReverseProcessSetRegValueShip } from "@/components/graph/edge/ProcessSetRegValueShip";
import type { ReverseProcessDeleteRegValueShip } from "@/components/graph/edge/ProcessDeleteRegValueShip";
import type { ReverseProcessQueryRegValueShip } from "@/components/graph/edge/ProcessQueryRegValueShip";
import type { ReverseProcessStealingCredentialsShip } from "@/components/graph/edge/ProcessStealingCredentialsShip";
import type { ReverseProcessAdjuestPrivilegeShip } from "@/components/graph/edge/ProcessAdjuestPrivilegeShip";
import type { ReverseProcessImpersonationTokenShip } from "@/components/graph/edge/ProcessImpersonationTokenShip";
import type { ReverseProcessSetTokenShip } from "@/components/graph/edge/ProcessSetTokenShip";
import type { ReverseProcessHookMessageShip } from "@/components/graph/edge/ProcessHookMessageShip";
import type { ReverseProcessUrlShip } from "@/components/graph/edge/ProcessUrlShip";
import type { ReverseProcessCreateWmiClassShip } from "@/components/graph/edge/ProcessCreateWmiClassShip";
import type { ReverseProcessQueryWmiShip } from "@/components/graph/edge/ProcessQueryWmiShip";
import type { ReverseProcessExecuteWmiShip } from "@/components/graph/edge/ProcessExecuteWmiShip";
import type { ReverseProcessWmiConsumerShip } from "@/components/graph/edge/ProcessWmiConsumerShip";
import type { ReverseProcessWmiFilterShip } from "@/components/graph/edge/ProcessWmiFilterShip";
import type { ConsumerFilterBindingShip } from "@/components/graph/edge/ConsumerFilterBindingShip";
import type { WmiLateralMovementShip } from "@/components/graph/edge/WmiLateralMovementShip";
import type { DeviceAgentShip } from "@/components/graph/edge/DeviceChangeShip";
import type { ReverseProcessCreateServiceShip } from "@/components/graph/edge/ProcessCreateServiceShip";
import type { ReverseProcessStartServiceShip } from "@/components/graph/edge/ProcessStartServiceShip";
import type { ReverseProcessDeleteServiceShip } from "@/components/graph/edge/ProcessDeleteServiceShip";
import type { ReverseProcessStopServiceShip } from "@/components/graph/edge/ProcessStopServiceShip";
import type { ReverseProcessPauseRestoreServiceShip } from "@/components/graph/edge/ProcessPauseRestoreServiceShip";
import type { ReverseProcessChangeServiceShip } from "@/components/graph/edge/ProcessChangeServiceShip";
import type { FileServiceImageMd5PeerShip, ReverseFileServiceImageMd5PeerShip } from "@/components/graph/edge/FileServiceImageMd5PeerShip";
import type { ReverseProcessCreateAccountShip } from "@/components/graph/edge/ProcessCreateAccountShip";
import type { ReverseProcessEnableAccountShip } from "@/components/graph/edge/ProcessEnableAccountShip";
import type { ReverseProcessResetAccountPwdShip } from "@/components/graph/edge/ProcessResetAccountPwdShip";
import type { ReverseProcessDisableAccountShip } from "@/components/graph/edge/ProcessDisableAccountShip";
import type { ReverseProcessDeleteAccountShip } from "@/components/graph/edge/ProcessDeleteAccountShip";
import type { ReverseProcessModifyAccountShip } from "@/components/graph/edge/ProcessModifyAccountShip";
import type { ReverseProcessAddAccountGroupShip } from "@/components/graph/edge/ProcessAddAccountGroupShip";
import type { ReverseProcessDeleteAccountGroupShip } from "@/components/graph/edge/ProcessDeleteAccountGroupShip";
import type { ReverseProcessCreateGroupShip } from "@/components/graph/edge/ProcessCreateGroupShip";
import type { ReverseProcessDeleteGroupShip } from "@/components/graph/edge/ProcessDeleteGroupShip";

export const testReverseProcessDeleteGroupShip: ReverseProcessDeleteGroupShip = {
    ShipElementID: {
        ElementId: "ship-delete-group-001",
        StartElementId: "proc-3302",
        EndElementId: "group-4101",
    },
    Time: "2025-10-04T15:20:00Z",
    ProcessGuid: "proc-3302-abcdef9876543210",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1010",
    UserName: "admin_user",
    DomainName: "ACME",
    LogonId: "0x61D",
    ObjHash: "e5f6a7890123456789abcdef0123456",
    Hash: "4d5e6f7890123456789abcdef012345",
    Tags: [],
};


export const testReverseProcessCreateGroupShip: ReverseProcessCreateGroupShip = {
    ShipElementID: {
        ElementId: "ship-create-group-001",
        StartElementId: "proc-2201",
        EndElementId: "group-4101",
    },
    Time: "2025-10-04T14:15:00Z",
    ProcessGuid: "proc-2201-abcdef1234567890",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1009",
    UserName: "admin_user",
    DomainName: "ACME",
    LogonId: "0x61C",
    ObjHash: "d4e5f6a7890123456789abcdef012345",
    Hash: "3c4d5e6f7890123456789abcdef0123",
    Tags: [],
};


export const testReverseProcessDeleteAccountGroupShip: ReverseProcessDeleteAccountGroupShip = {
    ShipElementID: {
        ElementId: "ship-delete-account-group-001",
        StartElementId: "proc-2101",
        EndElementId: "acct-3101",
    },
    Time: "2025-10-04T13:45:00Z",
    ProcessGuid: "proc-2101-fedcba0987654321",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1008",
    UserName: "operator_user",
    DomainName: "ACME",
    LogonId: "0x61B",
    MemberName: "FinanceGroup",
    MemberSid: "S-1-5-21-219989340-3751043042-229602202-1101",
    ObjHash: "c2d3e4f5a67890123456789abcdef12",
    Hash: "2b3c4d5e6f7890123456789abcdef12",
    Tags: [],
};


export const testReverseProcessAddAccountGroupShip: ReverseProcessAddAccountGroupShip = {
    ShipElementID: {
        ElementId: "ship-add-account-group-001",
        StartElementId: "proc-2001",
        EndElementId: "acct-3001",
    },
    Time: "2025-10-04T12:30:00Z",
    ProcessGuid: "proc-2001-abcdef9876543210",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1007",
    UserName: "admin_user",
    DomainName: "ACME",
    LogonId: "0x60A",
    MemberName: "FinanceGroup",
    MemberSid: "S-1-5-21-219989340-3751043042-229602202-1101",
    ObjHash: "b1c2d3e4f5a67890123456789abcdef1",
    Hash: "1a2b3c4d5e6f7890123456789abcdef1",
    Tags: [],
};


export const testReverseProcessModifyAccountShip: ReverseProcessModifyAccountShip = {
    ShipElementID: {
        ElementId: "ship-modify-account-001",
        StartElementId: "proc-1900",
        EndElementId: "acct-2900",
    },
    Time: "2025-10-04T12:15:00Z",
    ProcessGuid: "proc-1900-abcdef1234567890",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1006",
    UserName: "target_user",
    DomainName: "ACME",
    LogonId: "0x56F",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Hash: "0f1e2d3c4b5a69788766554433221100",
    Tags: [],
};


export const testReverseProcessDeleteAccountShip: ReverseProcessDeleteAccountShip = {
    ShipElementID: {
        ElementId: "ship-delete-account-001",
        StartElementId: "proc-1800",
        EndElementId: "acct-2800",
    },
    Time: "2025-10-04T11:45:00Z",
    ProcessGuid: "proc-1800-abcdef1234567890",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1005",
    UserName: "victim_user",
    DomainName: "ACME",
    LogonId: "0x55D",
    ObjHash: "f0e1d2c3b4a5968778695a4b3c2d1e0f",
    Hash: "c1d2e3f4a5b67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessDisableAccountShip: ReverseProcessDisableAccountShip = {
    ShipElementID: {
        ElementId: "ship-disable-account-001",
        StartElementId: "proc-1700",
        EndElementId: "acct-2700",
    },
    Time: "2025-10-04T11:20:00Z",
    ProcessGuid: "proc-1700-abcdef1234567890",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1004",
    UserName: "test_user",
    DomainName: "ACME",
    LogonId: "0x54C",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Hash: "b4c3d2e1f0a9876543210fedcba12345",
    Tags: [],
};


export const testReverseProcessResetAccountPwdShip: ReverseProcessResetAccountPwdShip = {
    ShipElementID: {
        ElementId: "ship-reset-account-pwd-001",
        StartElementId: "proc-1600",
        EndElementId: "acct-2600",
    },
    Time: "2025-10-04T10:15:00Z",
    ProcessGuid: "proc-1600-9876543210abcdef",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1003",
    UserName: "admin_test",
    DomainName: "ACME",
    LogonId: "0x53B",
    ObjHash: "f0e1d2c3b4a5968776655443322110ff",
    Hash: "d2c3b4a5968776655443322110fff0e1",
    Tags: [],
};


export const testReverseProcessEnableAccountShip: ReverseProcessEnableAccountShip = {
    ShipElementID: {
        ElementId: "ship-enable-account-001",
        StartElementId: "proc-1500",
        EndElementId: "acct-2500",
    },
    Time: "2025-10-04T09:20:00Z",
    ProcessGuid: "proc-1500-432541c0032808b0",
    UserSid: "S-1-5-21-219989340-3751043042-229602202-1002",
    UserName: "svc_deploy",
    DomainName: "ACME",
    LogonId: "0x52A",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Hash: "c3d4e5f67890123456789abcdef01234",
    Tags: [],
};


export const testReverseProcessCreateAccountShip: ReverseProcessCreateAccountShip = {
    ShipElementID: {
        ElementId: "ship-create-account-1",
        StartElementId: "process-123",
        EndElementId: "account-456",
    },
    Time: "2025-10-03T23:59:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    UserSid: "S-1-5-21-3623811015-3361044348-30300820-1013",
    UserName: "testuser",
    DomainName: "TESTDOMAIN",
    LogonId: "0x3E7",
    ObjHash: "9f86d081884c7d659a2feaa0c55ad015",
    Hash: "e4d909c290d0fb1ca068ffaddf22cbd0",
    Tags: [],
};


export const testReverseFileServiceImageMd5PeerShip: ReverseFileServiceImageMd5PeerShip = {
    ShipElementID: {
        ElementId: "ship-fs1",
        StartElementId: "file-1",
        EndElementId: "service-1",
    },
    Time: "2025-10-03T23:58:00Z",
    FileMD5: "d41d8cd98f00b204e9800998ecf8427e",
    Hash: "5d41402abc4b2a76b9719d911017c592",
};


export const testReverseProcessChangeServiceShip: ReverseProcessChangeServiceShip = {
    ShipElementID: {
        ElementId: "ship-rpcs-001",
        StartElementId: "process-2345",
        EndElementId: "service-6789",
    },
    Time: "2025-10-03T23:55:00Z",
    ProcessGuid: "efgh1234ijkl5678mnop9012qrst3456",
    ObjHash: "123456abcdef7890123456abcdef7890",
    Tags: [],
};


export const testReverseProcessPauseRestoreServiceShip: ReverseProcessPauseRestoreServiceShip = {
    ShipElementID: {
        ElementId: "ship-ppsrs-001",
        StartElementId: "process-1234",
        EndElementId: "service-5678",
    },
    Time: "2025-10-03T23:45:00Z",
    ServiceControlCode: "PAUSE",
    ProcessGuid: "abcd9876efgh5432ijkl1098mnop7654",
    ObjHash: "abcdef1234567890abcdef1234567890",
    Tags: [],
};


export const testReverseProcessStopServiceShip: ReverseProcessStopServiceShip = {
    ShipElementID: {
        ElementId: "ship-pss-001",
        StartElementId: "process-9876",
        EndElementId: "service-5432",
    },
    Time: "2025-10-03T23:15:00Z",
    ServiceControlCode: "STOP",
    ProcessGuid: "abcd1234efgh5678ijkl9012mnop3456",
    ObjHash: "1234567890abcdef1234567890abcdef",
    Tags: [],
};


export const testReverseProcessDeleteServiceShip: ReverseProcessDeleteServiceShip = {
    ShipElementID: {
        ElementId: "ship-pds-001",
        StartElementId: "process-1234",
        EndElementId: "service-5678",
    },
    Time: "2025-10-03T23:05:00Z",
    ServiceStartArgs: "--auto-start",
    ProcessGuid: "432541c0032808b0003aa91ac39ddb02",
    ObjHash: "fedcba0987654321fedcba0987654321",
    Tags: [],
};


export const testReverseProcessStartServiceShip: ReverseProcessStartServiceShip = {
    ShipElementID: {
        ElementId: "ship-pss-001",
        StartElementId: "process-1234",
        EndElementId: "service-5678",
    },
    Time: "2025-10-03T22:15:00Z",
    ServiceStartArgs: "--auto-start --verbose",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "abcdef1234567890abcdef1234567890",
    Tags: [],
};


export const testReverseProcessCreateServiceShip: ReverseProcessCreateServiceShip = {
    ShipElementID: {
        ElementId: "ship-pcs-001",
        StartElementId: "process-1234",
        EndElementId: "service-5678",
    },
    Time: "2025-10-03T21:30:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testDeviceAgentShip: DeviceAgentShip = {
    ShipElementID: {
        ElementId: "ship-device-agent-001",
        StartElementId: "device-5001",
        EndElementId: "agent-8001",
    },
    Time: "2025-10-03T20:15:00Z",
    AgentID: "agent-8001",
    ObjHash: "9f8d7c6b5a4e3d2c1b0a9876543210ff",
    Tags: [],
};


export const testWmiLateralMovementShip: WmiLateralMovementShip = {
    ShipElementID: {
        ElementId: "ship-wmi-lm-001",
        StartElementId: "wmi-class-1001",
        EndElementId: "agent-7001",
    },
    Time: "2025-10-03T19:30:00Z",
    UniqueID: "wmi-class-1001",
    AgentID: "agent-7001",
    ServerName: "Server-DC01",
    Tags: [],
};


export const testConsumerFilterBindingShip: ConsumerFilterBindingShip = {
    ShipElementID: {
        ElementId: "ship-cfb-001",
        StartElementId: "agent-5001",
        EndElementId: "wmiconsumer-901",
    },
    Time: "2025-10-03T18:45:00Z",
    AgentID: "agent-5001",
    EventConsumerName: "WmiEventConsumer01",
    EventFilterName: "WmiEventFilterAlpha",
    Hash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessWmiFilterShip: ReverseProcessWmiFilterShip = {
    ShipElementID: {
        ElementId: "ship-p-wmif-001",
        StartElementId: "p6001",
        EndElementId: "wmif-801",
    },
    Time: "2025-10-03T17:20:00Z",
    ProcessGuid: "proc-6001-1234abcd5678efgh",
    UniqueID: "wmif-unique-801",
    Tags: [],
};


export const testReverseProcessWmiConsumerShip: ReverseProcessWmiConsumerShip = {
    ShipElementID: {
        ElementId: "ship-p-wmic-001",
        StartElementId: "p5001",
        EndElementId: "wmic-701",
    },
    Time: "2025-10-03T16:45:00Z",
    ProcessGuid: "proc-5001-abcdef9876543210",
    UniqueID: "wmic-unique-701",
    Tags: [],
};


export const testReverseProcessExecuteWmiShip: ReverseProcessExecuteWmiShip = {
    ShipElementID: {
        ElementId: "ship-p-wmie-001",
        StartElementId: "p4001",
        EndElementId: "wmie-601",
    },
    Time: "2025-10-03T15:30:00Z",
    ProcessGuid: "proc-4001-abcdef1234567890",
    UniqueID: "wmie-unique-601",
    Tags: [],
};


export const testReverseProcessQueryWmiShip: ReverseProcessQueryWmiShip = {
    ShipElementID: {
        ElementId: "ship-p-wmiq-001",
        StartElementId: "p3002",
        EndElementId: "wmiq-501",
    },
    Time: "2025-10-03T14:15:00Z",
    ProcessGuid: "proc-3002-abcdef9876543210",
    UniqueID: "wmiq-unique-501",
    Tags: [],
};


export const testReverseProcessCreateWmiClassShip: ReverseProcessCreateWmiClassShip = {
    ShipElementID: {
        ElementId: "ship-p-wmi-001",
        StartElementId: "p3001",
        EndElementId: "wmi-401",
    },
    Time: "2025-10-03T12:30:00Z",
    ProcessGuid: "proc-3001-abcdef1234567890",
    UniqueID: "wmi-unique-401",
    Tags: [],
};


export const testReverseProcessUrlShip: ReverseProcessUrlShip = {
    ShipElementID: {
        ElementId: "ship-p-url-001",
        StartElementId: "p2001",
        EndElementId: "url-301",
    },
    Time: "2025-10-03T11:15:00Z",
    ProcessGuid: "proc-2001-a1b2c3d4e5f67890",
    ObjHash: "f1e2d3c4b5a697887766554433221100",
    Tags: [],
};


export const testReverseProcessHookMessageShip: ReverseProcessHookMessageShip = {
    ShipElementID: {
        ElementId: "ship-p-hookmsg-001",
        StartElementId: "p1001",
        EndElementId: "hookmsg-201",
    },
    Time: "2025-10-03T10:20:00Z",
    ProcessGuid: "proc-1001-9f8e7d6c5b4a3210",
    ObjHash: "c4d3e2f1a0b9c8d7e6f504132a1b2c3d",
    Tags: [],
};


export const testReverseProcessSetTokenShip: ReverseProcessSetTokenShip = {
    ShipElementID: {
        ElementId: "ship-p-settoken-002",
        StartElementId: "p900",
        EndElementId: "p901",
    },
    Time: "2025-10-03T09:30:00Z",
    ProcessGuid: "proc-900-aaaaaaaa-bbbb-cccc-dddd-eeeeffff0000",
    ParentProcessGuid: "proc-parent-899-1111-2222-3333-444455556666",
    OperatorTokenContext: {
        AccountName: "ATTACKER\\svc_updater",
        ImpersonationLevel: "Impersonation",
        IntegrityLevel: "High",
        Privilege: "SeDebugPrivilege,SeImpersonatePrivilege",
        SessionID: 1,
        SID: "S-1-5-21-219989340-3751043042-229602202-1001",
        TokenType: "Primary",
    },
    TargetTokenContext: {
        AccountName: "NT AUTHORITY\\SYSTEM",
        ImpersonationLevel: "Identification",
        IntegrityLevel: "System",
        Privilege: "SeAssignPrimaryTokenPrivilege,SeTcbPrivilege",
        SessionID: 0,
        SID: "S-1-5-18",
        TokenType: "Primary",
    },
    TokenFlag: 0x00000003,
    TokenFlagDescription: "Replaced primary token; elevated privileges applied",
    Hash: "b1c2d3e4f5a6978877665544332211aa",
    Tags: [],
};


export const testReverseProcessImpersonationTokenShip: ReverseProcessImpersonationTokenShip = {
    ShipElementID: {
        ElementId: "ship-p-impersonation-001",
        StartElementId: "p701",
        EndElementId: "token123",
    },
    Time: "2025-10-02T20:40:00Z",
    ProcessGuid: "proc-701-9a8b7c6d5e4f3210",
    ObjHash: "c3d4e5f67890ab12cdef34567890abcd",
    Tags: [],
};


export const testReverseProcessAdjuestPrivilegeShip: ReverseProcessAdjuestPrivilegeShip = {
    ShipElementID: {
        ElementId: "ship-p-adjpriv-001",
        StartElementId: "p600",
        EndElementId: "p601",
    },
    Time: "2025-10-02T20:10:00Z",
    ProcessGuid: "proc-600-7a8b9c0d1e2f3456",
    TargetProcessGuid: "proc-601-0f1e2d3c4b5a6789",
    Privileges: "SeDebugPrivilege,SeRestorePrivilege",
    TokenFlag: 0x00000010,
    TokenFlagDescription: "SeDebugPrivilege granted; elevated token present",
    Self: 0,
    Tags: []
};


export const testReverseProcessStealingCredentialsShip: ReverseProcessStealingCredentialsShip = {
    ShipElementID: {
        ElementId: "ship-p-stealcreds-001",
        StartElementId: "p401",
        EndElementId: "cred123",
    },
    Time: "2025-10-02T19:45:00Z",
    ProcessGuid: "proc-401-9f8e7d6c5b4a3210fedcba9876543210",
    ObjHash: "d2c7a8b9e6f4132a4b5c6d7e8f901234",
    Tags: [],
};


export const testReverseProcessQueryRegValueShip: ReverseProcessQueryRegValueShip = {
    ShipElementID: {
        ElementId: "ship-query-regval-001",
        StartElementId: "proc-3030-cccc",
        EndElementId: "regval-9999-zzzz",
    },
    Time: "2025-10-02T19:10:00Z",
    ProcessGuid: "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessDeleteRegValueShip: ReverseProcessDeleteRegValueShip = {
    ShipElementID: {
        ElementId: "ship-delregval-1",
        StartElementId: "proc-2222-bbbb",
        EndElementId: "regval-8888-cccc",
    },
    Time: "2025-10-02T18:45:00Z",
    ProcessGuid: "abcdef12-3456-7890-abcd-ef1234567890",
    ObjHash: "11223344556677889900aabbccddeeff",
    Tags: [],
};


export const testReverseProcessSetRegValueShip: ReverseProcessSetRegValueShip = {
    ShipElementID: {
        ElementId: "ship-rv1",
        StartElementId: "proc-1111-aaaa",
        EndElementId: "regval-5555-bbbb",
    },
    Time: "2025-10-02T18:15:00Z",
    ProcessGuid: "12345678-90ab-cdef-1234-567890abcdef",
    ObjHash: "99887766554433221100aabbccddeeff",
    ValueExist: 1,
    Tags: [],
};


export const testRenameRegKeyPeerShip: RenameRegKeyPeerShip = {
    ShipElementID: {
        ElementId: "ship-rk1",
        StartElementId: "reg-old-001",
        EndElementId: "reg-new-001",
    },
    Time: "2025-10-02T17:30:00Z",
    Hash: "9a4b8c7d6e5f4321aaeeff0011223344",
    StartObjHash: "abcd1111222233334444555566667777",
    EndObjHash: "dcba7777666655554444333322221111",
    ObjectName: "HKEY_LOCAL_MACHINE\\Software\\OldKey",
    NewObjectName: "HKEY_LOCAL_MACHINE\\Software\\NewKey",
};


export const testReverseProcessRenameRegKeyShip: ReverseProcessRenameRegKeyShip = {
    ShipElementID: {
        ElementId: "ship-p10-reg1",
        StartElementId: "p10",
        EndElementId: "reg1",
    },
    Time: "2025-10-02T17:15:00Z",
    ProcessGuid: "abcd1234-ef56-7890-gh12-ijklmnopqrst",
    ObjHash: "f1e2d3c4b5a697887766554433221100",
    Tags: [],
};


export const testReverseProcessDeleteRegKeyShip: ReverseProcessDeleteRegKeyShip = {
    ShipElementID: {
        ElementId: "ship-p9-reg1",
        StartElementId: "p9",
        EndElementId: "reg1",
    },
    Time: "2025-10-02T16:30:00Z",
    ProcessGuid: "1234abcd-5678-efgh-9012-ijklmnopqrst",
    ObjHash: "e99a18c428cb38d5f260853678922e03",
    Tags: [],
};


export const testReverseProcessCreateRegKeyShip: ReverseProcessCreateRegKeyShip = {
    ShipElementID: {
        ElementId: "ship-p8-reg1",
        StartElementId: "p8",
        EndElementId: "reg1",
    },
    Time: "2025-10-02T16:00:00Z",
    ProcessGuid: "abcd1234-efgh-5678-ijkl-9012mnopqrst",
    ObjHash: "9f86d081884c7d659a2feaa0c55ad015",
    Tags: [],
};


export const testReverseProcessPowershellShip: ReverseProcessPowershellShip = {
    ShipElementID: {
        ElementId: "ship-p7-ps1",
        StartElementId: "p7",
        EndElementId: "ps1",
    },
    Time: "2025-10-02T15:30:00Z",
    ProcessGuid: "mnop1234-qrst-5678-uvwx-9012yzabcdef",
    UniqueID: "ps-unique-001",
    Tags: [],
};


export const testReverseProcessConnectPipeShip: ReverseProcessConnectPipeShip = {
    ShipElementID: {
        ElementId: "ship-p6-pipe1",
        StartElementId: "p6",
        EndElementId: "pipe1",
    },
    Time: "2025-10-02T14:15:00Z",
    ProcessGuid: "efgh5678-ijkl-1234-mnop-56789qrstuv",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessModifyMbrShip: ReverseProcessModifyMbrShip = {
    ShipElementID: {
        ElementId: "ship-p5-mbr1",
        StartElementId: "p5",
        EndElementId: "mbr1",
    },
    Time: "2025-10-02T12:30:00Z",
    ProcessGuid: "abcd1234-ef56-7890-ab12-34567890cdef",
    UniqueID: "mbr-unique-001",
    Tags: [],
};


export const testReverseProcessConnectMailSlotShip: ReverseProcessConnectMailSlotShip = {
    ShipElementID: {
        ElementId: "ship-p4-ms2",
        StartElementId: "p4",
        EndElementId: "ms2",
    },
    Time: "2025-10-02T23:59:00Z",
    ProcessGuid: "1234abcd-5678-ef90-1234-56789abcdef0",
    ObjHash: "abcdef1234567890fedcba0987654321",
    Tags: [],
};


export const testReverseProcessCreateMailSlotShip: ReverseProcessCreateMailSlotShip = {
    ShipElementID: {
        ElementId: "ship-p3-ms1",
        StartElementId: "p3",
        EndElementId: "ms1",
    },
    Time: "2025-10-02T23:59:00Z",
    ProcessGuid: "87654321-abcd-4321-efgh-0123456789ab",
    ObjHash: "f0e1d2c3b4a5968776655443322110ff",
    Tags: [],
};


export const testReverseProcessConnectFileMappingShip: ReverseProcessConnectFileMappingShip = {
    ShipElementID: {
        ElementId: "ship-p2-fm2",
        StartElementId: "p2",
        EndElementId: "fm2",
    },
    Time: "2025-10-02T23:59:00Z",
    StackModule: "ntdll.dll",
    ProcessGuid: "12345678-abcd-4321-efgh-9876543210ab",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessCreateFileMappingShip: ReverseProcessCreateFileMappingShip = {
    ShipElementID: {
        ElementId: "ship-p1-fm1",
        StartElementId: "p1",
        EndElementId: "fm1",
    },
    Time: "2025-10-02T23:58:00Z",
    StackModule: "kernel32.dll",
    ProcessGuid: "432541c0032808b0003aa91ac39dda03",
    ObjHash: "f1e2d3c4b5a697887766554433221100",
    Tags: [],
};


export const testReverseProcessOpenEventShip: ReverseProcessOpenEventShip = {
    ShipElementID: {
        ElementId: "ship-p1-e2",
        StartElementId: "p1",
        EndElementId: "e2",
    },
    Time: "2025-10-02T23:57:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda02",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessCreateEventShip: ReverseProcessCreateEventShip = {
    ShipElementID: {
        ElementId: "ship-p1-e1",
        StartElementId: "p1",
        EndElementId: "e1",
    },
    Time: "2025-10-02T23:55:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "d4e5f67890123456789abcdef0a1b2c3",
    Tags: [],
};


export const testReverseProcessCreatePipeShip: ReverseProcessCreatePipeShip = {
    ShipElementID: {
        ElementId: "ship-p1-pipe1",
        StartElementId: "p1",
        EndElementId: "pipe1",
    },
    Time: "2025-10-02T23:50:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessEnDecryptShip: ReverseProcessEnDecryptShip = {
    ShipElementID: {
        ElementId: "ship-p1-encrypt1",
        StartElementId: "p1",
        EndElementId: "enc1",
    },
    Time: "2025-10-02T23:45:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    UniqueID: "enc-node-001",
    Tags: [],
};


export const testReverseFileDriverImageMd5PeerShip: ReverseFileDriverImageMd5PeerShip = {
    ShipElementID: {
        ElementId: "ship-file-driver1",
        StartElementId: "file1",
        EndElementId: "driver1",
    },
    Time: "2025-10-02T23:30:00Z",
    FileMD5: "d41d8cd98f00b204e9800998ecf8427e",
    Hash: "a1b2c3d4e5f67890123456789abcdef0",
};


export const testReverseProcessDriverLoadShip: ReverseProcessDriverLoadShip = {
    ShipElementID: {
        ElementId: "ship-p1-driver1",
        StartElementId: "p1",
        EndElementId: "driver1",
    },
    Time: "2025-10-02T23:00:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    UniqueID: "driver1-unique-001",
    Tags: [],
};


export const testReverseFileDllImageMd5PeerShip: ReverseFileDllImageMd5PeerShip = {
    ShipElementID: {
        ElementId: "ship-filedll1",
        StartElementId: "file1",
        EndElementId: "dll1",
    },
    Time: "2025-10-02T22:30:00Z",
    FileMD5: "a1b2c3d4e5f67890123456789abcdef0",
    Hash: "f0e1d2c3b4a5968776655443322110ff",
};


export const testReverseProcessDllLoadShip: ReverseProcessDllLoadShip = {
    ShipElementID: {
        ElementId: "ship-p234-dll56",
        StartElementId: "p234",
        EndElementId: "dll56",
    },
    Time: "2025-10-02T21:30:00Z",
    ProcessGuid: "432541c0-0328-08b0-003a-a91ac39dda01",
    UniqueID: "dll-56-9f8e7d6c5b4a3210",
    Tags: [],
};


export const testReverseProcessCrossMemoryExecuteShip: ReverseProcessCrossMemoryExecuteShip = {
    ShipElementID: {
        ElementId: "reverse-cross-mem-1",
        StartElementId: "process-123",
        EndElementId: "process-456"
    },
    Time: "2025-10-02T21:15:00Z",
    Address: "0x7ffdf000",
    PageProtect: 5,
    ProcessGuid: "abcd1234efgh5678ijkl9012mnop3456",
    OperatorProcessGuid: "mnop3456ijkl9012efgh5678abcd1234",
    ObjHash: "3f5d2e8a9c7b1d4f6e0a2c3b5d8f7a1e",
    Tags: []
};


export const testReverseProcessDeleteTaskShip: ReverseProcessDeleteTaskShip = {
    ShipElementID: {
        ElementId: "reverse-delete-task-1",
        StartElementId: "process-123",
        EndElementId: "task-456"
    },
    Time: "2025-10-02T21:00:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "9f8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c",
    Tags: []
};


export const testTaskLateralMovementShip: TaskLateralMovementShip = {
    ShipElementID: {
        ElementId: "task-lm-1",
        StartElementId: "task-123",
        EndElementId: "agent-456"
    },
    Time: "2025-10-02T20:30:00Z",
    ObjHash: "abc123def4567890abc123def4567890",
    AgentID: "agent-456",
    ServerName: "Server-01",
    Tags: []
};


export const testFileTaskImageMd5PeerShip: FileTaskImageMd5PeerShip = {
    Time: "2025-10-02T19:20:00Z",
    ObjHash: "f1e2d3c4b5a697887766554433221100",
    ImageMD5s: [
        "d41d8cd98f00b204e9800998ecf8427e",
        "0cc175b9c0f1b6a831c399e269772661"
    ],
    Hash: "aabbccddeeff00112233445566778899"
};


export const testReverseProcessCreateTaskShip: ReverseProcessCreateTaskShip = {
    ShipElementID: {
        ElementId: "ship-createtask-001",
        StartElementId: "p001",
        EndElementId: "task001"
    },
    Time: "2025-10-02T19:10:00Z",
    ProcessGuid: "1234abcd5678efgh9012ijkl3456mnop",
    ObjHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    Tags: [],
};


export const testReverseProcessBitsStatusChangeShip: ReverseProcessBitsStatusChangeShip = {
    ShipElementID: {
        ElementId: "ship-bitsstatus-001",
        StartElementId: "p123",
        EndElementId: "bitsjob456"
    },
    Time: "2025-10-02T19:00:00Z",
    ProcessGuid: "abcd1234efgh5678ijkl9012mnop3456",
    ObjHash: "0f1e2d3c4b5a69788766554433221100",
    Tags: [],
};


export const testReverseProcessBitsAddFileShip: ReverseProcessBitsAddFileShip = {
    ShipElementID: {
        ElementId: "ship-bitsaddfile-001",
        StartElementId: "p789",
        EndElementId: "bitsfile123"
    },
    Time: "2025-10-02T18:30:00Z",
    ProcessGuid: "1234abcd5678ef901234abcd5678ef90",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Tags: [],
};


export const testReverseProcessBitsCreateShip: ReverseProcessBitsCreateShip = {
    ShipElementID: {
        ElementId: "ship-bits123-p456",
        StartElementId: "p456",
        EndElementId: "bits123"
    },
    Time: "2025-10-02T18:10:00Z",
    ProcessGuid: "abcd1234ef567890abcd1234ef567890",
    ObjHash: "f1e2d3c4b5a697887766554433221100",
    Tags: [],
};


export const testNewFilePeerStreamShip: NewFilePeerStreamShip = {
    ShipElementID: {
        ElementId: "ship-nfp123-fs456",
        StartElementId: "nfp123",
        EndElementId: "fs456"
    },
    Time: "2025-10-02T18:05:00Z",
    ObjHash: "d4e5f67890123456789abcdef0123456",
    Hash: "1234567890abcdef1234567890abcdef",
};


export const testFilePeerStreamShip: FilePeerStreamShip = {
    ShipElementID: {
        ElementId: "ship-fp123-fs789",
        StartElementId: "f123",
        EndElementId: "fs789"
    },
    Time: "2025-10-02T17:50:00Z",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Hash: "0fedcba9876543210fedcba987654321",
};


export const testReverseProcessDeleteFileStreamShip: ReverseProcessDeleteFileStreamShip = {
    ShipElementID: {
        ElementId: "ship-p101-fs456",
        StartElementId: "p101",
        EndElementId: "fs456"
    },
    Time: "2025-10-02T17:35:00Z",
    ProcessGuid: "1234567890abcdef1234567890abcdef",
    ObjHash: "fedcba0987654321fedcba0987654321",
    Tags: []
};


export const testReverseProcessCreateFileStreamShip: ReverseProcessCreateFileStreamShip = {
    ShipElementID: {
        ElementId: "ship-p789-fs123",
        StartElementId: "p789",
        EndElementId: "fs123"
    },
    Time: "2025-10-02T17:20:00Z",
    ProcessGuid: "9f8e7d6c5b4a3210fedcba9876543210",
    ObjHash: "abcdef1234567890abcdef1234567890",
    Tags: []
};


export const testReverseProcessChangeFileAttributesShip: ReverseProcessChangeFileAttributesShip = {
    ShipElementID: {
        ElementId: "ship-p123-f456",
        StartElementId: "p123",
        EndElementId: "f456"
    },
    Time: "2024-10-02T17:10:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "a1b2c3d4e5f67890123456789abcdef0",
    Flag: 32,
    OrgCreateTime: "2024-01-01T09:00:00Z",
    NewCreateTime: "2024-10-02T17:00:00Z",
    Tags: []
};


export const testMoveFilePeerShip: MoveFilePeerShip = {
    ShipElementID: {
        ElementId: "ship-f500-f501",
        StartElementId: "f500",
        EndElementId: "f501"
    },
    Time: "2024-10-02T16:50:00Z",
    Hash: "e99a18c428cb38d5f260853678922e03",
    StartUniqueID: "file-500-uuid",
    EndUniqueID: "file-501-uuid",
    FileName: "data_report.xlsx",
    NewFileName: "archive/data_report.xlsx"
};


export const testReverseProcessMoveFileShip: ReverseProcessMoveFileShip = {
    ShipElementID: {
        ElementId: "ship-p300-f400",
        StartElementId: "p300",
        EndElementId: "f400"
    },
    Time: "2024-10-02T16:40:00Z",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "9f86d081884c7d659a2feaa0c55ad015",
    FileName: "report_2024.docx",
    NewFileName: "archive/report_2024.docx",
    Tags: []
};


export const testRenameFilePeerShip: RenameFilePeerShip = {
    ShipElementID: {
        ElementId: "ship-f200-f201",
        StartElementId: "f200",
        EndElementId: "f201"
    },
    Time: "2024-10-02T16:20:00Z",
    Hash: "5d41402abc4b2a76b9719d911017c592",
    StartUniqueID: "file-200",
    EndUniqueID: "file-201",
    FileName: "confidential_report.docx",
    NewFileName: "confidential_report_v2.docx"
};


export const testReverseProcessRenameFileShip: ReverseProcessRenameFileShip = {
    ShipElementID: {
        ElementId: "ship-p50-f100",
        StartElementId: "p50",
        EndElementId: "f100"
    },
    Time: "2024-10-02T15:45:30Z",
    ProcessGuid: "proc-9abc1234-def5-6789-gh01-ijklmnop",
    ObjHash: "e99a18c428cb38d5f260853678922e03",
    FileName: "important_document.txt",
    NewFileName: "important_document_backup.txt",
    Tags: []
};


export const testReverseProcessSetFileEaShip: ReverseProcessSetFileEaShip = {
    ShipElementID: {
        ElementId: "ship-p20-f30",
        StartElementId: "p20",
        EndElementId: "f30"
    },
    Time: "2024-10-02T14:32:10Z",
    ProcessGuid: "proc-5678abcd-1234-efgh-9012-ijklmnop",
    ObjHash: "5d41402abc4b2a76b9719d911017c592",
    Tags: []
};


export const reverseProcessWriteFileShips: ReverseProcessWriteFileShip =
{
    ShipElementID: {
        ElementId: "ship-p10-f20",
        StartElementId: "p10",
        EndElementId: "f20"
    },
    Time: "2024-05-07T08:25:41Z",
    ProcessGuid: "proc-1234abcd-5678-efgh-9012-ijklmnop",
    ObjHash: "9e107d9d372bb6826bd81d3542a419d6", // md5("The quick brown fox")
    Tags: [
    ]
};

export const reverseProcessReadFileShips: ReverseProcessReadFileShip = {
    ShipElementID: {
        ElementId: "ship-p3-f1",
        StartElementId: "p3",
        EndElementId: "f1"
    },
    Time: "2024-05-06T09:15:27Z",
    ProcessGuid: "1234abcd5678efgh9012ijkl3456mnop",
    ObjHash: "098f6bcd4621d373cade4e832627b4f6",
    Tags: []
};

export const reverseProcessDeleteFileShip1: ReverseProcessDeleteFileShip = {
    ShipElementID: {
        ElementId: "ship-p2-f1",
        StartElementId: "p2",
        EndElementId: "f1"
    },
    Time: "2024-05-05T14:22:11Z",
    ProcessGuid: "ab23cd45001234ef567890abcdef12345",
    ObjHash: "d41d8cd98f00b204e9800998ecf8427e",
    Tags: []
};


// ShipElementID
const shipVol_p1_v1: ShipElementID = {
    ElementId: "ship-p1-v1",
    StartElementId: "v1",
    EndElementId: "p1",
};

export const testReverseProcessAccessVolumeShip1: ReverseProcessAccessVolumeShip = {
    ShipElementID: shipVol_p1_v1,
    Time: "2024-05-07T10:15:30Z",
    ProcessGuid: "123e4567-e89b-12d3-a456-426614174001",
    UniqueID: "rev-access-001",
    ObjHash: "9e107d9d372bb6826bd81d3542a419d6",
    Tags: [],
};


const shipId: ShipElementID = {
    ElementId: "ship-p1-p2",
    StartElementId: "p1",
    EndElementId: "p2",
};

const shipId2: ShipElementID = {
    ElementId: "ship-p2-p3",
    StartElementId: "p2",
    EndElementId: "p3",
};


export const testProcessCreateShip1: ProcessCreateShip = {
    ShipElementID: shipId,
    Time: "2024/05/04 09:40:10",
    ProcessGuid: "532541c0032808b0003aa91ac39ddbbb",
    ParentProcessGuid: "432541c0032808b0003aa91ac39dda01",
    UniqueID: "rel-4325-5325",
    Tags: [],
};

export const testProcessCreateShip2: ProcessCreateShip = {
    ShipElementID: shipId2,
    Time: "2024/05/04 09:50:00",
    ProcessGuid: "632541c0032808b0003aa91ac39ddcc",
    ParentProcessGuid: "532541c0032808b0003aa91ac39ddbbb",
    UniqueID: "rel-5325-6325",
    Tags: [],
};



/**
 * 说明：
 * - 假设已有节点：
 *   - 进程 p1: ProcessGuid = "432541c0032808b0003aa91ac39dda01"
 *   - 进程 p2: ProcessGuid = "532541c0032808b0003aa91ac39ddbbb"
 *   - 文件 f1:   ObjHash   = "3c4b348ab52f5543e4ef225221c5af4f", UniqueID = "d111def1-87b8-41a7-a3f4-06a751728ff9"
 *
 * 这里生成两条关系：
 *  - p1 创建了 f1
 *  - p2 创建了 f1（模拟不同进程访问/创建同一文件的情形）
 */

const shipFile_p1_f1: ShipElementID = {
    ElementId: "ship-p1-f1",
    StartElementId: "p1",
    EndElementId: "f1",
};

export const testReverseProcessCreateFileShip1: ReverseProcessCreateFileShip = {
    ShipElementID: shipFile_p1_f1,
    Time: "2024/05/04 14:35:48",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    UniqueID: "rrel-p1-f1-001",
    ObjHash: "3c4b348ab52f5543e4ef225221c5af4f",
    Tags: [],
};

const shipFile_p2_f1: ShipElementID = {
    ElementId: "ship-p2-f1",
    StartElementId: "p2",
    EndElementId: "f1",
};

export const testReverseProcessCreateFileShip2: ReverseProcessCreateFileShip = {
    ShipElementID: shipFile_p2_f1,
    Time: "2024/05/04 14:50:00",
    ProcessGuid: "532541c0032808b0003aa91ac39ddbbb",
    UniqueID: "rrel-p2-f1-001",
    ObjHash: "3c4b348ab52f5543e4ef225221c5af4f",
    Tags: [],
};


/**
 * 说明（对应已有 mock 节点）：
 * - 进程节点 ElementId: "p1" （例如 slui.exe）
 * - 网络节点 ElementId: "n1" （例如 nslookup udp 192.168.74.129-192.168.74.2）
 * - 使用网络节点的 ObjHash 作为关系的 ObjHash
 */

const shipProcess_n1: ShipElementID = {
    ElementId: "ship-p1-n1",
    StartElementId: "p1", // 进程节点 ElementId
    EndElementId: "n1",   // 网络节点 ElementId
};

export const testProcessNetShip: ProcessNetShip = {
    ShipElementID: shipProcess_n1,
    Time: "2024/05/04 10:55:39",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    UniqueID: "pnrel-p1-n1-001",
    ObjHash: "708a3c6f67d4d86d1936654157fd536c",
    Tags: [],
};

const shipProcess_d1: ShipElementID = {
    ElementId: "ship-p1-d1",
    StartElementId: "p1", // 进程节点 ElementId
    EndElementId: "d1",   // DNS 节点 ElementId
};

export const testProcessDnsShip1: ProcessDnsShip = {
    ShipElementID: shipProcess_d1,
    Time: "2024/05/04 10:55:39",
    ProcessGuid: "432541c0032808b0003aa91ac39dda01",
    ObjHash: "708a3c6f67d4d86d1936654157fd536c",
    Tags: [],
};

// 定义 ShipElementID (从进程 p1 到进程 p2)
const shipProcessTerminate: ShipElementID = {
    ElementId: "ship-p1-p2-terminate",
    StartElementId: "p1",
    EndElementId: "p2",
};

export const testProcessTerminateShip: ProcessTerminateShip = {
    ShipElementID: shipProcessTerminate,
    Time: "2024/05/04 11:05:09",
    SelfExit: 0,
    ProcessGuid: "7e3b50a1c8e04c0d82f4a75afc92b99d",
    OperatorProcessGuid: "8d5f32c7f2b54a41a9d934e4a1c82d77",
    UniqueID: "terminate_p1_p2_20240504111045",
    Tags: [],
};

// ShipElementID
const shipProcessAccess_p1_p2: ShipElementID = {
    ElementId: "ship-p1-p2",
    StartElementId: "p1",
    EndElementId: "p2",
};


export const testProcessAccessShip1: ProcessAccessShip = {
    ShipElementID: shipProcessAccess_p1_p2,
    Time: "2024-05-04T11:15:22Z",
    GrantedAccess: 0x1FFFFF,
    ProcessGuid: "a9c3b0f1-1b24-47a3-8eaf-22b6d09123ff",
    OperatorProcessGuid: "f4b21c33-0e84-4820-bc2d-8a3f71d091ab",
    CallTrace: "ntdll.dll!NtOpenProcess+0x14 | kernel32.dll!OpenProcess+0x20",
    UniqueID: "access_p1_p2_001",
    Tags: [],
};

// ShipElementID
const shipNetDns_n1_d1: ShipElementID = {
    ElementId: "ship-n1-d1",
    StartElementId: "n1",
    EndElementId: "d1",
};


export const testNetDnsShip1: NetDnsShip = {
    ShipElementID: shipNetDns_n1_d1,
    Time: "2024-05-04T12:05:47Z",
    UniqueID: "netdns_n1_d1_001",
    Hash: "3b9f2b4c8d1d8e7b2a6d4a9e9b7c2f4d",
};

// ShipElementID
const shipNetAgent_n1_a1: ShipElementID = {
    ElementId: "ship-n1-a1",
    StartElementId: "n1",
    EndElementId: "a1",
};

export const testNetLateralMovementShip1: NetLateralMovementShip = {
    ShipElementID: shipNetAgent_n1_a1,
    Time: "2024-05-06T08:45:12Z",
    ObjHash: "e3b0c44298fc1c149afbf4c8996fb924",
    AgentID: "agent-001",
    SourceIP: "192.168.1.10",
    DestinationIP: "192.168.1.25",
    Tags: [],
};
