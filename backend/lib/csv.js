/**
 * CSV helpers. Cells starting with a formula character are prefixed with an
 * apostrophe so spreadsheets do not execute them (CSV injection).
 */
export function csvCell(value) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Rows of values to a CSV string with a UTF-8 BOM so Excel opens accents correctly. */
export function toCsv(rows) {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
