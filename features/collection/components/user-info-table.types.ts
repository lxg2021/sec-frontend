import type { UiAssetData, UserInfo, UserLogicGroup } from "@/features/collection/types"

export interface UserInfoTableProps {
  assets: UiAssetData[]
  userInfos: Record<string, UserInfo>
  errors: Record<string, Record<string, string>>
  userLogicGroups: UserLogicGroup[]
  isLoadingLogicGroups?: boolean
  isSaving?: boolean
  onUserInfoChange: (hostId: string, field: keyof UserInfo, value: string) => void
  onFieldBlur: (hostId: string, field: keyof UserInfo, value: string) => void
  onSave: () => void
}
