// mock-data-soft-aggregate.ts
import { SoftItem, SoftwareInstallation } from '@/features/assets/software/types/software-aggregate';

// 定义一些常见的安装状态
type InstallState = 'Installed' | 'PartiallyInstalled' | 'Failed' | 'NotInstalled';

// 生成模拟的软件安装数据
export const mockSoftwareData: SoftItem[] = [
  {
    displayName: "Microsoft Office Professional Plus 2021",
    description: "Productivity suite including Word, Excel, PowerPoint and more",
    identifyingNumber: "{90160000-0011-0000-0000-0000000FF1CE}",
    name: "PROPLUS",
    skuNumber: "00339-00000-00001-AA123",
    vendor: "Microsoft Corporation",
    version: "16.0.14326.20404",
    urlInfoAbout: "https://www.microsoft.com/en-us/microsoft-365",
    hash: "md5_office_proplus_2021_hash123",
    installations: [
      {
        hostId: "host-001",
        hostName: "DESKTOP-AB123CD",
        installDate: "2023-05-15T10:30:00Z",
        installLocation: "C:\\Program Files\\Microsoft Office\\root\\Office16",
        installState: "Installed" as InstallState,
        packageCache: "C:\\Windows\\Installer\\23a45b.msi",
        uninstallString: "msiexec /x {90160000-0011-0000-0000-0000000FF1CE}",
        quietUninstallString: "msiexec /x {90160000-0011-0000-0000-0000000FF1CE} /quiet"
      },
      {
        hostId: "host-002",
        hostName: "LAPTOP-XY789ZZ",
        installDate: "2023-06-20T14:45:00Z",
        installLocation: "C:\\Program Files\\Microsoft Office",
        installState: "Installed" as InstallState,
        packageCache: "C:\\Windows\\Installer\\67c89d.msi",
        uninstallString: "msiexec /x {90160000-0011-0000-0000-0000000FF1CE}",
        quietUninstallString: "msiexec /x {90160000-0011-0000-0000-0000000FF1CE} /quiet"
      }
    ]
  },
  {
    displayName: "Adobe Acrobat Reader DC",
    description: "PDF viewer and editor",
    identifyingNumber: "{AC76BA86-7AD7-1033-7B44-AC0F074E4100}",
    name: "AcroRead",
    vendor: "Adobe Systems Incorporated",
    version: "23.003.20244",
    urlInfoAbout: "https://www.adobe.com/acrobat/pdf-reader.html",
    hash: "md5_adobe_acrobat_reader_hash456",
    installations: [
      {
        hostId: "host-001",
        hostName: "DESKTOP-AB123CD",
        installDate: "2023-04-10T09:15:00Z",
        installLocation: "C:\\Program Files (x86)\\Adobe\\Acrobat Reader DC",
        installState: "Installed" as InstallState,
        uninstallString: "MsiExec.exe /X{AC76BA86-7AD7-1033-7B44-AC0F074E4100}"
      },
      {
        hostId: "host-003",
        hostName: "SERVER-01",
        installDate: "2023-07-05T11:20:00Z",
        installLocation: "C:\\Program Files\\Adobe\\Acrobat Reader DC",
        installState: "Installed" as InstallState,
        uninstallString: "MsiExec.exe /X{AC76BA86-7AD7-1033-7B44-AC0F074E4100}"
      },
      {
        hostId: "host-004",
        hostName: "WORKSTATION-22",
        installDate: "2023-08-12T16:30:00Z",
        installState: "Failed" as InstallState,
        packageCache: "C:\\Windows\\Installer\\89e01f.msi"
      }
    ]
  },
  {
    displayName: "Google Chrome",
    description: "Web browser",
    identifyingNumber: "{8A69D345-D564-463C-AFF1-A69D9E530F96}",
	name: "Chrome",
    vendor: "Google LLC",
    version: "116.0.5845.140",
    urlInfoAbout: "https://www.google.com/chrome/",
    hash: "md5_google_chrome_hash789",
    installations: [
      {
        hostId: "host-001",
        hostName: "DESKTOP-AB123CD",
        installDate: "2023-03-22T08:45:00Z",
        installLocation: "C:\\Program Files\\Google\\Chrome\\Application",
        installState: "Installed" as InstallState,
        uninstallString: "\"C:\\Program Files\\Google\\Chrome\\Application\\116.0.5845.140\\Installer\\setup.exe\" --uninstall --system-level"
      },
      {
        hostId: "host-002",
        hostName: "LAPTOP-XY789ZZ",
        installDate: "2023-02-18T13:20:00Z",
        installLocation: "C:\\Program Files (x86)\\Google\\Chrome\\Application",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-005",
        hostName: "TABLET-07",
        installDate: "2023-09-01T10:05:00Z",
        installLocation: "C:\\Program Files\\Google\\Chrome",
        installState: "Installed" as InstallState
      }
    ]
  },
  {
    displayName: "Visual Studio Code",
    description: "Code editor",
    identifyingNumber: "{EA457B21-F73E-494C-ACAB-524FDE069978}_is1",
	name: "Visual Studio Code",
    vendor: "Microsoft Corporation",
    version: "1.81.1",
    urlInfoAbout: "https://code.visualstudio.com/",
    hash: "md5_vscode_hash012",
    installations: [
      {
        hostId: "host-002",
        hostName: "LAPTOP-XY789ZZ",
        installDate: "2023-07-30T15:40:00Z",
        installLocation: "C:\\Users\\Developer\\AppData\\Local\\Programs\\Microsoft VS Code",
        installState: "Installed" as InstallState,
        uninstallString: "\"C:\\Users\\Developer\\AppData\\Local\\Programs\\Microsoft VS Code\\unins000.exe\""
      },
      {
        hostId: "host-006",
        hostName: "DEV-MACHINE-01",
        installDate: "2023-06-14T09:25:00Z",
        installLocation: "C:\\Program Files\\Microsoft VS Code",
        installState: "Installed" as InstallState
      }
    ]
  },
  {
    displayName: "Node.js",
    description: "JavaScript runtime",
    identifyingNumber: "{1D9E87a6-5DE1-41F3-B278-B2FAE3A3867A}",
	name: "Node",
    vendor: "OpenJS Foundation",
    version: "18.17.1",
    urlInfoAbout: "https://nodejs.org/",
    hash: "md5_nodejs_hash345",
    installations: [
      {
        hostId: "host-002",
        hostName: "LAPTOP-XY789ZZ",
        installDate: "2023-08-05T11:15:00Z",
        installLocation: "C:\\Program Files\\nodejs",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-006",
        hostName: "DEV-MACHINE-01",
        installDate: "2023-05-20T14:30:00Z",
        installLocation: "C:\\Program Files\\nodejs",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-007",
        hostName: "TEST-SERVER-02",
        installDate: "2023-07-10T16:45:00Z",
        installState: "PartiallyInstalled" as InstallState
      }
    ]
  },
  {
    displayName: "Python 3.11",
    description: "Programming language",
    identifyingNumber: "{6E3A88A6-7516-4D1D-84F4-897F3A2EE491}",
	name: "Python",
    vendor: "Python Software Foundation",
    version: "3.11.5",
    urlInfoAbout: "https://www.python.org/",
    hash: "md5_python_hash678",
    installations: [
      {
        hostId: "host-006",
        hostName: "DEV-MACHINE-01",
        installDate: "2023-04-25T10:50:00Z",
        installLocation: "C:\\Program Files\\Python311",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-008",
        hostName: "DATA-ANALYSIS-03",
        installDate: "2023-09-05T13:35:00Z",
        installLocation: "C:\\Python\\Python311",
        installState: "Installed" as InstallState
      }
    ]
  },
  {
    displayName: "7-Zip",
    description: "File archiver",
    identifyingNumber: "{23170F69-40C1-2702-2115-000001000000}",
	name: "7Z",
    vendor: "Igor Pavlov",
    version: "23.01.00.0",
    urlInfoAbout: "https://www.7-zip.org/",
    hash: "md5_7zip_hash901",
    installations: [
      {
        hostId: "host-001",
        hostName: "DESKTOP-AB123CD",
        installDate: "2023-01-15T08:20:00Z",
        installLocation: "C:\\Program Files\\7-Zip",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-002",
        hostName: "LAPTOP-XY789ZZ",
        installDate: "2023-02-28T12:10:00Z",
        installLocation: "C:\\Program Files\\7-Zip",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-003",
        hostName: "SERVER-01",
        installDate: "2023-03-17T15:45:00Z",
        installLocation: "C:\\Program Files\\7-Zip",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-009",
        hostName: "BACKUP-SERVER",
        installState: "NotInstalled" as InstallState
      }
    ]
  },
  {
    displayName: "VLC Media Player",
    description: "Media player",
    identifyingNumber: "{8E4DF7F0-C7CF-4B5D-9B15-0B9B4A8E5D6C}",
	name: "VLC",
    vendor: "VideoLAN",
    version: "3.0.18",
    urlInfoAbout: "https://www.videolan.org/vlc/",
    hash: "md5_vlc_hash234",
    installations: [
      {
        hostId: "host-001",
        hostName: "DESKTOP-AB123CD",
        installDate: "2023-06-08T11:30:00Z",
        installLocation: "C:\\Program Files\\VideoLAN\\VLC",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-010",
        hostName: "MEDIA-CENTER",
        installDate: "2023-07-22T14:15:00Z",
        installLocation: "C:\\Program Files (x86)\\VideoLAN\\VLC",
        installState: "Installed" as InstallState
      }
    ]
  },
  {
    displayName: "Windows Security Update KB5005565",
    description: "Security update for Microsoft Windows",
    identifyingNumber: "{4B5769A5-6F2D-4A1E-8E3A-9D7B5C4D3E2F}",
	name: "KB5005565",
    vendor: "Microsoft Corporation",
    version: "10.0.19041.1237",
    hash: "md5_windows_update_hash567",
    installations: [
      {
        hostId: "host-001",
        hostName: "DESKTOP-AB123CD",
        installDate: "2023-08-15T04:00:00Z",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-002",
        hostName: "LAPTOP-XY789ZZ",
        installDate: "2023-08-15T04:00:00Z",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-003",
        hostName: "SERVER-01",
        installDate: "2023-08-16T02:30:00Z",
        installState: "Installed" as InstallState
      }
    ]
  },
  {
    displayName: "Git",
    description: "Version control system",
    identifyingNumber: "{9D1F2D8A-5B5A-4C9F-8E4D-2C7B6A5D4E3F}",
	name: "Git",
    vendor: "The Git Development Community",
    version: "2.42.0.2",
    urlInfoAbout: "https://git-scm.com/",
    hash: "md5_git_hash890",
    installations: [
      {
        hostId: "host-002",
        hostName: "LAPTOP-XY789ZZ",
        installDate: "2023-05-10T09:45:00Z",
        installLocation: "C:\\Program Files\\Git",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-006",
        hostName: "DEV-MACHINE-01",
        installDate: "2023-04-18T13:20:00Z",
        installLocation: "C:\\Program Files\\Git",
        installState: "Installed" as InstallState
      },
      {
        hostId: "host-008",
        hostName: "DATA-ANALYSIS-03",
        installDate: "2023-07-03T15:10:00Z",
        installLocation: "C:\\Program Files\\Git",
        installState: "Installed" as InstallState
      }
    ]
  }
];