import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../query-runner/QueryRunner";
import {QueryExpressionMap} from "./QueryExpressionMap";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {UpdateResult} from "./result/UpdateResult";
import {InsertResult} from "./result/InsertResult";
import {OracleDriver} from "../driver/oracle/OracleDriver";
import {TypeORMError} from "../error";

/**
 * Updates entity with returning results in the entity insert and update operations.
 */
export class ReturningResultsEntityUpdator {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected queryRunner: QueryRunner,
                protected expressionMap: QueryExpressionMap) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Updates entities with a special columns after updation query execution.
     */
    async update(updateResult: UpdateResult, entities: ObjectLiteral[]): Promise<void> {
        const metadata = this.expressionMap.mainAlias!.metadata;

        await Promise.all(entities.map(async (entity, entityIndex) => {

            // if database supports returning/output statement then we already should have updating values in the raw data returned by insert query
            if (this.queryRunner.connection.driver.isReturningSqlSupported("update")) {
                if (this.queryRunner.connection.driver instanceof OracleDriver && Array.isArray(updateResult.raw) && this.expressionMap.extraReturningColumns.length > 0) {
                    updateResult.raw = updateResult.raw.reduce((newRaw, rawItem, rawItemIndex) => {
                        newRaw[this.expressionMap.extraReturningColumns[rawItemIndex].databaseName] = rawItem[0];
                        return newRaw;
                    }, {} as ObjectLiteral);
                }
                const result = Array.isArray(updateResult.raw) ? updateResult.raw[entityIndex] : updateResult.raw;
                const returningColumns = this.queryRunner.connection.driver.createGeneratedMap(metadata, result);
                if (returningColumns) {
                    this.queryRunner.manager.merge(metadata.target as any, entity, returningColumns);
                    updateResult.generatedMaps.push(returningColumns);
                }

            } else {

                // for driver which do not support returning/output statement we need to perform separate query and load what we need
                const updationColumns = this.expressionMap.extraReturningColumns;
                if (updationColumns.length > 0) {

                    // get entity id by which we will get needed data
                    const entityId = this.expressionMap.mainAlias!.metadata.getEntityIdMap(entity);
                    if (!entityId)
                        throw new TypeORMError(`Cannot update entity because entity id is not set in the entity.`);

                    // execute query to get needed data
                    const loadedReturningColumns = await this.queryRunner.manager
                        .createQueryBuilder()
                        .select(metadata.primaryColumns.map(column => metadata.targetName + "." + column.propertyPath))
                        .addSelect(updationColumns.map(column => metadata.targetName + "." + column.propertyPath))
                        .from(metadata.target, metadata.targetName)
                        .where(entityId)
                        .withDeleted()
                        .setOption("create-pojo") // use POJO because created object can contain default values, e.g. property = null and those properties maight be overridden by merge process
                        .getOne() as any;

                    if (loadedReturningColumns) {
                        this.queryRunner.manager.merge(metadata.target as any, entity, loadedReturningColumns);
                        updateResult.generatedMaps.push(loadedReturningColumns);
                    }
                }
            }
        }));
    }

    /**
     * Updates entities with a special columns after insertion query execution.
     */
    async insert(insertResult: InsertResult, entities: ObjectLiteral[]): Promise<void> {
        const metadata = this.expressionMap.mainAlias!.metadata;
        const insertionColumns = this.getInsertionReturningColumns();

        const generatedMaps = entities.map((entity, entityIndex) => {
            if (this.queryRunner.connection.driver instanceof OracleDriver && Array.isArray(insertResult.raw) && this.expressionMap.extraReturningColumns.length > 0) {
                insertResult.raw = insertResult.raw.reduce((newRaw, rawItem, rawItemIndex) => {
                    newRaw[this.expressionMap.extraReturningColumns[rawItemIndex].databaseName] = rawItem[0];
                    return newRaw;
                }, {} as ObjectLiteral);
            }
            // get all values generated by a database for us
            const result = Array.isArray(insertResult.raw) ? insertResult.raw[entityIndex] : insertResult.raw;

            const generatedMap = this.queryRunner.connection.driver.createGeneratedMap(metadata, result, entityIndex, entities.length) || {};

            if (entityIndex in this.expressionMap.locallyGenerated) {
                this.queryRunner.manager.merge(
                    metadata.target as any,
                    generatedMap,
                    this.expressionMap.locallyGenerated[entityIndex]
                );
            }

            this.queryRunner.manager.merge(
                metadata.target as any,
                entity,
                generatedMap
            );

            return generatedMap;
        });

        // for postgres and mssql we use returning/output statement to get values of inserted default and generated values
        // for other drivers we have to re-select this data from the database
        if (
            insertionColumns.length > 0 &&
            !this.queryRunner.connection.driver.isReturningSqlSupported("insert")
        ) {
            const entityIds = entities.map((entity) => {
                const entityId = metadata.getEntityIdMap(entity)!;

                // We have to check for an empty `entityId` - if we don't, the query against the database
                // effectively drops the `where` clause entirely and the first record will be returned -
                // not what we want at all.
                if (!entityId)
                    throw new TypeORMError(`Cannot update entity because entity id is not set in the entity.`);

                return entityId;
            });

            // to select just inserted entities we need a criteria to select by.
            // for newly inserted entities in drivers which do not support returning statement
            // row identifier can only be an increment column
            // (since its the only thing that can be generated by those databases)
            // or (and) other primary key which is defined by a user and inserted value has it

            const returningResult: any = await this.queryRunner.manager
                .createQueryBuilder()
                .select(metadata.primaryColumns.map(column => metadata.targetName + "." + column.propertyPath))
                .addSelect(insertionColumns.map(column => metadata.targetName + "." + column.propertyPath))
                .from(metadata.target, metadata.targetName)
                .where(entityIds)
                .setOption("create-pojo") // use POJO because created object can contain default values, e.g. property = null and those properties maight be overridden by merge process
                .getMany();

            entities.forEach((entity, entityIndex) => {
                this.queryRunner.manager.merge(
                    metadata.target as any,
                    generatedMaps[entityIndex],
                    returningResult[entityIndex]
                );

                this.queryRunner.manager.merge(
                    metadata.target as any,
                    entity,
                    returningResult[entityIndex]
                );
            });
        }

        entities.forEach((entity, entityIndex) => {
            const entityId = metadata.getEntityIdMap(entity)!;
            insertResult.identifiers.push(entityId);
            insertResult.generatedMaps.push(generatedMaps[entityIndex]);
        });
    }

    /**
     * Columns we need to be returned from the database when we insert entity.
     */
    getInsertionReturningColumns(): ColumnMetadata[] {

        // for databases which support returning statement we need to return extra columns like id
        // for other databases we don't need to return id column since its returned by a driver already
        const needToCheckGenerated = this.queryRunner.connection.driver.isReturningSqlSupported("insert");

        // filter out the columns of which we need database inserted values to update our entity
        return this.expressionMap.mainAlias!.metadata.columns.filter(column => {
            return  column.default !== undefined ||
                    (needToCheckGenerated && column.isGenerated)  ||
                    column.isCreateDate ||
                    column.isUpdateDate ||
                    column.isDeleteDate ||
                    column.isVersion;
        });
    }

    /**
     * Columns we need to be returned from the database when we update entity.
     */
    getUpdationReturningColumns(): ColumnMetadata[] {
        return this.expressionMap.mainAlias!.metadata.columns.filter(column => {
            return column.isUpdateDate || column.isVersion;
        });
    }

    /**
     * Columns we need to be returned from the database when we soft delete and restore entity.
     */
    getSoftDeletionReturningColumns(): ColumnMetadata[] {
        return this.expressionMap.mainAlias!.metadata.columns.filter(column => {
            return column.isUpdateDate || column.isVersion || column.isDeleteDate;
        });
    }

}
