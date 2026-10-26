export type ConsoleValue = { preview: string; children?: { key: string; value: ConsoleValue }[] };

// Snapshot values when logged; bound depth and size, and never invoke getters.
export function snapshot(value: unknown, seen = new WeakSet<object>(), depth = 0): ConsoleValue {
  if (typeof value === "string") return { preview: value };
  if (typeof value === "bigint") return { preview: `${value}n` };
  if (value === null || typeof value !== "object") return { preview: String(value) };
  if (value instanceof Error) return { preview: value.stack || value.message };
  if (seen.has(value)) return { preview: "[Circular]" };
  seen.add(value);
  try {
    if (value instanceof Date) return { preview: value.toISOString() };
    if (value instanceof RegExp) return { preview: String(value) };
    const isArray = Array.isArray(value);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).filter(key => descriptors[key].enumerable);
    const preview = isArray ? `Array(${value.length})` : value instanceof Map ? `Map(${value.size})` : value instanceof Set ? `Set(${value.size})` : "Object";
    if (depth >= 4) return { preview: `${preview} […]` };
    const entries: [string, unknown][] = value instanceof Map ? [...value.entries()].slice(0, 50).map(([key, item]) => [String(key), item]) : value instanceof Set ? [...value].slice(0, 50).map((item, i) => [String(i), item]) : keys.slice(0, 50).map(key => [key, "value" in descriptors[key] ? descriptors[key].value : "[Getter]"]);
    const children = entries.map(([key, item]) => ({ key, value: snapshot(item, seen, depth + 1) }));
    if (keys.length > 50) children.push({ key: "…", value: { preview: `${keys.length - 50} more properties` } });
    return { preview, children };
  } catch { return { preview: "[Uninspectable value]" }; }
}

export function formatSnapshot(value: ConsoleValue, depth = 0): string {
  if (!value.children) return value.preview;
  const array = value.preview.startsWith("Array(");
  const indent = "  ".repeat(depth + 1);
  const lines = value.children.map(entry => `${indent}${array ? "" : `${JSON.stringify(entry.key)}: `}${formatSnapshot(entry.value, depth + 1)}`);
  return `${array ? "[" : "{"}${lines.length ? `\n${lines.join(",\n")}\n${"  ".repeat(depth)}` : ""}${array ? "]" : "}"}`;
}
