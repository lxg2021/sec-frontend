"use client"

const FALLBACK_CONFIG = {
  api: {
    baseUrl: "http://127.0.0.1:8090",
    prefix: "/api/v1",
    timeout: 15000,
    successCodes: [0, 200],
    endpoints: {
      login: "/sensor/users/login",
      logout: "/sensor/users/logout",
      refreshToken: "/sensor/users/refresh",
      createUser: "/sensor/users/create",
      getUserById: "/sensor/users/get-by-id",
      getUserByUsername: "/sensor/users/get-by-username",
      getUserInfo: "/sensor/users/get-by-id",
      listUsers: "/sensor/users/list",
      listUserPermissionAuditEvents: "/sensor/users/permission-audit/list",
      updateUser: "/sensor/users/update",
      changePassword: "/sensor/users/update-password",
      softDeleteUser: "/sensor/users/soft-delete",
      hardDeleteUser: "/sensor/users/hard-delete",
      resetPassword: "/sensor/users/password-reset/request",
      confirmPasswordReset: "/sensor/users/password-reset/confirm",
      getLogicGroups: "/sensor/host-mgr/logic-groups/get",
      replaceLogicTree: "/sensor/host-mgr/logic-groups/replace-tree",
      importHosts: "/sensor/host-mgr/host/import-hosts",
      approveHost: "/sensor/host-mgr/host/approve-host",
      getHostSummary: "/sensor/host-mgr/host/host-summary",
      getSingleHostDetail: "/sensor/host-mgr/host/single-host-detail",
      getAllHostsPagination: "/sensor/host-mgr/host/all-hosts-detail-pagination",
      getLogicGroupHosts: "/sensor/host-mgr/host/logic-group-hosts",
      getHardwareInfo: "/sensor/asset/get-hardware-info",
      getHardwareSummary: "/sensor/asset/get-hardware-summary",
      getCPUAssetPagination: "/sensor/asset/get-cpu-asset-pagination",
      getDiskAssetPagination: "/sensor/asset/get-disk-asset-pagination",
      getMainboardAssetPagination: "/sensor/asset/get-mainboard-asset-pagination",
      getMemoryAssetPagination: "/sensor/asset/get-memory-asset-pagination",
      getGPUAssetPagination: "/sensor/asset/get-gpu-asset-pagination",
      getNetworkAssetPagination: "/sensor/asset/get-network-asset-pagination",
      getHostSoftwareInfoPagination: "/sensor/asset/get-host-software-info-pagination",
      getSoftwareDistributionPagination: "/sensor/asset/get-software-distribution-pagination",
      getSoftwareSummary: "/sensor/asset/get-software-summary",
      submitCollection: "/sensor/collection/submit",
      listCollectionSubmissions: "/sensor/collection/submissions/list",
      getCollectionSubmission: "/sensor/collection/submissions/get",
      approveCollectionSubmission: "/sensor/collection/submissions/approve",
      rejectCollectionSubmission: "/sensor/collection/submissions/reject",
      getBaselineOptions: "/sensor/baseline/options",
      getAllBaselines: "/sensor/baseline/list",
      getAllBaselineTemplates: "/sensor/baseline/templates/list",
      getBaselineTemplateItems: "/sensor/baseline/templates/items",
      createCustomBaseline: "/sensor/baseline/custom/create",
      getBaselineDailyStats: "/sensor/baseline/stats/daily",
      getBaselineTrend: "/sensor/baseline/stats/trend",
      getBaselineCategoryStats: "/sensor/baseline/stats/categories",
      getBaselineDetail: "/sensor/baseline/detail",
      getBaselineItemStatistics: "/sensor/baseline/item/statistics",
      getBaselineItemHostResults: "/sensor/baseline/item/hosts",
      getSystemPatchStats: "/sensor/patch/stats/system-patch-stats",
      getTopRiskHosts: "/sensor/patch/stats/top-risk-hosts",
      getCoverageTrend: "/sensor/patch/stats/coverage-trend",
      getSecurityLevelDistribution: "/sensor/patch/stats/security-level-distribution",
      getHostPatchSummary: "/sensor/patch/host/summary",
      getHostPatches: "/sensor/patch/host/list",
      getHostsWithPatchSummary: "/sensor/patch/hosts/summary-list",
      getAllPatchCoverageForInstall: "/sensor/patch/patches/coverage-all",
      getPatchInstallTasks: "/sensor/patch/installtask/list",
      getPatchInstallTaskProgress: "/sensor/patch/installtask/progress",
      createPatchInstallTask: "/sensor/control/patch/installtask",
      listPMCObjectDefinitions: "/sensor/control/pmc/object-definitions/list",
      listPMCOperations: "/sensor/control/pmc/operations/list",
      queryPMCExecutionResults: "/sensor/control/pmc/execution-results/query-by-filter",
      listPMCAuditEvents: "/sensor/control/pmc/audit-events/list",
      operatePMCObject: "/sensor/control/pmc/objects/operate",
      createNetworkAccessPolicy: "/sensor/control/network/policy",
      createFileAccessPolicy: "/sensor/control/fileaccess/policy",
      createRegistryAccessPolicy: "/sensor/control/registryaccess/policy",
      createProcessAccessPolicy: "/sensor/control/processaccess/policy",
      patchImmediateScan: "/sensor/control/patch/immediatescan",
      patchOneClickRepair: "/sensor/control/patch/oneclickrepair",
      baselineOneClickRepair: "/sensor/control/baseline/oneclickrepair",
      baselineImmediateScan: "/sensor/control/baseline/immediatescan",
      baselineScanPolicy: "/sensor/control/baseline/scanpolicy",
      listBaselineScanPolicies: "/sensor/control/baseline/scanpolicy/list",
      getForensicOverview: "/sensor/analysis/forensic/overview/get",
      getForensicBackendStatus: "/sensor/analysis/forensic/backend/status/get",
      syncForensicEndpoints: "/sensor/analysis/forensic/endpoints/sync",
      listForensicEndpoints: "/sensor/analysis/forensic/endpoints/list",
      getForensicEndpoint: "/sensor/analysis/forensic/endpoints/get",
      bindForensicEndpoint: "/sensor/analysis/forensic/endpoints/bind",
      reportForensicEndpointIdentity: "/sensor/analysis/forensic/endpoints/report-identity",
      listForensicArtifacts: "/sensor/analysis/forensic/artifacts/list",
      getForensicArtifactDefinition: "/sensor/analysis/forensic/artifacts/get",
      createForensicTask: "/sensor/analysis/forensic/tasks/create",
      createCollectFileTask: "/sensor/analysis/forensic/tasks/collect-file",
      getForensicTask: "/sensor/analysis/forensic/tasks/get",
      getForensicTaskFlowDetail: "/sensor/analysis/forensic/tasks/flow-detail",
      syncForensicTaskResult: "/sensor/analysis/forensic/tasks/sync-result",
      listForensicTasks: "/sensor/analysis/forensic/tasks/list",
      cancelForensicTask: "/sensor/analysis/forensic/tasks/cancel",
      deleteForensicTask: "/sensor/analysis/forensic/tasks/delete",
      downloadForensicTaskFlowZip: "/sensor/analysis/forensic/tasks/download-flow-zip",
      listForensicTaskEvents: "/sensor/analysis/forensic/task-events/list",
    },
  },
}

