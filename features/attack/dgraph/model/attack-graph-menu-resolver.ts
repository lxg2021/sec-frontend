import { compactAttackGraphMenuGroups } from "./attack-graph-menu-config";
import type {
  AttackGraphMenuContext,
  AttackGraphMenuGroup,
  AttackGraphMenuProvider,
} from "./attack-graph-menu-types";

export async function resolveAttackGraphNodeMenu({
  context,
  providers,
}: {
  context: AttackGraphMenuContext;
  providers: AttackGraphMenuProvider[];
}): Promise<AttackGraphMenuGroup[]> {
  const providerResults = await Promise.all(
    providers.map(async (provider) => provider(context)),
  );

  return compactAttackGraphMenuGroups(providerResults.flat());
}

