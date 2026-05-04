// mock-data-hardware-info.ts
// 与 AgentHardwareInfo 及子接口对齐的批量 Mock 数据

import type { AgentHardwareInfo } from "@/features/assets/host/types/hardware"

export const mockAgentHardwareInfos: AgentHardwareInfo[] = [
  {
    hostId: "fb9fc738-a6dd-45f8-8af1-0e194965322b",
    hostname: "LAB-001",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "AuthenticAMD",
          model: "AMD Ryzen 9 7950X 16-Core Processor",
          physicalCores: 8,
          logicalCores: 8,
          maxFrequencyMHz: 5400,
          regularFrequencyMHz: 4200,
          minFrequencyMHz: 3400,
          currentFrequencyMHz: 3907,
          cacheSizeBytes: 16777216,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Seagate",
          model: "Samsung SSD 970 EVO Plus 1TB",
          serialNumber: "SSD-568EBE05438A",
          size: 4294967296 * 1000, // 4 TB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "Intel",
          model: "Intel UHD Graphics 770",
          driverVersion: "30.8.14.6413",
          memoryMiB: 4096,
          minFrequencyMHz: 300,
          currentFrequencyMHz: 330,
          maxFrequencyMHz: 600,
        },
      ],
    },
    mainBoard: {
      vendor: "MSI",
      name: "Precision 5570",
      version: "3.0",
      serialNumber: "MB-E24B6759F682",
    },
    rams: [
      {
        vendor: "Samsung",
        model: "DDR4-2666",
        name: "DIMM 4",
        serialNumber: "RAM-B3ECD23510D8",
        sizeMiB: 32768,
        usedMiB: 13573,
        availableMiB: 19195,
      },
      {
        vendor: "Crucial",
        model: "DDR4-2666",
        name: "DIMM 1",
        serialNumber: "RAM-0B544A9BDDEF",
        sizeMiB: 8192,
        usedMiB: 5512,
        availableMiB: 2680,
      },
      {
        vendor: "Crucial",
        model: "DDR4-3200",
        name: "DIMM 4",
        serialNumber: "RAM-C0AA9C6017F7",
        sizeMiB: 4096,
        usedMiB: 3518,
        availableMiB: 578,
      },
      {
        vendor: "Corsair",
        model: "DDR4-2400",
        name: "DIMM 1",
        serialNumber: "RAM-294B5599F264",
        sizeMiB: 32768,
        usedMiB: 21856,
        availableMiB: 10912,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Wi-Fi 0",
          name: "Qualcomm Atheros QCA9377 Wireless Network Adapter",
          vendor: "Qualcomm",
          macAddress: "62:61:E5:47:D8:5D",
          ipv4Addresses: ["192.168.2.120"],
          ipv6Addresses: ["7fe6:2698:e2e2:3221:19e6:78e:2fc0:7906"],
          enabled: true,
          speedMbps: 1000,
        },
        {
          id: "Wi-Fi 1",
          name: "Intel(R) Wi-Fi 6 AX200 160MHz",
          vendor: "Intel",
          macAddress: "6D:CD:1E:54:C2:01",
          ipv4Addresses: [],
          ipv6Addresses: [],
          enabled: false,
          speedMbps: 10000,
        },
      ],
    },
  },
  {
    hostId: "1c29ea61-d929-41b9-b444-a8237fadc3d7",
    hostname: "LAB-002",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "AuthenticAMD",
          model: "AMD Ryzen 9 7950X 16-Core Processor",
          physicalCores: 12,
          logicalCores: 12,
          maxFrequencyMHz: 3900,
          regularFrequencyMHz: 3200,
          minFrequencyMHz: 2000,
          currentFrequencyMHz: 2445,
          cacheSizeBytes: 12582912,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Seagate",
          model: "Samsung SSD 970 EVO Plus 1TB",
          serialNumber: "SSD-FB7949269A88",
          size: 274877906944, // 256 GB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "Intel",
          model: "Intel UHD Graphics 770",
          driverVersion: "30.23.18.2113",
          memoryMiB: 24576,
          minFrequencyMHz: 300,
          currentFrequencyMHz: 760,
          maxFrequencyMHz: 800,
        },
        {
          id: "GPU 1",
          vendor: "NVIDIA",
          model: "NVIDIA GeForce RTX 4090",
          driverVersion: "31.84.84.9565",
          memoryMiB: 2048,
          minFrequencyMHz: 400,
          currentFrequencyMHz: 541,
          maxFrequencyMHz: 800,
        },
      ],
    },
    mainBoard: {
      vendor: "Lenovo",
      name: "Precision 5570",
      version: "3.0",
      serialNumber: "MB-454FFA187EA8",
    },
    rams: [
      {
        vendor: "G.Skill",
        model: "DDR4-3200",
        name: "DIMM 4",
        serialNumber: "RAM-5567293F48B7",
        sizeMiB: 16384,
        usedMiB: 9760,
        availableMiB: 6624,
      },
      {
        vendor: "Corsair",
        model: "DDR4-3600",
        name: "DIMM 1",
        serialNumber: "RAM-285930503170", // 来源随机程序，保留字符串
        sizeMiB: 16384,
        usedMiB: 4464,
        availableMiB: 11920,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Ethernet 0",
          name: "Realtek PCIe 2.5GbE Family Controller",
          vendor: "Realtek",
          macAddress: "B2:23:7D:BD:91:50",
          ipv4Addresses: ["192.168.3.215"],
          ipv6Addresses: ["9ae3:401:9948:3509:44c1:8768:3b19:36cd"],
          enabled: true,
          speedMbps: 0,
        },
      ],
    },
  },
  {
    hostId: "d46f97cb-ac71-49e9-826f-1e91618841b6",
    hostname: "LAB-003",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "AuthenticAMD",
          model: "AMD Ryzen 9 7950X 16-Core Processor",
          physicalCores: 16,
          logicalCores: 32,
          maxFrequencyMHz: 4300,
          regularFrequencyMHz: 3600,
          minFrequencyMHz: 2400,
          currentFrequencyMHz: 3435,
          cacheSizeBytes: 31457280,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Samsung",
          model: "Samsung SSD 970 EVO Plus 1TB",
          serialNumber: "SSD-F16DC74E7BF3",
          size: 2147483648 * 1000, // 2 TB 近似
        },
        {
          vendor: "Seagate",
          model: "Samsung SSD 970 EVO Plus 1TB",
          serialNumber: "SSD-D249F2EE577C",
          size: 274877906944, // 256 GB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "NVIDIA",
          model: "NVIDIA GeForce RTX 4090",
          driverVersion: "30.14.19.3442",
          memoryMiB: 4096,
          minFrequencyMHz: 1000,
          currentFrequencyMHz: 2348,
          maxFrequencyMHz: 2400,
        },
      ],
    },
    mainBoard: {
      vendor: "Dell",
      name: "ThinkPad X1 Carbon Gen 10",
      version: "5.0",
      serialNumber: "MB-C7AD2DEA24D6",
    },
    rams: [
      {
        vendor: "G.Skill",
        model: "DDR4-2400",
        name: "DIMM 3",
        serialNumber: "RAM-9F1356E6E60E",
        sizeMiB: 8192,
        usedMiB: 5158,
        availableMiB: 3034,
      },
      {
        vendor: "Kingston",
        model: "DDR4-2666",
        name: "DIMM 2",
        serialNumber: "RAM-0C4D81477353",
        sizeMiB: 16384,
        usedMiB: 3929,
        availableMiB: 12455,
      },
      {
        vendor: "Samsung",
        model: "DDR4-3600",
        name: "DIMM 2",
        serialNumber: "RAM-D9947FDF6742",
        sizeMiB: 4096,
        usedMiB: 2267,
        availableMiB: 1829,
      },
      {
        vendor: "G.Skill",
        model: "DDR4-3600",
        name: "DIMM 1",
        serialNumber: "RAM-830C755210EC",
        sizeMiB: 8192,
        usedMiB: 2969,
        availableMiB: 5223,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Wi-Fi 0",
          name: "Qualcomm Atheros QCA9377 Wireless Network Adapter",
          vendor: "Qualcomm",
          macAddress: "88:51:37:C3:13:F0",
          ipv4Addresses: ["192.168.1.53"],
          ipv6Addresses: ["ebac:b306:9c41:7487:7223:c1d:62e1:cc03"],
          enabled: true,
          speedMbps: 2500,
        },
      ],
    },
  },
  {
    hostId: "8219b4b7-dad7-42db-804f-ffa374dca2ce",
    hostname: "LAB-004",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "GenuineIntel",
          model: "Intel(R) Core(TM) i9-12900K",
          physicalCores: 8,
          logicalCores: 8,
          maxFrequencyMHz: 5100,
          regularFrequencyMHz: 4200,
          minFrequencyMHz: 3400,
          currentFrequencyMHz: 3636,
          cacheSizeBytes: 20971520,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Crucial",
          model: "Seagate ST2000DM008-2FR102",
          serialNumber: "HDD-12A9091D6DF3",
          size: 274877906944, // 256 GB 近似
        },
        {
          vendor: "Samsung",
          model: "Crucial MX500 500GB",
          serialNumber: "HDD-6C8582F7B213",
          size: 2147483648 * 1000, // 2 TB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "Intel",
          model: "Intel UHD Graphics 770",
          driverVersion: "32.24.42.1727",
          memoryMiB: 8192,
          minFrequencyMHz: 1000,
          currentFrequencyMHz: 1397,
          maxFrequencyMHz: 1500,
        },
      ],
    },
    mainBoard: {
      vendor: "ASUSTeK COMPUTER INC.",
      name: "XPS 15 9500",
      version: "5.0",
      serialNumber: "MB-CBB768AE7610",
    },
    rams: [
      {
        vendor: "Crucial",
        model: "DDR4-2400",
        name: "DIMM 3",
        serialNumber: "RAM-988F26620922",
        sizeMiB: 8192,
        usedMiB: 4621,
        availableMiB: 3571,
      },
      {
        vendor: "Corsair",
        model: "DDR4-3200",
        name: "DIMM 3",
        serialNumber: "RAM-CCBA131EEDBC",
        sizeMiB: 16384,
        usedMiB: 14144,
        availableMiB: 2240,
      },
      {
        vendor: "Crucial",
        model: "DDR4-3200",
        name: "DIMM 2",
        serialNumber: "RAM-C006901E1CDF",
        sizeMiB: 32768,
        usedMiB: 17241,
        availableMiB: 15527,
      },
      {
        vendor: "Crucial",
        model: "DDR4-2666",
        name: "DIMM 3",
        serialNumber: "RAM-6E6A256F5130",
        sizeMiB: 8192,
        usedMiB: 5082,
        availableMiB: 3110,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Ethernet 0",
          name: "Intel(R) Ethernet Connection I219-V",
          vendor: "Intel",
          macAddress: "6B:DC:A4:EE:E2:E2",
          ipv4Addresses: ["192.168.5.56"],
          ipv6Addresses: ["f245:56e1:2b6a:914c:ab9d:2fd0:7840:9eef"],
          enabled: true,
          speedMbps: 1000,
        },
        {
          id: "Ethernet 1",
          name: "Realtek PCIe 2.5GbE Family Controller",
          vendor: "Realtek",
          macAddress: "17:7D:F3:25:E9:D4",
          ipv4Addresses: ["192.168.5.149"],
          ipv6Addresses: ["638d:c498:fd1f:cc9f:7ceb:4b8e:2d6:3692"],
          enabled: true,
          speedMbps: 10000,
        },
      ],
    },
  },
  {
    hostId: "4d4b9ce5-b7cf-4a34-8f06-92064ac65c68",
    hostname: "LAB-005",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "GenuineIntel",
          model: "Intel(R) Core(TM) i9-12900K",
          physicalCores: 4,
          logicalCores: 8,
          maxFrequencyMHz: 3600,
          regularFrequencyMHz: 2400,
          minFrequencyMHz: 1600,
          currentFrequencyMHz: 3241,
          cacheSizeBytes: 31457280,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Kingston",
          model: "Crucial MX500 500GB",
          serialNumber: "HDD-359ACC0C9F7D",
          size: 4294967296 * 1000, // 4 TB 近似
        },
        {
          vendor: "Kingston",
          model: "Crucial MX500 500GB",
          serialNumber: "HDD-076E062BB1CB",
          size: 2147483648 * 1000, // 2 TB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "Intel",
          model: "Intel UHD Graphics 770",
          driverVersion: "30.81.45.9540",
          memoryMiB: 12288,
          minFrequencyMHz: 1100,
          currentFrequencyMHz: 1969,
          maxFrequencyMHz: 2100,
        },
      ],
    },
    mainBoard: {
      vendor: "HP",
      name: "ThinkPad X1 Carbon Gen 10",
      version: "4.0",
      serialNumber: "MB-75CF42BCF7DF",
    },
    rams: [
      {
        vendor: "Kingston",
        model: "DDR4-3200",
        name: "DIMM 3",
        serialNumber: "RAM-B599356F838F",
        sizeMiB: 16384,
        usedMiB: 7117,
        availableMiB: 9267,
      },
      {
        vendor: "G.Skill",
        model: "DDR4-2666",
        name: "DIMM 4",
        serialNumber: "RAM-CE3F8C4B699B",
        sizeMiB: 4096,
        usedMiB: 1385,
        availableMiB: 2711,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Ethernet 0",
          name: "Realtek PCIe 2.5GbE Family Controller",
          vendor: "Realtek",
          macAddress: "D4:D0:A9:EE:D4:1F",
          ipv4Addresses: ["192.168.1.215"],
          ipv6Addresses: ["d71d:c769:a00:c2c1:f436:304:b419:98e3"],
          enabled: true,
          speedMbps: 10000,
        },
        {
          id: "Wi-Fi 1",
          name: "Intel(R) Wi-Fi 6 AX200 160MHz",
          vendor: "Intel",
          macAddress: "70:8B:DF:F8:0E:C7",
          ipv4Addresses: [],
          ipv6Addresses: [],
          enabled: false,
          speedMbps: 2500,
        },
        {
          id: "Wi-Fi 2",
          name: "Intel(R) Wi-Fi 6 AX200 160MHz",
          vendor: "Intel",
          macAddress: "41:0D:C9:0D:2A:DB",
          ipv4Addresses: [],
          ipv6Addresses: [],
          enabled: false,
          speedMbps: 1000,
        },
      ],
    },
  },
  {
    hostId: "d580fdce-7161-41f9-9819-a6c345d2e613",
    hostname: "LAB-006",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "GenuineIntel",
          model: "Intel(R) Core(TM) i7-10700K CPU / 3.80GHz",
          physicalCores: 8,
          logicalCores: 8,
          maxFrequencyMHz: 4300,
          regularFrequencyMHz: 3600,
          minFrequencyMHz: 2400,
          currentFrequencyMHz: 3069,
          cacheSizeBytes: 20971520,
        },
        {
          socketId: "Socket 1",
          vendor: "AuthenticAMD",
          model: "AMD Ryzen 9 7950X 16-Core Processor",
          physicalCores: 12,
          logicalCores: 24,
          maxFrequencyMHz: 3600,
          regularFrequencyMHz: 2400,
          minFrequencyMHz: 1600,
          currentFrequencyMHz: 3134,
          cacheSizeBytes: 67108864,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Seagate",
          model: "WDC WD10EZEX-00WN4A0",
          serialNumber: "HDD-FFAAAC201CA8",
          size: 274877906944, // 256 GB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "NVIDIA",
          model: "NVIDIA GeForce RTX 3070 Ti",
          driverVersion: "30.60.95.2874",
          memoryMiB: 4096,
          minFrequencyMHz: 100,
          currentFrequencyMHz: 544,
          maxFrequencyMHz: 900,
        },
      ],
    },
    mainBoard: {
      vendor: "HP",
      name: "PRIME Z790-A",
      version: "3.0",
      serialNumber: "MB-3D4C833F7F52",
    },
    rams: [
      {
        vendor: "Samsung",
        model: "DDR4-2400",
        name: "DIMM 2",
        serialNumber: "RAM-BC26603BED1E",
        sizeMiB: 8192,
        usedMiB: 6601,
        availableMiB: 1591,
      },
      {
        vendor: "Samsung",
        model: "DDR4-2400",
        name: "DIMM 3",
        serialNumber: "RAM-95A694CFE6E0",
        sizeMiB: 16384,
        usedMiB: 5047,
        availableMiB: 11337,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Wi-Fi 0",
          name: "Intel(R) Wi-Fi 6 AX200 160MHz",
          vendor: "Intel",
          macAddress: "26:7C:34:9A:3D:15",
          ipv4Addresses: ["192.168.2.138"],
          ipv6Addresses: ["db54:bdbb:234e:aeb5:67a:d711:fafb:3609"],
          enabled: true,
          speedMbps: 10000,
        },
        {
          id: "Wi-Fi 1",
          name: "Qualcomm Atheros QCA9377 Wireless Network Adapter",
          vendor: "Qualcomm",
          macAddress: "DE:5A:8A:F7:EE:DF",
          ipv4Addresses: ["192.168.5.153"],
          ipv6Addresses: ["896b:a505:7db1:2c5f:8ecf:e6cf:7cdb:edee"],
          enabled: true,
          speedMbps: 0,
        },
        {
          id: "Wi-Fi 2",
          name: "Intel(R) Wi-Fi 6 AX200 160MHz",
          vendor: "Intel",
          macAddress: "FD:A6:5D:F9:6C:B5",
          ipv4Addresses: ["192.168.2.89"],
          ipv6Addresses: ["8f2f:8d73:532:61d2:2bd5:7b93:d017:fa26"],
          enabled: true,
          speedMbps: 0,
        },
      ],
    },
  },
  {
    hostId: "0579dae2-a1a1-454b-809d-f2f9fd3f84e1",
    hostname: "LAB-007",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "AuthenticAMD",
          model: "AMD Ryzen 9 7950X 16-Core Processor",
          physicalCores: 12,
          logicalCores: 24,
          maxFrequencyMHz: 3300,
          regularFrequencyMHz: 2400,
          minFrequencyMHz: 1600,
          currentFrequencyMHz: 2428,
          cacheSizeBytes: 16777216,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Crucial",
          model: "Seagate ST2000DM008-2FR102",
          serialNumber: "HDD-13A1534BD748",
          size: 2147483648 * 1000, // 2 TB 近似
        },
        {
          vendor: "Crucial",
          model: "Crucial MX500 500GB",
          serialNumber: "HDD-8FD635117E84",
          size: 1073741824 * 1000, // 1 TB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "Intel",
          model: "Intel UHD Graphics 770",
          driverVersion: "31.34.49.5118",
          memoryMiB: 24576,
          minFrequencyMHz: 800,
          currentFrequencyMHz: 1519,
          maxFrequencyMHz: 1700,
        },
        {
          id: "GPU 1",
          vendor: "NVIDIA",
          model: "NVIDIA GeForce RTX 3070 Ti",
          driverVersion: "30.94.71.5530",
          memoryMiB: 8192,
          minFrequencyMHz: 100,
          currentFrequencyMHz: 496,
          maxFrequencyMHz: 900,
        },
      ],
    },
    mainBoard: {
      vendor: "MSI",
      name: "MEG X670E ACE",
      version: "5.0",
      serialNumber: "MB-2BA9821B270A",
    },
    rams: [
      {
        vendor: "Kingston",
        model: "DDR4-2666",
        name: "DIMM 3",
        serialNumber: "RAM-694F0E9574EF",
        sizeMiB: 4096,
        usedMiB: 1614,
        availableMiB: 2482,
      },
      {
        vendor: "Corsair",
        model: "DDR4-2666",
        name: "DIMM 3",
        serialNumber: "RAM-E59B93B2EDED",
        sizeMiB: 8192,
        usedMiB: 4114,
        availableMiB: 4078,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Ethernet 0",
          name: "Intel(R) Ethernet Connection I219-V",
          vendor: "Intel",
          macAddress: "FB:34:06:91:F0:F5",
          ipv4Addresses: ["192.168.3.89"],
          ipv6Addresses: ["5e64:1a4e:8144:f498:3a69:2174:cd29:fbc6"],
          enabled: true,
          speedMbps: 100,
        },
      ],
    },
  },
{
    hostId: "f00fdfd8-dd05-45fb-9aae-2ca49b5174cd",
    hostname: "LAB-008",
    cpu: {
      sockets: [
        {
          socketId: "Socket 0",
          vendor: "GenuineIntel",
          model: "Intel(R) Core(TM) i7-10700K CPU / 3.80GHz",
          physicalCores: 16,
          logicalCores: 32,
          maxFrequencyMHz: 3100,
          regularFrequencyMHz: 2400,
          minFrequencyMHz: 1600,
          currentFrequencyMHz: 2742,
          cacheSizeBytes: 31457280,
        },
      ],
    },
    disks: {
      disks: [
        {
          vendor: "Crucial",
          model: "KINGSTON SNV2S1000G",
          serialNumber: "SSD-50549EAAE99F",
          size: 2147483648 * 1000, // 2 TB 近似
        },
        {
          vendor: "Kingston",
          model: "Seagate ST2000DM008-2FR102",
          serialNumber: "HDD-9F09A0AE50D5",
          size: 4294967296 * 1000, // 4 TB 近似
        },
      ],
    },
    gpus: {
      gpus: [
        {
          id: "GPU 0",
          vendor: "AMD",
          model: "AMD Radeon RX 6800 XT",
          driverVersion: "31.84.20.3573",
          memoryMiB: 24576,
          minFrequencyMHz: 300,
          currentFrequencyMHz: 516,
          maxFrequencyMHz: 900,
        },
        {
          id: "GPU 1",
          vendor: "NVIDIA",
          model: "NVIDIA GeForce RTX 3070 Ti",
          driverVersion: "32.76.70.5771",
          memoryMiB: 4096,
          minFrequencyMHz: 300,
          currentFrequencyMHz: 1222,
          maxFrequencyMHz: 1500,
        },
      ],
    },
    mainBoard: {
      vendor: "HP",
      name: "ThinkPad X1 Carbon Gen 10",
      version: "3.0",
      serialNumber: "MB-8B5817577179",
    },
    rams: [
      {
        vendor: "Kingston",
        model: "DDR4-2666",
        name: "DIMM 3",
        serialNumber: "RAM-694F0E9574EF",
        sizeMiB: 4096,
        usedMiB: 1614,
        availableMiB: 2482,
      },
      {
        vendor: "Corsair",
        model: "DDR4-2666",
        name: "DIMM 3",
        serialNumber: "RAM-E59B93B2EDED",
        sizeMiB: 8192,
        usedMiB: 4114,
        availableMiB: 4078,
      },
    ],
    networkInterfaces: {
      interfaces: [
        {
          id: "Ethernet 0",
          name: "Intel(R) Ethernet Connection I219-V",
          vendor: "Intel",
          macAddress: "FB:34:06:91:F0:F5",
          ipv4Addresses: ["192.168.3.89"],
          ipv6Addresses: ["5e64:1a4e:8144:f498:3a69:2174:cd29:fbc6"],
          enabled: true,
          speedMbps: 100,
        },
      ],
    },
  },
];