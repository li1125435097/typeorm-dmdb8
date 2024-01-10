import {FindManyOptions} from "./FindManyOptions";
import {FindOneOptions} from "./FindOneOptions";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";
import {FindRelationsNotFoundError} from "../error/FindRelationsNotFoundError";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {DriverUtils} from "../driver/DriverUtils";
import { TypeORMError } from "../error";
import { FindTreeOptions } from "./FindTreeOptions";

/**
 * Utilities to work with FindOptions.
 */
export class FindOptionsUtils {

    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    static isFindOneOptions<Entity = any>(obj: any): obj is FindOneOptions<Entity> {
        const possibleOptions: FindOneOptions<Entity> = obj;
        return possibleOptions &&
            (
                Array.isArray(possibleOptions.select) ||
                possibleOptions.where instanceof Object ||
                typeof possibleOptions.where === "string" ||
                Array.isArray(possibleOptions.relations) ||
                possibleOptions.join instanceof Object ||
                possibleOptions.order instanceof Object ||
                possibleOptions.cache instanceof Object ||
                typeof possibleOptions.cache === "boolean" ||
                typeof possibleOptions.cache === "number" ||
                typeof possibleOptions.comment === "string" ||
                possibleOptions.lock instanceof Object ||
                possibleOptions.loadRelationIds instanceof Object ||
                typeof possibleOptions.loadRelationIds === "boolean" ||
                typeof possibleOptions.loadEagerRelations === "boolean" ||
                typeof possibleOptions.withDeleted === "boolean" ||
                typeof possibleOptions.transaction === "boolean"
            );
    }

    /**
     * Checks if given object is really instance of FindManyOptions interface.
     */
    static isFindManyOptions<Entity = any>(obj: any): obj is FindManyOptions<Entity> {
        const possibleOptions: FindManyOptions<Entity> = obj;
        return possibleOptions && (
            this.isFindOneOptions(possibleOptions) ||
            typeof (possibleOptions as FindManyOptions<any>).skip === "number" ||
            typeof (possibleOptions as FindManyOptions<any>).take === "number" ||
            typeof (possibleOptions as FindManyOptions<any>).skip === "string" ||
            typeof (possibleOptions as FindManyOptions<any>).take === "string"
        );
    }

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindManyOptionsAlias(object: any): string|undefined {
        if (this.isFindManyOptions(object) && object.join)
            return object.join.alias;

        return undefined;
    }

    /**
     * Applies give find many options to the given query builder.
     */
    static applyFindManyOptionsOrConditionsToQueryBuilder<T>(qb: SelectQueryBuilder<T>, options: FindManyOptions<T>|Partial<T>|undefined): SelectQueryBuilder<T> {
        if (this.isFindManyOptions(options))
            return this.applyOptionsToQueryBuilder(qb, options);

        if (options)
            return qb.where(options);

        return qb;
    }

