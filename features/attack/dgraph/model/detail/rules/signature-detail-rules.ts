import type { AttackGraphDetailData } from "../attack-graph-detail-config-types";
import type { AttackGraphPresentationTone } from "../attack-graph-detail-types";

export function isSignedSignature(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "signed" || normalized === "true";
}

export function formatSignature(value: string) {
  return isSignedSignature(value) ? "signed" : "unsigned";
}

export function resolveSignatureTone(
  value: string,
): AttackGraphPresentationTone | undefined {
  return isSignedSignature(value) ? undefined : "orange";
}

export function resolveSignatureRelatedTone(
  _value: string,
  data: AttackGraphDetailData,
): AttackGraphPresentationTone | undefined {
  return isSignedSignature(data.signature) ? undefined : "orange";
}
