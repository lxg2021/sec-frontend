
export function GetEdgeDirection(linkName: string): string {
  const edgeTypeMap: Record<string, string> = {
    "NET_DNS": "bidirectional",
    "NET_LATERAL_MOVEMENT": "bidirectional",
    "RENAME_PEER_FILE": "bidirectional",
    "MOVE_PEER_FILE": "bidirectional",
    "STREAM_PEER_FILE": "bidirectional",
    "NEW_FILE_PEER_STREAM": "bidirectional",
    "FILE_MD5_PEER_SHIP": "bidirectional",
    "TASK_LATERAL_MOVEMENT": "bidirectional",
    "DLL_MD5_PEER_SHIP": "bidirectional",
    "DRIVER_MD5_PEER_SHIP": "bidirectional",
    "RENAME_REGKEY_PEER": "bidirectional",
    "WMI_LATERAL_MOVEMENT": "bidirectional",
    "DEVICE_CHANGE": "bidirectional",
    "SERVICE_MD5_PEER_SHIP": "bidirectional",
  };

  return edgeTypeMap[linkName] || "forward";
}