    /**
     * Applies give find options to the given query builder.
     */
    static applyOptionsToQueryBuilder<T>(qb: SelectQueryBuilder<T>, options: FindOneOptions<T>|FindManyOptions<T>|undefined): SelectQueryBuilder<T> {

        // if options are not set then simply return query builder. This is made for simplicity of usage.
        if (!options || (!this.isFindOneOptions(options) && !this.isFindManyOptions(options)))
            return qb;

        if (options.transaction === true) {
            qb.expressionMap.useTransaction = true;
        }

        if (!qb.expressionMap.mainAlias || !qb.expressionMap.mainAlias.hasMetadata)
            return qb;

        const metadata = qb.expressionMap.mainAlias!.metadata;

        // apply all options from FindOptions
        if (options.comment) {
            qb.comment(options.comment);
        }

        if (options.withDeleted) {
            qb.withDeleted();
        }

        if (options.select) {
            qb.select([]);
            options.select.forEach(select => {
                if (!metadata.hasColumnWithPropertyPath(`${select}`))
                    throw new TypeORMError(`${select} column was not found in the ${metadata.name} entity.`);

                const columns = metadata.findColumnsWithPropertyPath(`${select}`);

                for (const column of columns) {
                    qb.addSelect(qb.alias + "." + column.propertyPath);
                }
            });
        }

        if (options.relations) {
            // Copy because `applyRelationsRecursively` modifies it
            const allRelations = [...options.relations];
            this.applyRelationsRecursively(qb, allRelations, qb.expressionMap.mainAlias!.name, qb.expressionMap.mainAlias!.metadata, "");
            // recursive removes found relations from allRelations array
            // if there are relations left in this array it means those relations were not found in the entity structure
            // so, we give an exception about not found relations
            if (allRelations.length > 0)
                throw new FindRelationsNotFoundError(allRelations);
        }

        if (options.join) {
            if (options.join.leftJoin)
                Object.keys(options.join.leftJoin).forEach(key => {
                    qb.leftJoin(options.join!.leftJoin![key], key);
                });

            if (options.join.innerJoin)
                Object.keys(options.join.innerJoin).forEach(key => {
                    qb.innerJoin(options.join!.innerJoin![key], key);
                });

            if (options.join.leftJoinAndSelect)
                Object.keys(options.join.leftJoinAndSelect).forEach(key => {
                    qb.leftJoinAndSelect(options.join!.leftJoinAndSelect![key], key);
                });

            if (options.join.innerJoinAndSelect)
                Object.keys(options.join.innerJoinAndSelect).forEach(key => {
                    qb.innerJoinAndSelect(options.join!.innerJoinAndSelect![key], key);
                });
        }

        if (options.cache) {
            if (options.cache instanceof Object) {
                const cache = options.cache as { id: any, milliseconds: number };
                qb.cache(cache.id, cache.milliseconds);
            } else {
                qb.cache(options.cache);
            }
        }

        if (options.lock) {
            if (options.lock.mode === "optimistic") {
                qb.setLock(options.lock.mode, options.lock.version);
            } else if (
                options.lock.mode === "pessimistic_read" ||
                options.lock.mode === "pessimistic_write" ||
                options.lock.mode === "dirty_read" ||
                options.lock.mode === "pessimistic_partial_write" ||
                options.lock.mode === "pessimistic_write_or_fail" ||
                options.lock.mode === "for_no_key_update"
            ) {
                const tableNames = options.lock.tables ? options.lock.tables.map((table) => {
                    const tableAlias = qb.expressionMap.aliases.find((alias) => {
                        return alias.metadata.tableNameWithoutPrefix === table;
                    });
                    if (!tableAlias) {
                        throw new TypeORMError(`"${table}" is not part of this query`);
                    }
                    return qb.escape(tableAlias.name);
                }) : undefined;
                qb.setLock(options.lock.mode, undefined, tableNames);
            }
        }

        if (options.loadRelationIds === true) {
            qb.loadAllRelationIds();

        } else if (options.loadRelationIds instanceof Object) {
            qb.loadAllRelationIds(options.loadRelationIds as any);
        }

        if (options.where)
            qb.where(options.where);

        if ((options as FindManyOptions<T>).skip)
            qb.skip((options as FindManyOptions<T>).skip!);

        if ((options as FindManyOptions<T>).take)
            qb.take((options as FindManyOptions<T>).take!);

        if (options.order)
            Object.keys(options.order).forEach(key => {
                const order = ((options as FindOneOptions<T>).order as any)[key as any];

                if (!metadata.findColumnWithPropertyPath(key))
                    throw new Error(`${key} column was not found in the ${metadata.name} entity.`);

                switch (order) {
                    case 1:
                        qb.addOrderBy(qb.alias + "." + key, "ASC");
                        break;
                    case -1:
                        qb.addOrderBy(qb.alias + "." + key, "DESC");
                        break;
                    case "ASC":
                        qb.addOrderBy(qb.alias + "." + key, "ASC");
                        break;
                    case "DESC":
                        qb.addOrderBy(qb.alias + "." + key, "DESC");
                        break;
                }
            });

        return qb;
    }

