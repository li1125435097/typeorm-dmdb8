import {Connection, Driver, EntityMetadata, SelectQueryBuilder} from "../..";
import {ViewOptions} from "../options/ViewOptions";

/**
 * View in the database represented in this class.
 */
export class View {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Database name that this view resides in if it applies.
     */
    database?: string;

    /**
     * Schema name that this view resides in if it applies.
     */
    schema?: string;

    /**
     * View name
     */
    name: string;


    /**
     * Indicates if view is materialized.
     */
    materialized: boolean;

    /**
     * View definition.
     */
    expression: string | ((connection: Connection) => SelectQueryBuilder<any>);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options?: ViewOptions) {
        if (options) {
            this.database = options.database;
            this.schema = options.schema;
            this.name = options.name;
            this.expression = options.expression;
            this.materialized = !!options.materialized;
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this table to a new table with all properties cloned.
     */
    clone(): View {
        return new View(<ViewOptions>{
            database: this.database,
            schema: this.schema,
            name: this.name,
            expression: this.expression,
            materialized: this.materialized,
        });
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates view from a given entity metadata.
     */
    static create(entityMetadata: EntityMetadata, driver: Driver): View {
        const options: ViewOptions = {
            database: entityMetadata.database,
            schema: entityMetadata.schema,
            name: driver.buildTableName(entityMetadata.tableName, entityMetadata.schema, entityMetadata.database),
            expression: entityMetadata.expression!,
            materialized: entityMetadata.tableMetadataArgs.materialized
        };

        return new View(options);
    }

}
