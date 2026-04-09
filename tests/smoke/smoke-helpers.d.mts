// Type declarations for tests/smoke/smoke-helpers.mjs.
//
// Kept as a separate .d.ts (rather than inline JSDoc + allowJs) so the
// existing tsconfig.json doesn't need to flip on `allowJs`, which would
// pull every repo-root .mjs/.js into the TypeScript compilation unit.
// The declarations here are the public API of the helpers and must stay
// in sync with smoke-helpers.mjs — a unit test in tests/unit/ exercises
// the runtime shape.

export interface TemplateStep {
  readonly label: string;
  readonly cmd: string;
  readonly args: readonly string[];
}

export interface TemplateDefinition {
  readonly steps: readonly TemplateStep[];
  readonly requiredFiles: readonly string[];
}

export type TemplateName = 'web' | 'mobile' | 'monolith';

export const TEMPLATES: Readonly<Record<TemplateName, TemplateDefinition>>;

export const ALL_TEMPLATE_NAMES: readonly TemplateName[];

export type TemplateResultStatus = 'pass' | 'fail';

export interface TemplateResult {
  readonly name: string;
  readonly status: TemplateResultStatus;
  readonly failedStep?: string;
  readonly durationMs: number;
}

export function parseTemplatesFlag(argv: readonly string[]): readonly TemplateName[];

export function formatSummaryLine(name: string, result: Omit<TemplateResult, 'name'>): string;

export function formatSummary(results: readonly TemplateResult[]): string;

export function computeExitCode(results: readonly Pick<TemplateResult, 'status'>[]): 0 | 1;
