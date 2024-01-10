import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";
import {DmdbConnectionCredentialsOptions} from "./DmdbConnectionCredentialsOptions";

/**
 * Oracle-specific connection options.
 */
export interface DmdbConnectionOptions extends BaseConnectionOptions, DmdbConnectionCredentialsOptions {

    /**
     * Database type.
     */
    readonly type: "dmdb";

    /**
     * Schema name. By default is "public".
     */
    readonly schema?: string;

    /**
     * The driver object
     * This defaults to require("oracledb")
     */
    readonly driver?: any;

    /**
    * A boolean determining whether to pass time values in UTC or local time. (default: true).
    */
    readonly useUTC?: boolean;

    /**
     * Replication setup.
     */
    readonly replication?: {

        /**
         * Master server used by orm to perform writes.
         */
        readonly master: DmdbConnectionCredentialsOptions;

        /**
         * List of read-from severs (slaves).
         */
        readonly slaves: DmdbConnectionCredentialsOptions[];

    };

}