    static applyOptionsToTreeQueryBuilder<T>(qb: SelectQueryBuilder<T>, options?: FindTreeOptions): SelectQueryBuilder<T> {
        if (options?.relations) {
            // Copy because `applyRelationsRecursively` modifies it
            const allRelations = [...options.relations];

            FindOptionsUtils.applyRelationsRecursively(qb, allRelations, qb.expressionMap.mainAlias!.name, qb.expressionMap.mainAlias!.metadata, "");

            // recursive removes found relations from allRelations array
            // if there are relations left in this array it means those relations were not found in the entity structure
            // so, we give an exception about not found relations
            if (allRelations.length > 0)
                throw new FindRelationsNotFoundError(allRelations);
        }

        return qb;
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Adds joins for all relations and sub-relations of the given relations provided in the find options.
     */
    public static applyRelationsRecursively(qb: SelectQueryBuilder<any>, allRelations: string[], alias: string, metadata: EntityMetadata, prefix: string): void {

        // find all relations that match given prefix
        let matchedBaseRelations: string[] = [];
        if (prefix) {
            const regexp = new RegExp("^" + prefix.replace(".", "\\.") + "\\.");
            matchedBaseRelations = allRelations
                .filter(relation => relation.match(regexp))
                .map(relation => relation.replace(regexp, ""))
                .filter(relation => metadata.findRelationWithPropertyPath(relation));
        } else {
            matchedBaseRelations = allRelations.filter(relation => metadata.findRelationWithPropertyPath(relation));
        }

        // go through all matched relations and add join for them
        matchedBaseRelations.forEach(relation => {

            // generate a relation alias
            let relationAlias: string = DriverUtils.buildAlias(qb.connection.driver, { shorten: true, joiner: "__" }, alias, relation);

            // add a join for the found relation
            const selection = alias + "." + relation;
            qb.leftJoinAndSelect(selection, relationAlias);

            // remove added relations from the allRelations array, this is needed to find all not found relations at the end
            allRelations.splice(allRelations.indexOf(prefix ? prefix + "." + relation : relation), 1);

            // try to find sub-relations
            const join = qb.expressionMap.joinAttributes.find(join => join.entityOrProperty === selection);
            this.applyRelationsRecursively(qb, allRelations, join!.alias.name, join!.metadata!, prefix ? prefix + "." + relation : relation);

            // join the eager relations of the found relation
            const relMetadata = metadata.relations.find(metadata => metadata.propertyName === relation);
            if (relMetadata) {
                this.joinEagerRelations(qb, relationAlias, relMetadata.inverseEntityMetadata);
            }
        });
    }

    public static joinEagerRelations(qb: SelectQueryBuilder<any>, alias: string, metadata: EntityMetadata) {
        metadata.eagerRelations.forEach(relation => {

            // generate a relation alias
            let relationAlias = DriverUtils.buildAlias(qb.connection.driver, { shorten: true }, qb.connection.namingStrategy.eagerJoinRelationAlias(alias, relation.propertyPath));

            // add a join for the relation
            // Checking whether the relation wasn't joined yet.
            let addJoin = true;
            for (const join of qb.expressionMap.joinAttributes) {
                if (
                    join.condition !== undefined ||
                    join.mapToProperty !== undefined ||
                    join.isMappingMany !== undefined ||
                    join.direction !== "LEFT" ||
                    join.entityOrProperty !== `${alias}.${relation.propertyPath}`
                ) {
                    continue;
                }
                addJoin = false;
                relationAlias = join.alias.name;
                break;
            }

            if (addJoin) {
                qb.leftJoin(alias + "." + relation.propertyPath, relationAlias);
            }

            // Checking whether the relation wasn't selected yet.
            // This check shall be after the join check to detect relationAlias.
            let addSelect = true;
            for (const select of qb.expressionMap.selects) {
                if (select.aliasName !== undefined || select.virtual !== undefined || select.selection !== relationAlias) {
                    continue;
                }
                addSelect = false;
                break;
            }

            if (addSelect) {
                qb.addSelect(relationAlias);
            }

            // (recursive) join the eager relations
            this.joinEagerRelations(qb, relationAlias, relation.inverseEntityMetadata);
        });
    }

}
