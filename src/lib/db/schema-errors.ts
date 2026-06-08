/** True when PostgREST reports a column missing from the schema cache. */
export function isMissingColumnError(error: { message?: string } | null, column: string): boolean {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  const col = column.toLowerCase();
  return (
    message.includes(col) &&
    (message.includes('does not exist') ||
      message.includes('could not find') ||
      message.includes('schema cache'))
  );
}

/** True when PostgREST reports a table/relation missing from the schema cache. */
export function isMissingRelationError(error: { message?: string } | null, relation: string): boolean {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  const table = relation.toLowerCase();
  return (
    message.includes(table) &&
    (message.includes('does not exist') ||
      message.includes('could not find') ||
      message.includes('schema cache') ||
      message.includes('relation'))
  );
}
