import to2 from "./to-2"
import to3 from "./to-3"
import to4 from "./to-4"
import to5 from "./to-5"
import to6 from "./to-6"
import to7 from "./to-7"
import to8 from "./to-8"
import to9 from "./to-9"
import to10 from "./to-10"

/**
 * The version of persisted Redux state the extension is expecting. Any previous
 * state without this version, or with a lower version, ought to be migrated.
 */
export const REDUX_STATE_VERSION = 10

/**
 * Common type for all migration functions.
 */
type Migration = (prevState: Record<string, unknown>) => Record<string, unknown>

// An object mapping a version number to a state migration. Each migration for
// version n is expected to take a state consistent with version n-1, and return
// state consistent with version n.
const allMigrations: { [targetVersion: string]: Migration } = {
  2: to2,
  3: to3,
  4: to4,
  5: to5,
  6: to6,
  7: to7,
  8: to8,
  9: to9,
  10: to10,
}

/**
 * Migrate a previous version of the Redux state to that expected by the current
 * code base.
 */
export function migrateReduxState(
  previousState: Record<string, unknown>,
  previousVersion?: number
): Record<string, unknown> {
  const resolvedVersion = previousVersion ?? 1
  let migratedState: Record<string, unknown> = previousState

  if (resolvedVersion < REDUX_STATE_VERSION) {
    const outstandingMigrations = Object.entries(allMigrations)
      .sort()
      .filter(([version]) => parseInt(version, 10) > resolvedVersion)
      .map(([, migration]) => migration)
    migratedState = outstandingMigrations.reduce(
      (state: Record<string, unknown>, migration: Migration) => {
        return migration(state)
      },
      migratedState
    )
  }

  return migratedState
}

export default allMigrations
