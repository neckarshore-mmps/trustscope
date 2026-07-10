import { PRODUCT_NAME } from "@/config/product";

/**
 * The two-state UI descriptor for the per-pillar filing control — PURE.
 *
 * The button chrome (colour, label) is uniform; only the ICON and the HINT change with the
 * OAuth state. Kept out of the component so the branch (icon / hint / mode) is unit-tested for
 * both states, and the doctrine text ("as yourself", "never a bot", "via {PRODUCT_NAME}") lives
 * in one asserted place. Mirrors the report-display pure-engine pattern.
 */

export type IssueFilingMode = "direct" | "prefill";
export type IssueIconKind = "person" | "issue-dot";

export interface PillarIssueUi {
  /** "direct" = one-click POST as the user; "prefill" = open GitHub's pre-filled new-issue form. */
  mode: IssueFilingMode;
  iconKind: IssueIconKind;
  label: string;
  copyLabel: string;
  /** Hint paragraphs, revealed on tap (mobile-safe — never a hover tooltip). */
  hint: string[];
}

const COPY_HINT =
  "Copy issue copies the suggestion text so you can paste it into your own tracker, an email, or anywhere else.";

export function pillarIssueUi(oauthConfigured: boolean): PillarIssueUi {
  if (oauthConfigured) {
    return {
      mode: "direct",
      iconKind: "issue-dot",
      label: "File issue",
      copyLabel: "Copy issue",
      hint: [
        "File issue posts the suggestions to GitHub in one click, as yourself — your own " +
          "authorization, your name on it — then links you to the new issue. Direct, but never a silent bot.",
        COPY_HINT,
        `Every issue carries a visible “via ${PRODUCT_NAME}” line — real improvements trace back here.`,
      ],
    };
  }

  return {
    mode: "prefill",
    iconKind: "person",
    label: "File issue",
    copyLabel: "Copy issue",
    hint: [
      "File issue opens GitHub's own new-issue form, pre-filled — you review and submit it as " +
        "yourself. Your click, your login; nothing is posted automatically.",
      COPY_HINT,
      `Every issue carries a visible “via ${PRODUCT_NAME}” line — real improvements trace back here. Never a bot.`,
    ],
  };
}
