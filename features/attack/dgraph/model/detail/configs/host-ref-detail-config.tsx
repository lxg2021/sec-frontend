import { Badge } from "@/shared/ui/badge";

import type { AttackGraphDetailCardConfig } from "../attack-graph-detail-config-types";

export const HOST_REF_DETAIL_CONFIG: AttackGraphDetailCardConfig = {
  header: {
    icon: "Server",
    iconTone: "blue",
    title: {
      key: "server_name",
      fallback: "Remote Host",
      formatValue: formatHostRefTitle,
    },
    badges: [
      {
        key: "server_name",
        customRender: (value) =>
          value ? (
            <Badge
              variant="outline"
              className="border-orange-100 bg-orange-50 text-orange-700 hover:bg-orange-50"
            >
              remote
            </Badge>
          ) : null,
      },
    ],
  },
  sections: [
    {
      title: "Host Reference",
      icon: "Server",
      tone: "blue",
      columns: 1,
      fields: [
        {
          key: "server_name",
          label: "Server Name",
          icon: "Server",
          iconTone: "blue",
          valueTone: "blue",
          mono: true,
          copyable: true,
        },
      ],
    },
  ],
};

function formatHostRefTitle(value: string) {
  return value.trim().replace(/^\\\\/, "") || "";
}
