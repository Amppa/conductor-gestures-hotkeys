let sequence = 0;

/**
 * Creates a stable, collision-resistant identifier for a newly created entity.
 * The sequence keeps IDs unique when several entities are created in one tick.
 */
export function createId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence.toString(36)}`;
}
