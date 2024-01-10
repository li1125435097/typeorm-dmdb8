/**
 * Special options passed to Repository#upsert
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface UpsertOptions<Entity> {
    conflictPaths: string[]
    /**
     * If true, postgres will skip the update if no values would be changed (reduces writes)
     */
    skipUpdateIfNoValuesChanged?: boolean;
}