let runtimeConfigPromise = null

function trimTrailingSlash(value) {
  return value ? value.replace(/\/$/, "") : ""
}

function ensureLeadingSlash(value) {
  if (!value) return ""
  return value.startsWith("/") ? value : `/${value}`
}

function normalizeConfig(config) {
  const api = {
    ...FALLBACK_CONFIG.api,
    ...(config?.api || {}),
  }

  return {
    ...FALLBACK_CONFIG,
    ...config,
    api: {
      ...api,
      baseUrl: trimTrailingSlash(api.baseUrl),
      prefix: ensureLeadingSlash(api.prefix).replace(/\/$/, ""),
      endpoints: {
        ...FALLBACK_CONFIG.api.endpoints,
        ...(api.endpoints || {}),
      },
    },
  }
}

export function clearRuntimeConfigCache() {
  runtimeConfigPromise = null
}

export async function getRuntimeConfig() {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch("/config.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load config.json: ${response.status}`)
        }
        return response.json()
      })
      .then(normalizeConfig)
      .catch(() => normalizeConfig(FALLBACK_CONFIG))
  }

  return runtimeConfigPromise
}

export async function getApiConfig() {
  const config = await getRuntimeConfig()
  return config.api
}

export function joinUrl(...parts) {
  return parts
    .filter(Boolean)
    .map((part, index) => {
      const value = String(part)
      if (index === 0) return value.replace(/\/$/, "")
      return value.replace(/^\/+|\/+$/g, "")
    })
    .join("/")
}

export async function resolveApiUrl(pathOrEndpoint) {
  if (/^https?:\/\//i.test(pathOrEndpoint)) return pathOrEndpoint

  const api = await getApiConfig()
  const configuredPath = api.endpoints?.[pathOrEndpoint] || pathOrEndpoint
  const endpointPath = ensureLeadingSlash(configuredPath)

  return joinUrl(api.baseUrl, api.prefix, endpointPath)
}
