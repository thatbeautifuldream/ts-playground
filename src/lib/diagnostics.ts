export type CodeDiagnostic = {
  from: number;
  to: number;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
};
