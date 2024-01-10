## [0.2.45](https://github.com/typeorm/typeorm/compare/0.2.44...0.2.45) (2022-03-04)

### Bug Fixes

* allow clearing database inside a transaction ([#8712](https://github.com/typeorm/typeorm/issues/8712)) ([f3cfdd2](https://github.com/typeorm/typeorm/commit/f3cfdd264105ba8cf1c92832b4b95e5a3ca0ed09)), closes [#8527](https://github.com/typeorm/typeorm/issues/8527)
* discard duplicated columns on update ([#8724](https://github.com/typeorm/typeorm/issues/8724)) ([0fc093d](https://github.com/typeorm/typeorm/commit/0fc093d168b54a0fd99bb411a730aad9be1858ac)), closes [#8723](https://github.com/typeorm/typeorm/issues/8723)
* fix entityManager.getId for custom join table ([#8676](https://github.com/typeorm/typeorm/issues/8676)) ([33b2bd7](https://github.com/typeorm/typeorm/commit/33b2bd7acc55d6eb30bfe0681748d6b6abaff0b5)), closes [#7736](https://github.com/typeorm/typeorm/issues/7736)
* force web bundlers to ignore index.mjs and use the browser ESM version directly ([#8710](https://github.com/typeorm/typeorm/issues/8710)) ([411fa54](https://github.com/typeorm/typeorm/commit/411fa54368c8940e94b1cbf7ab64b8d5377f9406)), closes [#8709](https://github.com/typeorm/typeorm/issues/8709)

### Features

* add nested transaction ([#8541](https://github.com/typeorm/typeorm/issues/8541)) ([6523526](https://github.com/typeorm/typeorm/commit/6523526003bab74a0df8f7d578790c1728b26057)), closes [#1505](https://github.com/typeorm/typeorm/issues/1505)
* add transformer to ViewColumnOptions ([#8717](https://github.com/typeorm/typeorm/issues/8717)) ([96ac8f7](https://github.com/typeorm/typeorm/commit/96ac8f7eece06ae0a8b52ae7da740c92c0c0d4b9))


## [0.2.44](https://github.com/typeorm/typeorm/compare/0.2.43...0.2.44) (2022-02-23)

### Bug Fixes

* alter relation loader to use transforms when present ([#8691](https://github.com/typeorm/typeorm/issues/8691)) ([2c2fb29](https://github.com/typeorm/typeorm/commit/2c2fb29a67bfd0ca7dd9133a2f85f5b4db5fb195)), closes [#8690](https://github.com/typeorm/typeorm/issues/8690)
* cannot read properties of undefined (reading 'joinEagerRelations') ([136015b](https://github.com/typeorm/typeorm/commit/136015b04ee72b0ca2439fbff53b1467c12c24b6))
* expo driver doesn't work properly because of new beforeMigration() afterMigration() callbacks ([#8683](https://github.com/typeorm/typeorm/issues/8683)) ([5a71803](https://github.com/typeorm/typeorm/commit/5a7180378e34ab58ad40c504ebc5195e2413c5f4))
* ng webpack default import ([#8688](https://github.com/typeorm/typeorm/issues/8688)) ([2d3374b](https://github.com/typeorm/typeorm/commit/2d3374b3b4cb8163764c035bd687b2c81787f338)), closes [#8674](https://github.com/typeorm/typeorm/issues/8674)
* support imports of absolute paths of ESM files on Windows ([#8669](https://github.com/typeorm/typeorm/issues/8669)) ([12cbfcd](https://github.com/typeorm/typeorm/commit/12cbfcde7bc4f56069ed3298064bb91ad0816bf0)), closes [#8651](https://github.com/typeorm/typeorm/issues/8651)

### Features

* add option to upsert to skip update if the row already exists and no values would be changed  ([#8679](https://github.com/typeorm/typeorm/issues/8679)) ([8744395](https://github.com/typeorm/typeorm/commit/87443954b59768ab77fb15097ea9d88822b4a733))
* allow `{delete,insert}().returning()` on MariaDB ([#8673](https://github.com/typeorm/typeorm/issues/8673)) ([7facbab](https://github.com/typeorm/typeorm/commit/7facbabd2663098156a53983ea38433ed39082d2)), closes [#7235](https://github.com/typeorm/typeorm/issues/7235) [#7235](https://github.com/typeorm/typeorm/issues/7235)
* Implement deferrable foreign keys for SAP HANA ([#6104](https://github.com/typeorm/typeorm/issues/6104)) ([1f54c70](https://github.com/typeorm/typeorm/commit/1f54c70b76de34d4420904b72137df746ea9aaed))

## [0.2.43](https://github.com/typeorm/typeorm/compare/0.2.42...0.2.43) (2022-02-17)

### Bug Fixes

* support `require` to internal files without explicitly writing `.js` in the path ([#8660](https://github.com/typeorm/typeorm/issues/8660)) ([96aed8a](https://github.com/typeorm/typeorm/commit/96aed8aae06df0ae555aa51ed9f1a5ffec141e61)), closes [#8656](https://github.com/typeorm/typeorm/issues/8656)

### Features

* embedded entities with entity schema ([#8626](https://github.com/typeorm/typeorm/issues/8626)) ([7dbe956](https://github.com/typeorm/typeorm/commit/7dbe956c56da3a430ae6f0e99730e9449deae889)), closes [#3632](https://github.com/typeorm/typeorm/issues/3632)

### Reverts

* Revert "feat: soft delete recursive cascade (#8436)" (#8654) ([6b0b15b](https://github.com/typeorm/typeorm/commit/6b0b15b0e68584ed7cd81a658d8606cfdb96817c)), closes [#8436](https://github.com/typeorm/typeorm/issues/8436) [#8654](https://github.com/typeorm/typeorm/issues/8654)

## [0.2.42](https://github.com/typeorm/typeorm/compare/0.2.41...0.2.42) (2022-02-16)

### Bug Fixes

* proper column comment mapping from database to metadata in aurora-data-api ([baa5880](https://github.com/typeorm/typeorm/commit/baa5880001064333eb4eb01765b1d79e17cf1fb5))
* add referencedSchema to PostgresQueryRunner ([#8566](https://github.com/typeorm/typeorm/issues/8566)) ([c490319](https://github.com/typeorm/typeorm/commit/c49031929aca8f3b932c6593b75447256085bfef))
* adding/removing @Generated() will now generate a migration to add/remove the DEFAULT value ([#8274](https://github.com/typeorm/typeorm/issues/8274)) ([4208393](https://github.com/typeorm/typeorm/commit/42083936e2b65f0d1bd8e23d12689a7f49e2da2f)), closes [#5898](https://github.com/typeorm/typeorm/issues/5898)
* adds entity-schema support for createForeignKeyConstraints ([#8606](https://github.com/typeorm/typeorm/issues/8606)) ([f224f24](https://github.com/typeorm/typeorm/commit/f224f24e5247d3c42385bfc03c89f518aa932310)), closes [#8489](https://github.com/typeorm/typeorm/issues/8489)
* allow special keyword as column name for simple-enum type on sqlite ([#8645](https://github.com/typeorm/typeorm/issues/8645)) ([93bf96e](https://github.com/typeorm/typeorm/commit/93bf96ea635823c7933ea8ef7326be62ccdd6ea7))
* correctly handle multiple-row insert for SAP HANA driver ([#7957](https://github.com/typeorm/typeorm/issues/7957)) ([8f2ae71](https://github.com/typeorm/typeorm/commit/8f2ae71201e7738fe3c1efd5bbc4584dfe62dcc0))
* disable SQLite FK checks in synchronize / migrations ([#7922](https://github.com/typeorm/typeorm/issues/7922)) ([f24822e](https://github.com/typeorm/typeorm/commit/f24822ef9cb3051fbe9f3fd5d9e669788852c5a5))
* find descendants of a non-existing tree parent ([#8557](https://github.com/typeorm/typeorm/issues/8557)) ([cbb61eb](https://github.com/typeorm/typeorm/commit/cbb61eb08139204479110c88d7d1849a24080d11)), closes [#8556](https://github.com/typeorm/typeorm/issues/8556)
* For MS SQL Server use lowercase "sys"."columns" reference. ([#8400](https://github.com/typeorm/typeorm/issues/8400)) ([#8401](https://github.com/typeorm/typeorm/issues/8401)) ([e8a0f92](https://github.com/typeorm/typeorm/commit/e8a0f921b4baa7aa7e55ac1fd34c449dfa1e3229))
* improve DeepPartial type ([#8187](https://github.com/typeorm/typeorm/issues/8187)) ([b93416d](https://github.com/typeorm/typeorm/commit/b93416d7bc25006b34a90c14c497cc7e6e57e28c))
* Lock peer dependencies versions ([#8597](https://github.com/typeorm/typeorm/issues/8597)) ([600bd4e](https://github.com/typeorm/typeorm/commit/600bd4e5da74b012409d1fdf411a0a0b5265466b))
* make EntityMetadataValidator comply with entitySkipConstructor, cover with test ([#8445](https://github.com/typeorm/typeorm/issues/8445)) ([3d6c5da](https://github.com/typeorm/typeorm/commit/3d6c5dae76ad0e0640650058ae58fe0addda2ae6)), closes [#8444](https://github.com/typeorm/typeorm/issues/8444)
* materialized path being computed as "undefined1." ([#8526](https://github.com/typeorm/typeorm/issues/8526)) ([09f54e0](https://github.com/typeorm/typeorm/commit/09f54e0273be4dc836824a38e9c78b50ad21bba6))
* MongoConnectionOptions sslCA type mismatch ([#8628](https://github.com/typeorm/typeorm/issues/8628)) ([02400da](https://github.com/typeorm/typeorm/commit/02400dab662aceca9a722c4aa0dd74a9fa2cb90d))
* mongodb repository.find filters soft deleted rows ([#8581](https://github.com/typeorm/typeorm/issues/8581)) ([f7c1f7d](https://github.com/typeorm/typeorm/commit/f7c1f7d7c0481f4ada506e5b811a3219519eadf9)), closes [#7113](https://github.com/typeorm/typeorm/issues/7113)
* mongodb@4 compatibility support ([#8412](https://github.com/typeorm/typeorm/issues/8412)) ([531013b](https://github.com/typeorm/typeorm/commit/531013b2f8dfb8d04b0bfb844dc83a5ba6404569))
* must invoke key pragma before any other interaction if SEE setted ([#8478](https://github.com/typeorm/typeorm/issues/8478)) ([546b3ed](https://github.com/typeorm/typeorm/commit/546b3ed8886c44fbe3d9e167d1904cb9e5961df7)), closes [#8475](https://github.com/typeorm/typeorm/issues/8475)
* nested eager relations in a lazy-loaded entity are not loaded ([#8564](https://github.com/typeorm/typeorm/issues/8564)) ([1cfd7b9](https://github.com/typeorm/typeorm/commit/1cfd7b98ba27032dd0e9429a245c40cea47900f7))
* QueryFailedError when tree entity with JoinColumn ([#8443](https://github.com/typeorm/typeorm/issues/8443)) ([#8447](https://github.com/typeorm/typeorm/issues/8447)) ([a11c50d](https://github.com/typeorm/typeorm/commit/a11c50d5519bda1410ab9ccf67bfcb12ef109c61))
* relation id and afterAll hook performance fixes ([#8169](https://github.com/typeorm/typeorm/issues/8169)) ([31f0b55](https://github.com/typeorm/typeorm/commit/31f0b5535aa0cc49ff23610b1924c03432f5461f))
* replaced custom uuid generator with `uuid` library ([#8642](https://github.com/typeorm/typeorm/issues/8642)) ([8898a71](https://github.com/typeorm/typeorm/commit/8898a7175f481f1c171acefef61dc089bc3f8a8e))
* single table inheritance returns the same discriminator value error for unrelated tables where their parents extend from the same entity  ([#8525](https://github.com/typeorm/typeorm/issues/8525)) ([6523fcc](https://github.com/typeorm/typeorm/commit/6523fccda1147dc697afbba57792e5cb4165fbf2)), closes [#8522](https://github.com/typeorm/typeorm/issues/8522)
* updating with only `update: false` columns shouldn't trigger @UpdateDateColumn column updation ([2834729](https://github.com/typeorm/typeorm/commit/2834729e80577bd30f09c2c0e4c949cde173bba3)), closes [#8394](https://github.com/typeorm/typeorm/issues/8394) [#8394](https://github.com/typeorm/typeorm/issues/8394) [#8394](https://github.com/typeorm/typeorm/issues/8394)
* upsert should find unique index created by one-to-one relation ([#8618](https://github.com/typeorm/typeorm/issues/8618)) ([c8c00ba](https://github.com/typeorm/typeorm/commit/c8c00baf9351973be5780687418303dd87de2077))

### Features

* add comment param to FindOptions ([#8545](https://github.com/typeorm/typeorm/issues/8545)) ([ece0da0](https://github.com/typeorm/typeorm/commit/ece0da027dfce4357764dda4b810598ad64af9d9))
* add custom timestamp option in migration creation ([#8501](https://github.com/typeorm/typeorm/issues/8501)) ([4a7f242](https://github.com/typeorm/typeorm/commit/4a7f2420f1b498465b2a5913b7d848b3eaafb113)), closes [#8500](https://github.com/typeorm/typeorm/issues/8500) [#8500](https://github.com/typeorm/typeorm/issues/8500)
* add support for node-redis v4.0.0 and newer ([#8425](https://github.com/typeorm/typeorm/issues/8425)) ([0626ed1](https://github.com/typeorm/typeorm/commit/0626ed1f0bd75fb8e72a462593f33813d85faee8))
* add support for Postgres 10+ GENERATED ALWAYS AS IDENTITY ([#8371](https://github.com/typeorm/typeorm/issues/8371)) ([a0f09de](https://github.com/typeorm/typeorm/commit/a0f09de8400ac7c94df33f8213ef0eec79b9239d)), closes [#8370](https://github.com/typeorm/typeorm/issues/8370)
* add WITH (lock) clause for MSSQL select with join queries ([#8507](https://github.com/typeorm/typeorm/issues/8507)) ([3284808](https://github.com/typeorm/typeorm/commit/3284808b63552d81456752187c0d130db76007ed)), closes [#4764](https://github.com/typeorm/typeorm/issues/4764)
* adds entity-schema support for withoutRowid ([#8432](https://github.com/typeorm/typeorm/issues/8432)) ([bd22dc3](https://github.com/typeorm/typeorm/commit/bd22dc3b8175ef82967b8265a2388ce16cc08623)), closes [#8429](https://github.com/typeorm/typeorm/issues/8429)
* allow soft-deletion of orphaned relation rows using orphanedRow… ([#8414](https://github.com/typeorm/typeorm/issues/8414)) ([cefddd9](https://github.com/typeorm/typeorm/commit/cefddd95c550191d6a18cb53c8ea4995d0c219ca))
* custom name for typeorm_metadata table ([#8528](https://github.com/typeorm/typeorm/issues/8528)) ([f8154eb](https://github.com/typeorm/typeorm/commit/f8154eb4c5089a1a0d2c2073f0ea5d64b3252e08)), closes [#7266](https://github.com/typeorm/typeorm/issues/7266)
* deferrable option for Unique constraints (Postgres) ([#8356](https://github.com/typeorm/typeorm/issues/8356)) ([e52b26c](https://github.com/typeorm/typeorm/commit/e52b26c910047d22aa3ea003b62d11c2bf352249))
* ESM support ([#8536](https://github.com/typeorm/typeorm/issues/8536)) ([3a694dd](https://github.com/typeorm/typeorm/commit/3a694dd3e99699e7284709c53967a5dfcb1e1806)), closes [#6974](https://github.com/typeorm/typeorm/issues/6974) [#6941](https://github.com/typeorm/typeorm/issues/6941) [#7516](https://github.com/typeorm/typeorm/issues/7516) [#7159](https://github.com/typeorm/typeorm/issues/7159)
* query builder negating with "NotBrackets" for complex expressions ([#8476](https://github.com/typeorm/typeorm/issues/8476)) ([fe7f328](https://github.com/typeorm/typeorm/commit/fe7f328fd5b918cab2e7301d57c62e81d9ff34f3))
* separate update events into update, soft-remove, and recover ([#8403](https://github.com/typeorm/typeorm/issues/8403)) ([93383bd](https://github.com/typeorm/typeorm/commit/93383bd2ee6dc8c22a5cfc0021334fe199da81dc)), closes [#8398](https://github.com/typeorm/typeorm/issues/8398)
* soft delete recursive cascade ([#8436](https://github.com/typeorm/typeorm/issues/8436)) ([d0f32b3](https://github.com/typeorm/typeorm/commit/d0f32b3a17be9ffe9fbc6112e5731bbac91c3691))
* sqlite attach ([#8396](https://github.com/typeorm/typeorm/issues/8396)) ([9e844d9](https://github.com/typeorm/typeorm/commit/9e844d9ff72fae72578399e24464cd7912c0fe5e))

### Reverts

* migration:show command must exist with zero status code (Fixes [#7349](https://github.com/typeorm/typeorm/issues/7349)) ([#8185](https://github.com/typeorm/typeorm/issues/8185)) ([e0adeee](https://github.com/typeorm/typeorm/commit/e0adeee48eeb0d5412aa5c0258f7c12e6b1c38ed))

### BREAKING CHANGES

* update listeners and subscriber no longer triggered by soft-remove and recover

## [0.2.41](https://github.com/typeorm/typeorm/compare/0.2.40...0.2.41) (2021-11-18)

### Bug Fixes

* add `retryWrites` to `MongoConnectionOptions` ([#8354](https://github.com/typeorm/typeorm/issues/8354)) ([c895680](https://github.com/typeorm/typeorm/commit/c895680dce35f0550f48d92d7dd1a5fb48ab4135)), closes [#7869](https://github.com/typeorm/typeorm/issues/7869)
* create typeorm_metadata table when running migrations ([#4956](https://github.com/typeorm/typeorm/issues/4956)) ([b2c8168](https://github.com/typeorm/typeorm/commit/b2c8168514b23671080e6d384e381e997fbaa11e))
* db caching won't work with replication enabled ([#7694](https://github.com/typeorm/typeorm/issues/7694)) ([2d0abe7](https://github.com/typeorm/typeorm/commit/2d0abe7140a0aec40d50c15acd98633483db3e29)), closes [#5919](https://github.com/typeorm/typeorm/issues/5919)
* incorrect composite `UNIQUE` constraints detection ([#8364](https://github.com/typeorm/typeorm/issues/8364)) ([29cb891](https://github.com/typeorm/typeorm/commit/29cb89123aaf705437927a8c6ed23204422b71cc)), closes [#8158](https://github.com/typeorm/typeorm/issues/8158)
* Postgres enum generates unnecessary queries on schema sync ([#8268](https://github.com/typeorm/typeorm/issues/8268)) ([98d5f39](https://github.com/typeorm/typeorm/commit/98d5f39e35b6e5dd77ae2aa60f80f4ac98249379))
* resolve issue delete column null on after update event subscriber ([#8318](https://github.com/typeorm/typeorm/issues/8318)) ([8a5e671](https://github.com/typeorm/typeorm/commit/8a5e6715e2d32da22c2fa71a14a7cf1fe897a159)), closes [#6327](https://github.com/typeorm/typeorm/issues/6327)

### Features

* export interfaces from schema-builder/options ([#8383](https://github.com/typeorm/typeorm/issues/8383)) ([7b8a1e3](https://github.com/typeorm/typeorm/commit/7b8a1e38f269ba329a153135e12e1a21274b3a18))
* implement generated columns for postgres 12 driver ([#6469](https://github.com/typeorm/typeorm/issues/6469)) ([91080be](https://github.com/typeorm/typeorm/commit/91080be0cd35a5ee9467d4b50b6b7fb5421ac800))
* lock modes in cockroachdb ([#8250](https://github.com/typeorm/typeorm/issues/8250)) ([d494fcc](https://github.com/typeorm/typeorm/commit/d494fccc9c6a2d773bcb411ba746a74539373eff)), closes [#8249](https://github.com/typeorm/typeorm/issues/8249)


## [0.2.40](https://github.com/typeorm/typeorm/compare/0.2.39...0.2.40) (2021-11-11)

### Bug Fixes

* BaseEntity finder methods to properly type-check lazy relations conditions ([#5710](https://github.com/typeorm/typeorm/issues/5710)) ([0665ff5](https://github.com/typeorm/typeorm/commit/0665ff5473d075e442f3a93f665bbe087bdf29de))

### Features

* add depth limiter optional parameter when loading nested trees using TreeRepository's findTrees() and findDescendantsTree() ([#7926](https://github.com/typeorm/typeorm/issues/7926)) ([0c44629](https://github.com/typeorm/typeorm/commit/0c44629c83c48c27448e7e3cb39faf26994e6e56)), closes [#3909](https://github.com/typeorm/typeorm/issues/3909)
* add upsert methods for the drivers that support onUpdate ([#8104](https://github.com/typeorm/typeorm/issues/8104)) ([3f98197](https://github.com/typeorm/typeorm/commit/3f981975d4347483937547feaa8fa4f63b81a83c)), closes [#2363](https://github.com/typeorm/typeorm/issues/2363)
* Postgres IDENTITY Column support ([#7741](https://github.com/typeorm/typeorm/issues/7741)) ([969af95](https://github.com/typeorm/typeorm/commit/969af958ba27282b9594140a7e2d58dba1192830))

### Reverts

* "feat: use char(36) for uuid representation in mysql ([#7853](https://github.com/typeorm/typeorm/issues/7853))" ([#8343](https://github.com/typeorm/typeorm/issues/8343)) ([1588c58](https://github.com/typeorm/typeorm/commit/1588c58539e5121dad6b7120f0b5f83f43f1532f))
* regression in ordering by the relation property ([#8346](https://github.com/typeorm/typeorm/issues/8346)) ([#8352](https://github.com/typeorm/typeorm/issues/8352)) ([0334d10](https://github.com/typeorm/typeorm/commit/0334d104d9ce93c8cb079449ce98ffbdc64219c2)), closes [#3736](https://github.com/typeorm/typeorm/issues/3736) [#8118](https://github.com/typeorm/typeorm/issues/8118)

## [0.2.39](https://github.com/typeorm/typeorm/compare/0.2.38...0.2.39) (2021-11-09)

### Bug Fixes

* attach FOR NO KEY UPDATE lock to query if required ([#8008](https://github.com/typeorm/typeorm/issues/8008)) ([9692930](https://github.com/typeorm/typeorm/commit/96929302a4dc27a19e94c5532a3ae76951e52552)), closes [#7717](https://github.com/typeorm/typeorm/issues/7717)
* cli should accept absolute paths for --config ([4ad3a61](https://github.com/typeorm/typeorm/commit/4ad3a61037ad9ead998665d2857d6e4725d7b718))
* create a different cacheId if present for count query in getManyAndCount ([#8283](https://github.com/typeorm/typeorm/issues/8283)) ([9f14e48](https://github.com/typeorm/typeorm/commit/9f14e488281fb08d8ea1a95c6cc363e1234fa307)), closes [#4277](https://github.com/typeorm/typeorm/issues/4277)
* defaults type cast filtering in Cockroachdb ([#8144](https://github.com/typeorm/typeorm/issues/8144)) ([28c183e](https://github.com/typeorm/typeorm/commit/28c183e9df562e2eb1e3c93afbd1d4687b1b0846)), closes [#7110](https://github.com/typeorm/typeorm/issues/7110) [#7110](https://github.com/typeorm/typeorm/issues/7110)
* do not generate migration for unchanged enum column ([#8161](https://github.com/typeorm/typeorm/issues/8161)) ([#8164](https://github.com/typeorm/typeorm/issues/8164)) ([4638dea](https://github.com/typeorm/typeorm/commit/4638dea55d0e9239a62fb3143cd96988bf07bc68))
* NativescriptQueryRunner's query method fails when targeting es2017 ([#8182](https://github.com/typeorm/typeorm/issues/8182)) ([8615733](https://github.com/typeorm/typeorm/commit/861573377bb33b73232399c21b1b3a5c07b58036))
* OneToManySubjectBuilder bug with multiple primary keys ([#8221](https://github.com/typeorm/typeorm/issues/8221)) ([6558295](https://github.com/typeorm/typeorm/commit/655829592ee10aaa5d28a96691ada0d5510899ea))
* ordering by joined columns for PostgreSQL ([#3736](https://github.com/typeorm/typeorm/issues/3736)) ([#8118](https://github.com/typeorm/typeorm/issues/8118)) ([1649882](https://github.com/typeorm/typeorm/commit/1649882d335587ac78d2203db3a7ab492a942374))
* support DeleteResult in SQLiteDriver ([#8237](https://github.com/typeorm/typeorm/issues/8237)) ([b678807](https://github.com/typeorm/typeorm/commit/b6788072c20b5f235df9272625c3d1d7522d27e0))

### Features

* add `typeorm` command wrapper to package.json in project template ([#8081](https://github.com/typeorm/typeorm/issues/8081)) ([19d4a91](https://github.com/typeorm/typeorm/commit/19d4a914a5da2c28f1eb4ed1c28a52db7dc809d0))
* add dependency configuraiton for views [#8240](https://github.com/typeorm/typeorm/issues/8240) ([#8261](https://github.com/typeorm/typeorm/issues/8261)) ([2c861af](https://github.com/typeorm/typeorm/commit/2c861afaef839f33b5cf1cc2b3bcf8b6e4a0be4f))
* add relation options to all tree queries ([#8080](https://github.com/typeorm/typeorm/issues/8080)) ([e4d4636](https://github.com/typeorm/typeorm/commit/e4d46363917db57a9107048b973b6a12be8d61fd)), closes [#8076](https://github.com/typeorm/typeorm/issues/8076)
* add the ability to pass the driver into all database types ([#8259](https://github.com/typeorm/typeorm/issues/8259)) ([2133ffe](https://github.com/typeorm/typeorm/commit/2133ffea9c678841bf3537838777d9a5fec3a00e))
* more informative logging in case of migration failure ([#8307](https://github.com/typeorm/typeorm/issues/8307)) ([dc6f1c9](https://github.com/typeorm/typeorm/commit/dc6f1c91be29e88466614eb8b8d21a92659cfd0b))
* support using custom index with SelectQueryBuilder in MySQL ([#7755](https://github.com/typeorm/typeorm/issues/7755)) ([f79ae58](https://github.com/typeorm/typeorm/commit/f79ae589cd1a658fea553cb57abc2a41a46523f8))

### Reverts

* Revert "fix: STI types on children in joins (#3160)" (#8309) ([0adad88](https://github.com/typeorm/typeorm/commit/0adad8810e15b8d00259a2635e1c50e85598e1ed)), closes [#3160](https://github.com/typeorm/typeorm/issues/3160) [#8309](https://github.com/typeorm/typeorm/issues/8309)

## [0.2.38](https://github.com/typeorm/typeorm/compare/0.2.37...0.2.38) (2021-10-02)

### Bug Fixes

* prevent using absolute table path in migrations unless required ([#8038](https://github.com/typeorm/typeorm/issues/8038)) ([e9366b3](https://github.com/typeorm/typeorm/commit/e9366b33ddff296de1254019589b85e40aa53e12))
* snakecase conversion for strings with numbers ([#8111](https://github.com/typeorm/typeorm/issues/8111)) ([749511d](https://github.com/typeorm/typeorm/commit/749511d981f6b9a1a08113b23e8779a91cda78f8))
* use full path for table lookups ([#8097](https://github.com/typeorm/typeorm/issues/8097)) ([22676a0](https://github.com/typeorm/typeorm/commit/22676a04c30b3b49a61003320dfad3ecad3791e8))

### Features

* support QueryRunner.stream with Oracle ([#8086](https://github.com/typeorm/typeorm/issues/8086)) ([b858f84](https://github.com/typeorm/typeorm/commit/b858f84e6fb15f801f2564088428d250d1c59e18))

## [0.2.37](https://github.com/typeorm/typeorm/compare/0.2.36...0.2.37) (2021-08-13)

### Bug Fixes

* allow periods in parameter identifiers ([#8022](https://github.com/typeorm/typeorm/issues/8022)) ([4201938](https://github.com/typeorm/typeorm/commit/420193892ffe857c532130c0c7b18dcc4c8d38e2))
* ConnectionManager `connections` property should include list of `Connection`s ([#8004](https://github.com/typeorm/typeorm/issues/8004)) ([2344db6](https://github.com/typeorm/typeorm/commit/2344db60c4314da31885f5686e94bb6dcb203a96))
* entity value for date columns that are related ([#8027](https://github.com/typeorm/typeorm/issues/8027)) ([5a3767f](https://github.com/typeorm/typeorm/commit/5a3767f58f6ef355b01cf6e92342401a051a369c))
* handle brackets when only one condition is passed ([#8048](https://github.com/typeorm/typeorm/issues/8048)) ([ab39066](https://github.com/typeorm/typeorm/commit/ab39066f182d357fcc999cd976510c0e2a61d6de))
* handle enums with multiple apostrophes in MySQL ([#8013](https://github.com/typeorm/typeorm/issues/8013)) ([37c40a6](https://github.com/typeorm/typeorm/commit/37c40a610caecfc3b27b48a87b0e98d715f23395)), closes [#8011](https://github.com/typeorm/typeorm/issues/8011)
* include all drivers in driverfactory error message ([#8061](https://github.com/typeorm/typeorm/issues/8061)) ([fbd1ef7](https://github.com/typeorm/typeorm/commit/fbd1ef74e84b59ef0b8d99e311f0aced902190e6))
* resolve not returning soft deleted relations with withDeleted find option ([#8017](https://github.com/typeorm/typeorm/issues/8017)) ([65cbcc7](https://github.com/typeorm/typeorm/commit/65cbcc79bceac4cf8d15dec8c558dcbc9a037220))
* SAP HANA inserts used incorrect value for returning query ([#8072](https://github.com/typeorm/typeorm/issues/8072)) ([36398db](https://github.com/typeorm/typeorm/commit/36398dbe467274a9ac08a013ed4daaf307ee2de2))
* some drivers set the wrong database name when defined from url ([#8058](https://github.com/typeorm/typeorm/issues/8058)) ([a3a3284](https://github.com/typeorm/typeorm/commit/a3a32849c04a83adbf775fcf07843a934551dbfb))
* throw error when not connected in drivers ([#7995](https://github.com/typeorm/typeorm/issues/7995)) ([cd71f62](https://github.com/typeorm/typeorm/commit/cd71f62cb8125d1bbd92b341aa2eea1de0ac3537))

### Features

* add relations option to tree queries ([#7981](https://github.com/typeorm/typeorm/issues/7981)) ([ca26297](https://github.com/typeorm/typeorm/commit/ca26297484542498b8f622f540ca354360d53ed0)), closes [#7974](https://github.com/typeorm/typeorm/issues/7974) [#4564](https://github.com/typeorm/typeorm/issues/4564)
* add serviceName option for oracle connections ([#8021](https://github.com/typeorm/typeorm/issues/8021)) ([37bd012](https://github.com/typeorm/typeorm/commit/37bd0124dc81c957b2a036436594ae8c4606eb6c))
* add support to string array on dropColumns ([#7654](https://github.com/typeorm/typeorm/issues/7654)) ([91d5b2f](https://github.com/typeorm/typeorm/commit/91d5b2fc374c2f7b1545d40ee76577272de21436))
* support Oracle Implicit Results ([#8050](https://github.com/typeorm/typeorm/issues/8050)) ([fe78bee](https://github.com/typeorm/typeorm/commit/fe78bee3725efef47d5be6f924b9caf13f3299a7))

## [0.2.36](https://github.com/typeorm/typeorm/compare/0.2.35...0.2.36) (2021-07-31)

### Bug Fixes

* add deprecated `WhereExpression` alias for `WhereExpressionBuilder` ([#7980](https://github.com/typeorm/typeorm/issues/7980)) ([76e7ed9](https://github.com/typeorm/typeorm/commit/76e7ed943779b940212c4e453d97028b5ffed7d0))
* always generate migrations with template string literals ([#7971](https://github.com/typeorm/typeorm/issues/7971)) ([e9c2af6](https://github.com/typeorm/typeorm/commit/e9c2af610a1c9a632605b71d67b97e048be2e29e))
* use js rather than ts in all `browser` package manifests ([#7982](https://github.com/typeorm/typeorm/issues/7982)) ([0d90bcd](https://github.com/typeorm/typeorm/commit/0d90bcdc8c77f2080aa200fe9f4f962b7b01c9ee))
* use nvarchar/ntext during transit for SQLServer queries ([#7933](https://github.com/typeorm/typeorm/issues/7933)) ([62d7976](https://github.com/typeorm/typeorm/commit/62d79762dbfe58219a5673ba4d404fe9f2e40436))

### Features

* add postgres connection option `applicationName` ([#7989](https://github.com/typeorm/typeorm/issues/7989)) ([d365acc](https://github.com/typeorm/typeorm/commit/d365acca68069d0bd9acea5b45a73d7f4c1f4d8f))

## [0.2.35](https://github.com/typeorm/typeorm/compare/0.2.34...0.2.35) (2021-07-28)

### Bug Fixes

* `entity` to be `Partial<Entity>` | `undefined` in `UpdateEvent` ([#7783](https://github.com/typeorm/typeorm/issues/7783)) ([f033045](https://github.com/typeorm/typeorm/commit/f033045dd6d1dac4f6f7e528997a2c5f8892d763))
* actually return a working ReadStream from SQL Server query runner ([#7893](https://github.com/typeorm/typeorm/issues/7893)) ([e80985f](https://github.com/typeorm/typeorm/commit/e80985fabbafcb4f5409d72840c3902e1619b8a6))
* added version check before dropping materialized views to keep backward compatibility ([#7716](https://github.com/typeorm/typeorm/issues/7716)) ([29f1f86](https://github.com/typeorm/typeorm/commit/29f1f86ae2a2dafd70fd958b1980b9f059f42f7a))
* allow for string id in mongo.findByIds call ([#7838](https://github.com/typeorm/typeorm/issues/7838)) ([4b45ae1](https://github.com/typeorm/typeorm/commit/4b45ae1e8174cf438f9fca92c635957513bff8f8))
* better support of relation-based properties in where clauses ([#7805](https://github.com/typeorm/typeorm/issues/7805)) ([3221c50](https://github.com/typeorm/typeorm/commit/3221c50d878505b1b8435b07451ec94cd8d04fce))
* Buffer in primary columns causes bugs with relations ([#7952](https://github.com/typeorm/typeorm/issues/7952)) ([37e08a7](https://github.com/typeorm/typeorm/commit/37e08a7848a92cd4f98fec8f33f120cee739352f)), closes [#4060](https://github.com/typeorm/typeorm/issues/4060)
* capacitor does not correctly set journal mode ([#7873](https://github.com/typeorm/typeorm/issues/7873)) ([5f20eb7](https://github.com/typeorm/typeorm/commit/5f20eb791a3c51410d6759548ec11c9a919659ff))
* Capacitor driver PRAGMA requests failing on Android ([#7728](https://github.com/typeorm/typeorm/issues/7728)) ([9620a26](https://github.com/typeorm/typeorm/commit/9620a26c4eeb34baddce3a841ffd686d82cd87af))
* condition is optional in SelectQueryBuilder joins ([#7888](https://github.com/typeorm/typeorm/issues/7888)) ([2deaa0e](https://github.com/typeorm/typeorm/commit/2deaa0e948d7b797c0e4d3ccbc3c9c2f0f253caf))
* correctly handle mongo replica set driver option ([#7908](https://github.com/typeorm/typeorm/issues/7908)) ([9212df4](https://github.com/typeorm/typeorm/commit/9212df45e3899370efdf9ec67f1a6418ce4ac838))
* correctly load yml in ConnectionOptionsYmlReader ([#7743](https://github.com/typeorm/typeorm/issues/7743)) ([57f9254](https://github.com/typeorm/typeorm/commit/57f9254499ef07500f5e59df20e778ee0f27b9aa))
* craft oracle connectString as a descriptor with SID ([#7878](https://github.com/typeorm/typeorm/issues/7878)) ([b05d093](https://github.com/typeorm/typeorm/commit/b05d0936ddabae179a42c9c0f67779a6bec3d5b1))
* delete operation in MongoDB impact all matched documents ([#7811](https://github.com/typeorm/typeorm/issues/7811)) ([0fbae53](https://github.com/typeorm/typeorm/commit/0fbae53bdd83f5da94ac8a468e1506c2852eed02)), closes [#7809](https://github.com/typeorm/typeorm/issues/7809)
* Do not add NULL/NOT NULL for stored columns ([#7708](https://github.com/typeorm/typeorm/issues/7708)) ([3c33e9f](https://github.com/typeorm/typeorm/commit/3c33e9f54541a12b0d0fd37177c6afebf7a5349f)), closes [#7698](https://github.com/typeorm/typeorm/issues/7698)
* do OBJECT_ID lookup for column constraint instead of name in mssql ([#7916](https://github.com/typeorm/typeorm/issues/7916)) ([fa8c1b0](https://github.com/typeorm/typeorm/commit/fa8c1b088a9a6a2a1ffaec1b1a681be99cf2db3c))
* drop pool.autostart from mssql options because it's unused ([#7877](https://github.com/typeorm/typeorm/issues/7877)) ([0d21a4d](https://github.com/typeorm/typeorm/commit/0d21a4d07ec275a295df6f78b85c4814c027258a))
* drop SAP statement after `prepare` per Hana client docs ([#7748](https://github.com/typeorm/typeorm/issues/7748)) ([8ca05b1](https://github.com/typeorm/typeorm/commit/8ca05b11db3ba083c7395cca09a4aa98c70e3d8f))
* eager relation respects children relations ([#5685](https://github.com/typeorm/typeorm/issues/5685)) ([e7e887a](https://github.com/typeorm/typeorm/commit/e7e887a582cce66bd21044472f4a5288894650c9))
* enable returning additional columns with MSSQL ([#7864](https://github.com/typeorm/typeorm/issues/7864)) ([e1db48d](https://github.com/typeorm/typeorm/commit/e1db48d8391728455744c91ea7976a334300f77d))
* entity object undefined in `afterUpdate` subscriber ([#7724](https://github.com/typeorm/typeorm/issues/7724)) ([d25304d](https://github.com/typeorm/typeorm/commit/d25304d9e319157c6b8999932fb9144a67bd84cf))
* find operation in MongoDB do not include nullable values from documents ([#7820](https://github.com/typeorm/typeorm/issues/7820)) ([98c13cf](https://github.com/typeorm/typeorm/commit/98c13cf710de83783bc5b5576a64327b26d26262)), closes [#7760](https://github.com/typeorm/typeorm/issues/7760)
* fix table loading when schemas are used ([3a106a3](https://github.com/typeorm/typeorm/commit/3a106a3cca223dadca58af1244c6dda79c60b43c))
* foreign keys in SAP were loading from the wrong table ([#7914](https://github.com/typeorm/typeorm/issues/7914)) ([4777a79](https://github.com/typeorm/typeorm/commit/4777a795210c3a93a4171a17dbdce248e25b21da))
* handle postgres default when tableColumn.default is not string ([#7816](https://github.com/typeorm/typeorm/issues/7816)) ([0463855](https://github.com/typeorm/typeorm/commit/0463855223100028e62f7cb2e84319770f54449e))
* handle snake case of ABcD which should become a_bc_d ([#7883](https://github.com/typeorm/typeorm/issues/7883)) ([eb680f9](https://github.com/typeorm/typeorm/commit/eb680f99b74c335556d23016264fcf1ea6ce1d6f))
* improve query for MSSQL to fetch foreign keys and tables ([#7935](https://github.com/typeorm/typeorm/issues/7935)) ([f6af01a](https://github.com/typeorm/typeorm/commit/f6af01ad1b20ce67dc03448f050de3127227758c))
* make `OracleQueryRunner` createDatabase if-not-exists not fail ([f5a80ef](https://github.com/typeorm/typeorm/commit/f5a80ef3df82120fee8f68e02f320dacbc856607))
* only pass `data` from SaveOptions during that query ([#7886](https://github.com/typeorm/typeorm/issues/7886)) ([1de2e13](https://github.com/typeorm/typeorm/commit/1de2e13cfe442af99c2cf017f48127e1de3a08d9))
* oracle cannot support DB in table identifiers ([#7954](https://github.com/typeorm/typeorm/issues/7954)) ([8c60d91](https://github.com/typeorm/typeorm/commit/8c60d917ef5fbfdc11b7c3ad8e2901eba3f9fa4b))
* pass table to namingstrategy when we can instead of table name ([#7925](https://github.com/typeorm/typeorm/issues/7925)) ([140002d](https://github.com/typeorm/typeorm/commit/140002d1ebc4837071dab83a7bb164a02a7a2732))
* prevent modification of the FindOptions.relations ([#7887](https://github.com/typeorm/typeorm/issues/7887)) ([a2fcad6](https://github.com/typeorm/typeorm/commit/a2fcad6ef963c3e444765d6a7b4fa1e0e89a72e6))
* prevent reuse of broken connections in postgres pool ([#7792](https://github.com/typeorm/typeorm/issues/7792)) ([5cf368a](https://github.com/typeorm/typeorm/commit/5cf368a23fa78b9e97dd12b54616f17b8431ffee))
* prevent transactions in the Cordova driver ([#7771](https://github.com/typeorm/typeorm/issues/7771)) ([fc4133c](https://github.com/typeorm/typeorm/commit/fc4133cf621874c616bf7643c79112b9f68a1e09))
* properly escape oracle table paths ([#7917](https://github.com/typeorm/typeorm/issues/7917)) ([7e8687c](https://github.com/typeorm/typeorm/commit/7e8687c45283cdb2caffa53ed5ebab527797c3e8))
* regression when making `join` conditions `undefined`-able ([#7892](https://github.com/typeorm/typeorm/issues/7892)) ([b0c1cc6](https://github.com/typeorm/typeorm/commit/b0c1cc6d6820e93bc7b986d4f18db4020195e170))
* restored `buildColumnAlias` for backward compatibility ([#7706](https://github.com/typeorm/typeorm/issues/7706)) ([36ceefa](https://github.com/typeorm/typeorm/commit/36ceefa710c0994e054c8e267a1fb1bdf4b25c39))
* return correct DeleteResult and UpdateResult for mongo ([#7884](https://github.com/typeorm/typeorm/issues/7884)) ([7a646a2](https://github.com/typeorm/typeorm/commit/7a646a212815e6b9c2dda752442075624f9f552d))
* support fully qualified schema in createSchema ([#7934](https://github.com/typeorm/typeorm/issues/7934)) ([94edd12](https://github.com/typeorm/typeorm/commit/94edd12ca450d4dbcd2e4902e1009fcd27136490))
* support table names between schemas in oracle ([#7951](https://github.com/typeorm/typeorm/issues/7951)) ([aa45b93](https://github.com/typeorm/typeorm/commit/aa45b935ff33915a86199307c86aabf904d67e28))
* typing so SelectQueryBuilder.getRawOne may return undefined ([#7863](https://github.com/typeorm/typeorm/issues/7863)) ([36e5a0c](https://github.com/typeorm/typeorm/commit/36e5a0cf09a25dfe98ffa130f35005a8eacc4155)), closes [#7449](https://github.com/typeorm/typeorm/issues/7449)
* typo prevented us from pulling the schema correctly in some cases ([c7f2db8](https://github.com/typeorm/typeorm/commit/c7f2db8d6999b990308787681a2767e41ad2bdd6))
* update operation in MongoDB impact all matched documents ([#7803](https://github.com/typeorm/typeorm/issues/7803)) ([052014c](https://github.com/typeorm/typeorm/commit/052014cdba844b1a7867f46606045a494cffc907)), closes [#7788](https://github.com/typeorm/typeorm/issues/7788)
* use correct query for cross-database mssql identity check ([#7911](https://github.com/typeorm/typeorm/issues/7911)) ([7869fb1](https://github.com/typeorm/typeorm/commit/7869fb143c2b3ec019507a79e80eb2e29c270338))
* use fully qualified and escaped table names for oracle ([#7857](https://github.com/typeorm/typeorm/issues/7857)) ([2b90725](https://github.com/typeorm/typeorm/commit/2b90725a080c7ea9140464a68c8c8c9475fd73f9)), closes [#7779](https://github.com/typeorm/typeorm/issues/7779)
* use ObjectLiteral in UpdateEvent rather than `Entity` ([#7910](https://github.com/typeorm/typeorm/issues/7910)) ([78fbc14](https://github.com/typeorm/typeorm/commit/78fbc14b3ee915ce035cb1546c92142eab6a899e))
* use only table name in constraint naming strategy ([5dc777f](https://github.com/typeorm/typeorm/commit/5dc777f17ec238c3f3303aa9379fe855727220b1))


### Features

* add `retryWrites` to allowed mongo `extra` options ([#7869](https://github.com/typeorm/typeorm/issues/7869)) ([dcdaaca](https://github.com/typeorm/typeorm/commit/dcdaacacaf122c7579d31a700e93c5357a9e0a16))
* add capacitor driver options for encryption & version ([#7868](https://github.com/typeorm/typeorm/issues/7868)) ([a2bd94b](https://github.com/typeorm/typeorm/commit/a2bd94b146738a2aa637f52011c1fd5e92ed38e1))
* add connection option `entitySkipConstructor` ([f43d561](https://github.com/typeorm/typeorm/commit/f43d56110fd41c23d80e32021adf4ade7648ce97))
* add ObjectLiteral typing to andWhere / orWhere ([#7786](https://github.com/typeorm/typeorm/issues/7786)) ([525381d](https://github.com/typeorm/typeorm/commit/525381d91e15d1d9b9dd7bd36beaac35646ee3b0))
* add parseTableName to Driver interface ([#7956](https://github.com/typeorm/typeorm/issues/7956)) ([cffbf43](https://github.com/typeorm/typeorm/commit/cffbf43b291e59a45c5b8e3685a1d1153dfeaeb1))
* add path, database, and schema to Table ([#7913](https://github.com/typeorm/typeorm/issues/7913)) ([444e38b](https://github.com/typeorm/typeorm/commit/444e38bffd7f3ff962282d01bf980a554a94b3fa))
* add property for database and schema in views ([#7953](https://github.com/typeorm/typeorm/issues/7953)) ([4c5bbd9](https://github.com/typeorm/typeorm/commit/4c5bbd9e1c92219712efaff061d6501c473193dd))
* add referenced database & schema to TableForeignKey ([fff6b11](https://github.com/typeorm/typeorm/commit/fff6b11cd3c369f9f95c99decba84213847e76e3))
* add writeConcern option as a possible `extras` for mongodb ([#7801](https://github.com/typeorm/typeorm/issues/7801)) ([90894c7](https://github.com/typeorm/typeorm/commit/90894c7fd39c5237ddb26690082ca4c2443b2fd4))
* consistent parsing and escaping of table names in QueryRunners ([bd9e767](https://github.com/typeorm/typeorm/commit/bd9e767ffaafe9381630787fa860d0904b8d3e49))
* implement OracleQueryRunner.hasDatabase ([128b982](https://github.com/typeorm/typeorm/commit/128b9825f2b9fd81c4ee5ba36e554ef86eb64865))
* make parameter to getTables optional ([#7901](https://github.com/typeorm/typeorm/issues/7901)) ([ba86602](https://github.com/typeorm/typeorm/commit/ba866026ec7d0ce44f68f9b585bc094c82e32dcd))
* make postgres extensions install optional ([#7725](https://github.com/typeorm/typeorm/issues/7725)) ([92b96a5](https://github.com/typeorm/typeorm/commit/92b96a550512bb218e1c6691e2f5908007d0b6e6)), closes [#7662](https://github.com/typeorm/typeorm/issues/7662)
* publicly export `Transaction*Event` types ([#7949](https://github.com/typeorm/typeorm/issues/7949)) ([2436a66](https://github.com/typeorm/typeorm/commit/2436a66b499c81e1d2394b19f3b158258f31d899)), closes [/github.com/typeorm/typeorm/blob/master/src/subscriber/EntitySubscriberInterface.ts#L12](https://github.com//github.com/typeorm/typeorm/blob/master/src/subscriber/EntitySubscriberInterface.ts/issues/L12)
* set `enableArithAbort` for SQLServerDriver ([#7894](https://github.com/typeorm/typeorm/issues/7894)) ([1f64da2](https://github.com/typeorm/typeorm/commit/1f64da2c49b21b678a0f2faf0805dbeb763b0f4a))
* support absolute path in migration:generate ([#7720](https://github.com/typeorm/typeorm/issues/7720)) ([b690c27](https://github.com/typeorm/typeorm/commit/b690c270cd2e9886329e520cab5ee31eaeae77a4))
* use char(36) for uuid representation in mysql ([#7853](https://github.com/typeorm/typeorm/issues/7853)) ([063aafa](https://github.com/typeorm/typeorm/commit/063aafa34408dd9b1ed3802bb43be6f772523277))
* use column length from driver when creating columns ([#7858](https://github.com/typeorm/typeorm/issues/7858)) ([b107ad9](https://github.com/typeorm/typeorm/commit/b107ad95164627b6e959b4e476eb82f3dded972c))

## [0.2.34](https://github.com/typeorm/typeorm/compare/0.2.33...0.2.34) (2021-06-03)

### Bug Fixes

* restored `buildColumnAlias` for backward compatibility ([#7706](https://github.com/typeorm/typeorm/issues/7706)) ([36ceefa](https://github.com/typeorm/typeorm/commit/36ceefa710c0994e054c8e267a1fb1bdf4b25c39))

## [0.2.33](https://github.com/typeorm/typeorm/compare/0.2.32...0.2.33) (2021-06-01)

### Bug Fixes

* @Unique constraint is not created with specified name ([beea2e1](https://github.com/typeorm/typeorm/commit/beea2e1e4429d13d7864ebc23aa6e58fa01647ea))
* `MATERIALIZED VIEW` is treated as a regular `VIEW` which causes issues on sync ([#7592](https://github.com/typeorm/typeorm/issues/7592)) ([f85f436](https://github.com/typeorm/typeorm/commit/f85f436f51fb000cd9959b44e8d7a79bf0cd10ab))
* added error handler for slave connections in MySQL and AuroraDataApi drivers ([#7641](https://github.com/typeorm/typeorm/issues/7641)) ([882a740](https://github.com/typeorm/typeorm/commit/882a7409e5bd018fad6c04925ff5ccaa7e9e7db2))
* call listeners for array embeddeds in MongoDB ([#4260](https://github.com/typeorm/typeorm/issues/4260)) ([2dc355b](https://github.com/typeorm/typeorm/commit/2dc355b50179a18fe690924797f5c69f2fe23c1f))
* closing pool incorrectly works on Postgres ([#7596](https://github.com/typeorm/typeorm/issues/7596)) ([1310c97](https://github.com/typeorm/typeorm/commit/1310c97ff3092b9ff23b2fe83d6b7763beb4316b)), closes [#6958](https://github.com/typeorm/typeorm/issues/6958) [#6958](https://github.com/typeorm/typeorm/issues/6958) [#6958](https://github.com/typeorm/typeorm/issues/6958)
* column name with empty spaces causes bug in Index/Unique decorators [#7534](https://github.com/typeorm/typeorm/issues/7534) ([a3a6e06](https://github.com/typeorm/typeorm/commit/a3a6e063a37fbe1444ffd0c8b1d93bf3ea90e75d))
* correctly strip type conversion in postgres for default values ([#7681](https://github.com/typeorm/typeorm/issues/7681)) ([069b8b6](https://github.com/typeorm/typeorm/commit/069b8b6888c389d93ff44ca6ed964fb5913d9840)), closes [#1532](https://github.com/typeorm/typeorm/issues/1532) [#7647](https://github.com/typeorm/typeorm/issues/7647) [#5132](https://github.com/typeorm/typeorm/issues/5132)
* datetime functions in column "default" leads to unnecessary queries during synchronization ([#7517](https://github.com/typeorm/typeorm/issues/7517)) ([03f3285](https://github.com/typeorm/typeorm/commit/03f328583750ed08272fc1a640adcd13e82f09af)), closes [#3991](https://github.com/typeorm/typeorm/issues/3991) [#3991](https://github.com/typeorm/typeorm/issues/3991) [#2737](https://github.com/typeorm/typeorm/issues/2737) [#2737](https://github.com/typeorm/typeorm/issues/2737) [#6412](https://github.com/typeorm/typeorm/issues/6412) [#4281](https://github.com/typeorm/typeorm/issues/4281) [#4658](https://github.com/typeorm/typeorm/issues/4658) [#3991](https://github.com/typeorm/typeorm/issues/3991) [#2333](https://github.com/typeorm/typeorm/issues/2333) [#7381](https://github.com/typeorm/typeorm/issues/7381) [#4658](https://github.com/typeorm/typeorm/issues/4658) [#3991](https://github.com/typeorm/typeorm/issues/3991) [#3991](https://github.com/typeorm/typeorm/issues/3991) [#3991](https://github.com/typeorm/typeorm/issues/3991) [#3991](https://github.com/typeorm/typeorm/issues/3991)
* default `schema` defined in entity/connection leads to unnecessary queries during schema sync ([#7575](https://github.com/typeorm/typeorm/issues/7575)) ([7eb0327](https://github.com/typeorm/typeorm/commit/7eb032705912cbf4ee340ed9e49970d0f6e23714)), closes [#7276](https://github.com/typeorm/typeorm/issues/7276) [#7276](https://github.com/typeorm/typeorm/issues/7276)
* do a deep comparison to see if the default value has changed for `json` types in Postgres ([#7650](https://github.com/typeorm/typeorm/issues/7650)) ([a471c1b](https://github.com/typeorm/typeorm/commit/a471c1b689848e7cd9203dcef5edd192019ea456))
* Incorrect migration generated when multiple views are updated in a single migration ([#7587](https://github.com/typeorm/typeorm/issues/7587)) ([0b103dd](https://github.com/typeorm/typeorm/commit/0b103dd0347737c91510c7ed4719a289dacf8d3b)), closes [#7586](https://github.com/typeorm/typeorm/issues/7586)
* issues with custom enum name in Postgres ([#7661](https://github.com/typeorm/typeorm/issues/7661)) ([ad0262a](https://github.com/typeorm/typeorm/commit/ad0262a116e5366b562e70a1bbc60246add78d83)), closes [#7614](https://github.com/typeorm/typeorm/issues/7614) [#7541](https://github.com/typeorm/typeorm/issues/7541) [#7647](https://github.com/typeorm/typeorm/issues/7647) [#6540](https://github.com/typeorm/typeorm/issues/6540)
* mongodb connectionURL parse options ([#7560](https://github.com/typeorm/typeorm/issues/7560)) ([b2ac41a](https://github.com/typeorm/typeorm/commit/b2ac41a706635aba37b204eaf7ebf52aaee91104))
* mongodb typings for Cursor ([#7526](https://github.com/typeorm/typeorm/issues/7526)) ([daf3991](https://github.com/typeorm/typeorm/commit/daf399171996d578f0607dd0631647bed59ff212))
* only first \0 is removed in comments, only first \\ is escaped etc. ([#7532](https://github.com/typeorm/typeorm/issues/7532)) ([36b14cb](https://github.com/typeorm/typeorm/commit/36b14cbd808d73c61c9308d66291cf06e860419a))
* pass `ManyToMany` `onUpdate` option to foreign key metadata ([#5714](https://github.com/typeorm/typeorm/issues/5714)) ([198d2c5](https://github.com/typeorm/typeorm/commit/198d2c50acab9d0d748194506970415866247da4)), closes [#4980](https://github.com/typeorm/typeorm/issues/4980)
* Postgres identifier exceeds limit on eager relations ([#7508](https://github.com/typeorm/typeorm/issues/7508)) ([#7509](https://github.com/typeorm/typeorm/issues/7509)) ([e4ec429](https://github.com/typeorm/typeorm/commit/e4ec429fe518c26f4c95175a482bde143d508254))
* remove `enableExtension` for slave connections in Postgres ([#7693](https://github.com/typeorm/typeorm/issues/7693)) ([620aac9](https://github.com/typeorm/typeorm/commit/620aac9e0f2c089f78c7a055b2fb844a475a7eb5)), closes [#7691](https://github.com/typeorm/typeorm/issues/7691)
* replaced deprecated `insert` method with `insertOne` for MongoDriver in MigrationExecutor. ([#7594](https://github.com/typeorm/typeorm/issues/7594)) ([83fed60](https://github.com/typeorm/typeorm/commit/83fed60cccc498d1c5776c05a5aa3ad47c50453e))
* resolve issue when enum that has functions is used in entity ([#7653](https://github.com/typeorm/typeorm/issues/7653)) ([dba327d](https://github.com/typeorm/typeorm/commit/dba327d426f591317f8210302107b95be1a5b420)), closes [#7651](https://github.com/typeorm/typeorm/issues/7651)
* Silent failure in createDatabase and dropDatabase with Postgres ([#7590](https://github.com/typeorm/typeorm/issues/7590)) ([974d2d4](https://github.com/typeorm/typeorm/commit/974d2d4efb0bdcf57e0522b4da3c94ab2937427b)), closes [#6867](https://github.com/typeorm/typeorm/issues/6867)
* STI types on children in joins ([#3160](https://github.com/typeorm/typeorm/issues/3160)) ([60a6c5d](https://github.com/typeorm/typeorm/commit/60a6c5d9607e06bfb2ff842d733ff90ce8b279ea))
* use `host` if `hostReplicaSet` is not provided in MongoDriver ([#7559](https://github.com/typeorm/typeorm/issues/7559)) ([9b6d7bc](https://github.com/typeorm/typeorm/commit/9b6d7bc4189f7741f0f823d65fc5c8ba4fbc2d94))
* use migrationsTransactionMode while running migration from cli ([#7576](https://github.com/typeorm/typeorm/issues/7576)) ([7953ebb](https://github.com/typeorm/typeorm/commit/7953ebb40f2b685f3d578bcf2be403f61e544205))
* use most specific matching relation type ([#2967](https://github.com/typeorm/typeorm/issues/2967)) ([ee3c00a](https://github.com/typeorm/typeorm/commit/ee3c00a686f1296bbe3bc3d0b7e1bd29333b358f))


### Features

* add `orphanedRowAction` option to EntitySchemaRelationOptions ([#7625](https://github.com/typeorm/typeorm/issues/7625)) ([a8eb49a](https://github.com/typeorm/typeorm/commit/a8eb49a3647d601531a6c3cb8404e1941a9d1f9c)), closes [#7417](https://github.com/typeorm/typeorm/issues/7417)
* add `set` datatype support for aurora-data-api ([#7665](https://github.com/typeorm/typeorm/issues/7665)) ([b6c1836](https://github.com/typeorm/typeorm/commit/b6c18366c3fe294f864ab4cd97c0bfc91e9d1f9d))
* add support for specifying `ioredis` cache with a URL ([#7689](https://github.com/typeorm/typeorm/issues/7689)) ([e017f9b](https://github.com/typeorm/typeorm/commit/e017f9b4683e12feb485b878ab002c42c1d63ffb)), closes [#7631](https://github.com/typeorm/typeorm/issues/7631)
* add tree entities update and delete logic ([#7156](https://github.com/typeorm/typeorm/issues/7156)) ([9c8a3fb](https://github.com/typeorm/typeorm/commit/9c8a3fbad7cf737ee514924ed8871a703768fddc)), closes [#7155](https://github.com/typeorm/typeorm/issues/7155)
* added Capacitor driver ([#7695](https://github.com/typeorm/typeorm/issues/7695)) ([0f7a778](https://github.com/typeorm/typeorm/commit/0f7a7783984c680350dd7560f47b78733a3ff3c5))
* cache option to ignore errors ([#7630](https://github.com/typeorm/typeorm/issues/7630)) ([5fde0ea](https://github.com/typeorm/typeorm/commit/5fde0ea89fb7c4942d7bbbe21f6bfbbe620347e5)), closes [#926](https://github.com/typeorm/typeorm/issues/926)
* define class properties for QueryFailedError to allow users to access a typed error ([#7529](https://github.com/typeorm/typeorm/issues/7529)) ([b43dcba](https://github.com/typeorm/typeorm/commit/b43dcba84e5bfa55baa7426a5059448207437f2d))
* support `MAX_EXECUTION_TIME ` for MySQL driver. ([#7638](https://github.com/typeorm/typeorm/issues/7638)) ([0564c34](https://github.com/typeorm/typeorm/commit/0564c348b9bd779e9f24cbf340ea48b6badc9f7e))

## [0.2.32](https://github.com/typeorm/typeorm/compare/0.2.31...0.2.32) (2021-03-30)

### Bug Fixes

* aurora-data-api get correct increment primary key for multiple entities inserted ([#7434](https://github.com/typeorm/typeorm/issues/7434)) ([fc8af5f](https://github.com/typeorm/typeorm/commit/fc8af5f5289ea13d3f152efbd0b800917ca0306a)), closes [#7385](https://github.com/typeorm/typeorm/issues/7385)
* aurora-data-api return number of affected rows in UpdatedResult and DeleteResult ([#7433](https://github.com/typeorm/typeorm/issues/7433)) ([46aba1d](https://github.com/typeorm/typeorm/commit/46aba1d1b947c9b03ba2661367427a818be46324)), closes [#7386](https://github.com/typeorm/typeorm/issues/7386)
* RelationLoader load with existing queryRunner ([#7471](https://github.com/typeorm/typeorm/issues/7471)) ([2dcb493](https://github.com/typeorm/typeorm/commit/2dcb493d55d95536ba4c2085c8f7af740be9ec72)), closes [#5338](https://github.com/typeorm/typeorm/issues/5338)
* Array type default value should not generate SQL commands without change ([#7409](https://github.com/typeorm/typeorm/issues/7409)) ([7f06e44](https://github.com/typeorm/typeorm/commit/7f06e447c60846c1aa28f2561b3f77a22e012f9a))
* correctly get referenceColumn value in `getEntityValueMap` ([#7005](https://github.com/typeorm/typeorm/issues/7005)) ([7fe723b](https://github.com/typeorm/typeorm/commit/7fe723b23b74a4c81608a856a82b8aa85fe1b385)), closes [#7002](https://github.com/typeorm/typeorm/issues/7002)
* don't transform json(b) column value when computing update changes ([#6929](https://github.com/typeorm/typeorm/issues/6929)) ([6be54d4](https://github.com/typeorm/typeorm/commit/6be54d46ac812487242ceffeda2922aff783b235))
* empty entity when query with nested relations ([#7450](https://github.com/typeorm/typeorm/issues/7450)) ([9abf727](https://github.com/typeorm/typeorm/commit/9abf727691d98351f49aa523c5ea03ec2b1ac620)), closes [#7041](https://github.com/typeorm/typeorm/issues/7041) [#7041](https://github.com/typeorm/typeorm/issues/7041) [#7041](https://github.com/typeorm/typeorm/issues/7041)
* fixed all known enum issues ([#7419](https://github.com/typeorm/typeorm/issues/7419)) ([724d80b](https://github.com/typeorm/typeorm/commit/724d80bf1aacedfc139ad09fe5842cad8fdb2893)), closes [#5371](https://github.com/typeorm/typeorm/issues/5371) [#6471](https://github.com/typeorm/typeorm/issues/6471) [#7217](https://github.com/typeorm/typeorm/issues/7217) [#6047](https://github.com/typeorm/typeorm/issues/6047) [#7283](https://github.com/typeorm/typeorm/issues/7283) [#5871](https://github.com/typeorm/typeorm/issues/5871) [#5729](https://github.com/typeorm/typeorm/issues/5729) [#5478](https://github.com/typeorm/typeorm/issues/5478) [#5882](https://github.com/typeorm/typeorm/issues/5882) [#5275](https://github.com/typeorm/typeorm/issues/5275) [#2233](https://github.com/typeorm/typeorm/issues/2233) [#5648](https://github.com/typeorm/typeorm/issues/5648) [#4897](https://github.com/typeorm/typeorm/issues/4897) [#6376](https://github.com/typeorm/typeorm/issues/6376) [#6115](https://github.com/typeorm/typeorm/issues/6115)
* improve EntityManager.save() return type ([#7391](https://github.com/typeorm/typeorm/issues/7391)) ([66fbfda](https://github.com/typeorm/typeorm/commit/66fbfdaaa6e03114607671103fe0df7ab1d781a8))
* Only first single quote in comments is escaped ([#7514](https://github.com/typeorm/typeorm/issues/7514)) ([e1e9423](https://github.com/typeorm/typeorm/commit/e1e94236e71c14a4682356ada7774d657eba8936))
* performance issues of `RelationId`. ([#7318](https://github.com/typeorm/typeorm/issues/7318)) ([01a215a](https://github.com/typeorm/typeorm/commit/01a215a32b47a03af9301c0e6e68f943a24919c4)), closes [#5691](https://github.com/typeorm/typeorm/issues/5691)
* rename a sequence related to generated primary key when a table is renamed ([#5406](https://github.com/typeorm/typeorm/issues/5406)) ([25b457f](https://github.com/typeorm/typeorm/commit/25b457f7e8d6cdeee146ba60a280f1a65bcec9eb))
* resolve issue building tree entities with embeded primary column ([#7416](https://github.com/typeorm/typeorm/issues/7416)) ([dc81814](https://github.com/typeorm/typeorm/commit/dc81814056071ee3557043e5e6be06c431314634)), closes [#7415](https://github.com/typeorm/typeorm/issues/7415)
* wrong migration generation when column default value is set to null [#6950](https://github.com/typeorm/typeorm/issues/6950) ([#7356](https://github.com/typeorm/typeorm/issues/7356)) ([5a3f9ff](https://github.com/typeorm/typeorm/commit/5a3f9ff3d6ff5ec1bf704c836bef5a7529ff7f5a))

### Features

* add check and dry-run to migration generate ([#7275](https://github.com/typeorm/typeorm/issues/7275)) ([d6df200](https://github.com/typeorm/typeorm/commit/d6df200772604103279502dfc61340475131d4e1)), closes [#3037](https://github.com/typeorm/typeorm/issues/3037) [#6978](https://github.com/typeorm/typeorm/issues/6978)
* add option for installing package using CLI ([#6889](https://github.com/typeorm/typeorm/issues/6889)) ([3d876c6](https://github.com/typeorm/typeorm/commit/3d876c61fafc815e429c68f4f4e1ab79e47c7b9c))
* Add support for Access Token Authentication for SQL Server Driver (mssql) ([#7477](https://github.com/typeorm/typeorm/issues/7477)) ([e639772](https://github.com/typeorm/typeorm/commit/e639772e3b5aa5fa2f40fd6cda984b13e4bf9c90))
* added socketPath support for replicas in MySQL driver ([#7459](https://github.com/typeorm/typeorm/issues/7459)) ([8d7afaf](https://github.com/typeorm/typeorm/commit/8d7afaf78df8974ebbe00219716af8da738a6fe7))
* allow to pass the given table name as string in RelationDecorators ([#7448](https://github.com/typeorm/typeorm/issues/7448)) ([4dbb10e](https://github.com/typeorm/typeorm/commit/4dbb10e11ff3fdd58fdaac87337aa0d3237002ba))
* implement "FOR UPDATE OF" for postgres driver ([#7040](https://github.com/typeorm/typeorm/issues/7040)) ([fde9f07](https://github.com/typeorm/typeorm/commit/fde9f0772eef69836ff4d85816cfe4fd6f7028b4))
* introduced a new configuration option "formatOptions.castParameters" to delegate the prepare/hydrate parameters to the driver which will result in casting the parameters to their respective column type ([#7483](https://github.com/typeorm/typeorm/issues/7483)) ([7793b3f](https://github.com/typeorm/typeorm/commit/7793b3f992d928b4db6bff6a5ad1b4cbe377a167))
* output Javascript Migrations instead of TypeScript ([#7294](https://github.com/typeorm/typeorm/issues/7294)) ([b97cc4f](https://github.com/typeorm/typeorm/commit/b97cc4ff955de8be39258add958c2885d0bcdfe6))

## [0.2.31](https://github.com/typeorm/typeorm/compare/0.2.30...0.2.31) (2021-02-08)

### Bug Fixes

* append condition to STI child entity join ([#7339](https://github.com/typeorm/typeorm/issues/7339)) ([68bb82e](https://github.com/typeorm/typeorm/commit/68bb82e5de639ef746f8ddc699e3ee2ca051bdbe))
* avoid regex lookbehind for compatibility ([#7270](https://github.com/typeorm/typeorm/issues/7270)) ([063d27f](https://github.com/typeorm/typeorm/commit/063d27fe338abf2929e45a8a8d4a0e4f292111c4)), closes [#7026](https://github.com/typeorm/typeorm/issues/7026)
* cache from ENV - add ioredis support ([#7332](https://github.com/typeorm/typeorm/issues/7332)) ([5e2117c](https://github.com/typeorm/typeorm/commit/5e2117cdffeb31691dbe7fbd8f56e0f9256d1d47))
* datetime2 rounding in mssql ([#7264](https://github.com/typeorm/typeorm/issues/7264)) ([4711a71](https://github.com/typeorm/typeorm/commit/4711a7189b4a852a467fa83f26f9827b3249aba4)), closes [#3202](https://github.com/typeorm/typeorm/issues/3202)
* escape columns in InsertQueryBuilder.orUpdate ([#6316](https://github.com/typeorm/typeorm/issues/6316)) ([ab56e07](https://github.com/typeorm/typeorm/commit/ab56e07de162771b0a42bc4074f089ca6f52cd2b))
* incorrect postgres uuid type in PrimaryGeneratedColumnType ([#7298](https://github.com/typeorm/typeorm/issues/7298)) ([2758502](https://github.com/typeorm/typeorm/commit/2758502c83a9e8f8c6b18e19530366f45073755f))
* MariaDB VIRTUAL + [NOT NULL|NULL] error ([#7022](https://github.com/typeorm/typeorm/issues/7022)) ([82f2b75](https://github.com/typeorm/typeorm/commit/82f2b75013e50c9cce9468f03e886639d4943a9a)), closes [#2691](https://github.com/typeorm/typeorm/issues/2691)
* reject nullable primary key columns ([#7001](https://github.com/typeorm/typeorm/issues/7001)) ([cdace6e](https://github.com/typeorm/typeorm/commit/cdace6e5fa09e823bddd3f076c318ce1903d48dc))
* resolve issue with find with relations returns soft-deleted entities ([#7296](https://github.com/typeorm/typeorm/issues/7296)) ([d7cb338](https://github.com/typeorm/typeorm/commit/d7cb338145f2c3e009c4934a2aa882df74bc7dc8)), closes [#6265](https://github.com/typeorm/typeorm/issues/6265)
* save does not return id, save does not return generated ([#7336](https://github.com/typeorm/typeorm/issues/7336)) ([01a6aee](https://github.com/typeorm/typeorm/commit/01a6aee75edfc3d74ce0f6626258360458960363))

### Features

* enable explicitly inserting IDENTITY values into mssql ([#6199](https://github.com/typeorm/typeorm/issues/6199)) ([4abbd46](https://github.com/typeorm/typeorm/commit/4abbd46af347ff7d1b38f073715155b186437512)), closes [#2199](https://github.com/typeorm/typeorm/issues/2199)
* export all errors ([#7006](https://github.com/typeorm/typeorm/issues/7006)) ([56300d8](https://github.com/typeorm/typeorm/commit/56300d810e3e6c200a933261c2b78f442751b842))
* option to disable foreign keys creation ([#7277](https://github.com/typeorm/typeorm/issues/7277)) ([cb17b95](https://github.com/typeorm/typeorm/commit/cb17b959e5ab6170df8b3fcac115521516b77848)), closes [#3120](https://github.com/typeorm/typeorm/issues/3120) [#3120](https://github.com/typeorm/typeorm/issues/3120)
* support maxdecimaldigits option by geometry type ([#7166](https://github.com/typeorm/typeorm/issues/7166)) ([d749008](https://github.com/typeorm/typeorm/commit/d74900830729c8b9b32226d42d304576e573c744))
* useUTC connection option for oracle and postgres ([#7295](https://github.com/typeorm/typeorm/issues/7295)) ([e06a442](https://github.com/typeorm/typeorm/commit/e06a4423c83ae78a771cc239ee1135e70c98c899))

### BREAKING CHANGES

* passing `ColumnOptions` to `@PrimaryColumn` does not function anymore. One must use `PrimaryColumnOptions` instead.
* minor breaking change on "conflict*" options - column names used are now automatically escaped.


## [0.2.30](https://github.com/typeorm/typeorm/compare/0.2.29...0.2.30) (2021-01-12)

### Bug Fixes

* add missing "comment" field to QB clone method ([#7205](https://github.com/typeorm/typeorm/issues/7205)) ([f019771](https://github.com/typeorm/typeorm/commit/f0197710ab986b474ce0b6c260d57e8234a5bb4f)), closes [#7203](https://github.com/typeorm/typeorm/issues/7203)
* avoid early release of PostgresQueryRunner ([#7109](https://github.com/typeorm/typeorm/issues/7109)) ([#7185](https://github.com/typeorm/typeorm/issues/7185)) ([9abe007](https://github.com/typeorm/typeorm/commit/9abe0076f65afba9034fb48ba3ebd43be7e7557a))
* Error when sorting by an embedded entity while using join and skip/take ([#7082](https://github.com/typeorm/typeorm/issues/7082)) ([d27dd2a](https://github.com/typeorm/typeorm/commit/d27dd2af2ca320e74a17b3ab273cd3bf55d01923)), closes [#7079](https://github.com/typeorm/typeorm/issues/7079)
* Fix CLI query command TypeError ([#7043](https://github.com/typeorm/typeorm/issues/7043)) ([b35397e](https://github.com/typeorm/typeorm/commit/b35397ea07982a21d3b263cb0b7c04d5aa057d1a))
* get length attribute of postgres array columns ([#7239](https://github.com/typeorm/typeorm/issues/7239)) ([eb82f78](https://github.com/typeorm/typeorm/commit/eb82f786cbe3244351d5860289dace3169cf473b)), closes [#6990](https://github.com/typeorm/typeorm/issues/6990)
* handle overlapping property / database names in querybuilder ([#7042](https://github.com/typeorm/typeorm/issues/7042)) ([b518fa1](https://github.com/typeorm/typeorm/commit/b518fa15f9b2183545b3c0daa2447ecd38ecc859)), closes [#7030](https://github.com/typeorm/typeorm/issues/7030)
* improve stack traces when using persist executor ([#7218](https://github.com/typeorm/typeorm/issues/7218)) ([0dfe5b8](https://github.com/typeorm/typeorm/commit/0dfe5b83f584c3960cdef28e53d2f0ded3f829ce))
* order should allow only model fields, not methods ([#7188](https://github.com/typeorm/typeorm/issues/7188)) ([0194193](https://github.com/typeorm/typeorm/commit/01941937df11abd63fad9da082e1b5cf6a1300ce)), closes [#7178](https://github.com/typeorm/typeorm/issues/7178)
* resolve migration for UpdateDateColumn without ON UPDATE clause ([#7057](https://github.com/typeorm/typeorm/issues/7057)) ([ddd8cbc](https://github.com/typeorm/typeorm/commit/ddd8cbcdf6d67b6b1425de581c3da5d264a01167)), closes [#6995](https://github.com/typeorm/typeorm/issues/6995)
* resolves Postgres sequence identifier length error ([#7115](https://github.com/typeorm/typeorm/issues/7115)) ([568ef35](https://github.com/typeorm/typeorm/commit/568ef3546e6da6e73f68437fff418901d6232c51)), closes [#7106](https://github.com/typeorm/typeorm/issues/7106)
* return 'null' (instead of 'undefined') on lazy relations that have no results ([#7146](https://github.com/typeorm/typeorm/issues/7146)) ([#7147](https://github.com/typeorm/typeorm/issues/7147)) ([9b278c9](https://github.com/typeorm/typeorm/commit/9b278c99e52bbcdf0d36ece29168785ee8641687))
* support MongoDB DNS seed list connection ([#7136](https://github.com/typeorm/typeorm/issues/7136)) ([f730bb9](https://github.com/typeorm/typeorm/commit/f730bb9fc1908a65edacc07e5e364648efb48768)), closes [#3347](https://github.com/typeorm/typeorm/issues/3347) [#3133](https://github.com/typeorm/typeorm/issues/3133)
* **data-api:** Fixed how data api driver uses and reuses a client ([#6869](https://github.com/typeorm/typeorm/issues/6869)) ([6ce65fb](https://github.com/typeorm/typeorm/commit/6ce65fbf6be5e696c3ae907d3f8e63b1e7332a1e))
* use default import of yargs for --help ([#6986](https://github.com/typeorm/typeorm/issues/6986)) ([6ef8ffe](https://github.com/typeorm/typeorm/commit/6ef8ffe387980c51f9f20e9cc03d6199c7068ac5))


### Features

* add NOWAIT and SKIP LOCKED lock support for MySQL ([#7236](https://github.com/typeorm/typeorm/issues/7236)) ([9407507](https://github.com/typeorm/typeorm/commit/9407507a742a3fe0ea2a836417d6851cad72e74c)), closes [#6530](https://github.com/typeorm/typeorm/issues/6530)
* closure table custom naming ([#7120](https://github.com/typeorm/typeorm/issues/7120)) ([bcd998b](https://github.com/typeorm/typeorm/commit/bcd998b4f384893679e60914d3c52b3d68e7792e))
* JavaScript file migrations output ([#7253](https://github.com/typeorm/typeorm/issues/7253)) ([ce9cb87](https://github.com/typeorm/typeorm/commit/ce9cb8732cb70458f29c0976d980d34b0f4fa3d7))
* relations: Orphaned row action ([#7105](https://github.com/typeorm/typeorm/issues/7105)) ([efc2837](https://github.com/typeorm/typeorm/commit/efc283769ed972d022980e681e294d695087a807))

## [0.2.29](https://github.com/typeorm/typeorm/compare/0.2.28...0.2.29) (2020-11-02)

### Bug Fixes

* allow falsey discriminator values ([#6973](https://github.com/typeorm/typeorm/issues/6973)) ([f3ba242](https://github.com/typeorm/typeorm/commit/f3ba2420396341ad3b808ea8540ea6a2272ff916)), closes [#3891](https://github.com/typeorm/typeorm/issues/3891)
* allow for complex jsonb primary key columns  ([#6834](https://github.com/typeorm/typeorm/issues/6834)) ([f95e9d8](https://github.com/typeorm/typeorm/commit/f95e9d8f9a6c7a1117564b3e3f65b5294f8d5ff5)), closes [#6833](https://github.com/typeorm/typeorm/issues/6833)
* Allows valid non-object JSON to be retrieved in simple-json columns ([#6574](https://github.com/typeorm/typeorm/issues/6574)) ([0aedf43](https://github.com/typeorm/typeorm/commit/0aedf43874a6f950614134967bf4b173e4513ba0)), closes [#5501](https://github.com/typeorm/typeorm/issues/5501)
* Cannot read property 'hasMetadata' of undefined ([#5659](https://github.com/typeorm/typeorm/issues/5659)) ([0280cdc](https://github.com/typeorm/typeorm/commit/0280cdc451c35ef73c830eb1191c95d34f6ce06e)), closes [#3685](https://github.com/typeorm/typeorm/issues/3685)
* check if the connection is closed before executing a query. This prevents SQLITE_MISUSE errors (https://sqlite.org/rescode.html#misuse) originating from sqlite itself ([#6975](https://github.com/typeorm/typeorm/issues/6975)) ([5f6bbec](https://github.com/typeorm/typeorm/commit/5f6bbecd6166f1e80ed87d7e6c2c181fe463bdef))
* check mysql constraint schema on join ([#6851](https://github.com/typeorm/typeorm/issues/6851)) ([d2b914d](https://github.com/typeorm/typeorm/commit/d2b914da6a425d47916c72ac50bfa69bea4847fb)), closes [#6169](https://github.com/typeorm/typeorm/issues/6169) [#6169](https://github.com/typeorm/typeorm/issues/6169)
* correct reading of custom ormconfig.env files ([#6922](https://github.com/typeorm/typeorm/issues/6922)) ([a09fb7f](https://github.com/typeorm/typeorm/commit/a09fb7fb919e7ebb1c174ba4b0abe09b245e0442))
* explicitly define `query` command's param ([#6899](https://github.com/typeorm/typeorm/issues/6899)) ([4475d80](https://github.com/typeorm/typeorm/commit/4475d8067592b91b857f2b456dc31c5850a21081)), closes [#6896](https://github.com/typeorm/typeorm/issues/6896)
* findRoots should get the defined primary key column ([#6982](https://github.com/typeorm/typeorm/issues/6982)) ([f2ba901](https://github.com/typeorm/typeorm/commit/f2ba9012fe4e851bc667dfdfedc3fd4af665d52b)), closes [#6948](https://github.com/typeorm/typeorm/issues/6948) [#6948](https://github.com/typeorm/typeorm/issues/6948)
* Fix Mongodb delete by ObjectId. Closes [#6552](https://github.com/typeorm/typeorm/issues/6552) ([#6553](https://github.com/typeorm/typeorm/issues/6553)) ([e37eb1e](https://github.com/typeorm/typeorm/commit/e37eb1e8e8544f91c3d0a44b55322966e121b3af))
* fixes the typescript errors in EntityCreateCommand & SubscriberCreateCommand ([#6824](https://github.com/typeorm/typeorm/issues/6824)) ([0221a93](https://github.com/typeorm/typeorm/commit/0221a933d19125cc0703a7fdd2a243b494ac5e72))
* handle count multiple PK & edge cases more gracefully ([#6870](https://github.com/typeorm/typeorm/issues/6870)) ([4abfb34](https://github.com/typeorm/typeorm/commit/4abfb342aa390ab4643a1133daaf90c0996b61c2)), closes [#5989](https://github.com/typeorm/typeorm/issues/5989) [#5314](https://github.com/typeorm/typeorm/issues/5314) [#4550](https://github.com/typeorm/typeorm/issues/4550)
* Handle undefined querysets in QueryCommand ([#6910](https://github.com/typeorm/typeorm/issues/6910)) ([6f285dc](https://github.com/typeorm/typeorm/commit/6f285dce1ac315707fe01a892c1c74521a98aae2)), closes [#6612](https://github.com/typeorm/typeorm/issues/6612)
* handle Undefined values in driver URL options ([#6925](https://github.com/typeorm/typeorm/issues/6925)) ([6fa2df5](https://github.com/typeorm/typeorm/commit/6fa2df5ade71a3fee550e3c8fb7bcd7cd02080a8))
* ILike operator generally available for any driver ([#6945](https://github.com/typeorm/typeorm/issues/6945)) ([37f0d8f](https://github.com/typeorm/typeorm/commit/37f0d8f7938ee5dbcf899a7f2855ea6dc6dc604e))
* Only check for discriminator conflicts on STI entities ([#2985](https://github.com/typeorm/typeorm/issues/2985)) ([06903d1](https://github.com/typeorm/typeorm/commit/06903d1c914e8082620dbf16551caa302862d328)), closes [#2984](https://github.com/typeorm/typeorm/issues/2984)
* postgresql connection URL can use an UNIX Socket ([#2614](https://github.com/typeorm/typeorm/issues/2614)) ([#6042](https://github.com/typeorm/typeorm/issues/6042)) ([21c4166](https://github.com/typeorm/typeorm/commit/21c41663ccecfa5f2d94f94424f1a9a53e5d817c))
* prevent create-type commands edge-case TypeErrors ([#6836](https://github.com/typeorm/typeorm/issues/6836)) ([08ec0a8](https://github.com/typeorm/typeorm/commit/08ec0a8ed922225ff529790ad5ff19c0e463954e)), closes [#6831](https://github.com/typeorm/typeorm/issues/6831)
* redundant migration with decimal default ([#6879](https://github.com/typeorm/typeorm/issues/6879)) ([6ff67f7](https://github.com/typeorm/typeorm/commit/6ff67f71fa7ad2bcf8a89c01ead7f54386e35f3a)), closes [#6140](https://github.com/typeorm/typeorm/issues/6140) [#5407](https://github.com/typeorm/typeorm/issues/5407)
* remove @DiscriminatorValue from error message ([#5256](https://github.com/typeorm/typeorm/issues/5256)) ([2bf15ca](https://github.com/typeorm/typeorm/commit/2bf15ca913016ad07080c38c9fc3ee848b60ca4f)), closes [#5255](https://github.com/typeorm/typeorm/issues/5255)
* resolves issue proto-less object validation ([#6884](https://github.com/typeorm/typeorm/issues/6884)) ([e08d9c6](https://github.com/typeorm/typeorm/commit/e08d9c61aab72f16ecd8bd790cb32bf0d164a5af)), closes [#2065](https://github.com/typeorm/typeorm/issues/2065)
* return null for nullable RelationId() column ([#6848](https://github.com/typeorm/typeorm/issues/6848)) ([7147a0d](https://github.com/typeorm/typeorm/commit/7147a0dbe7f2622a21c51edefa3b921f42e04b49)), closes [#6815](https://github.com/typeorm/typeorm/issues/6815)
* subscribers should use the subscribersDir ([5ef9450](https://github.com/typeorm/typeorm/commit/5ef94509b89f11f8337e18046c3f9d9632d234df))
* support changing comments in MySQL columns ([#6903](https://github.com/typeorm/typeorm/issues/6903)) ([c5143aa](https://github.com/typeorm/typeorm/commit/c5143aab08a04e96aebb55996ed7683d48542bbd))
* support combination of many-to-one/cacade/composte PK ([#6417](https://github.com/typeorm/typeorm/issues/6417)) ([9a0497b](https://github.com/typeorm/typeorm/commit/9a0497b533b2f6896b8e7d189b36dd3892e58007))
* support empty `IN` clause across all dialects ([#6887](https://github.com/typeorm/typeorm/issues/6887)) ([9635080](https://github.com/typeorm/typeorm/commit/96350805fb9f02b8fb2c90b5528a15d5cdb9faeb)), closes [#4865](https://github.com/typeorm/typeorm/issues/4865) [#2195](https://github.com/typeorm/typeorm/issues/2195)
* support multiple row insert on oracle ([#6927](https://github.com/typeorm/typeorm/issues/6927)) ([a5eb946](https://github.com/typeorm/typeorm/commit/a5eb946117a18d94c0157188b6a39542c8d50756)), closes [#2434](https://github.com/typeorm/typeorm/issues/2434)
* sync the typeorm-model-shim ([#6891](https://github.com/typeorm/typeorm/issues/6891)) ([c72e48b](https://github.com/typeorm/typeorm/commit/c72e48b9c7b893f8a2483ba1ddaa7ded039fe349)), closes [#6288](https://github.com/typeorm/typeorm/issues/6288) [#5920](https://github.com/typeorm/typeorm/issues/5920)
* TreeRepository based entities primary column supports custom name. ([#6942](https://github.com/typeorm/typeorm/issues/6942)) ([7ec1b75](https://github.com/typeorm/typeorm/commit/7ec1b75f12832e4d99e1ed0cef40755f2b6d650a))
* use `require` in `ReactNativeDriver` ([#6814](https://github.com/typeorm/typeorm/issues/6814)) ([1a6383c](https://github.com/typeorm/typeorm/commit/1a6383cecd74ee90388db313a74432f7ba12cfdf)), closes [#6811](https://github.com/typeorm/typeorm/issues/6811)
* use correct type for MongoQueryRunner.databaseConnection ([#6906](https://github.com/typeorm/typeorm/issues/6906)) ([da70b40](https://github.com/typeorm/typeorm/commit/da70b405498b142ecc29f7ff01e7a37f88227360)), closes [#6453](https://github.com/typeorm/typeorm/issues/6453)
* use pg ^8 in `init` command ([6ed9906](https://github.com/typeorm/typeorm/commit/6ed990666604ca9b8c0029d4fe972a039ef28570))
* wrong FK loaded in multi-database environment ([#6828](https://github.com/typeorm/typeorm/issues/6828)) ([c060f95](https://github.com/typeorm/typeorm/commit/c060f95db0e261b02c4b28b19541cabcb1ac4a75)), closes [#6168](https://github.com/typeorm/typeorm/issues/6168)


### Features

* add ability for escaping for Raw() find operator ([#6850](https://github.com/typeorm/typeorm/issues/6850)) ([91b85bf](https://github.com/typeorm/typeorm/commit/91b85bfe6e73ff93db2684a13935b9bd6a9abcfd))
* add absolute path support to other CLI commands ([#6807](https://github.com/typeorm/typeorm/issues/6807)) ([d9a76e9](https://github.com/typeorm/typeorm/commit/d9a76e91bed06037ff28ec132893f40c09004438))
* Add SelectQueryBuilder.getOneOrFail() ([#6885](https://github.com/typeorm/typeorm/issues/6885)) ([920e781](https://github.com/typeorm/typeorm/commit/920e7812cd9d405df921f9ae9ce52ba0a9743bea)), closes [#6246](https://github.com/typeorm/typeorm/issues/6246)
* backport ilike from next ([#6862](https://github.com/typeorm/typeorm/issues/6862)) ([c8bf81e](https://github.com/typeorm/typeorm/commit/c8bf81ed2d47ba0822f8d6267ae1997180db2e31))
* Exit with code 1 on empty migration:generate ([#6978](https://github.com/typeorm/typeorm/issues/6978)) ([8244ea1](https://github.com/typeorm/typeorm/commit/8244ea1371d5cf37e3f80e1b141f5945af38cb5e))
* schema synchronization for partitioned tables with PostgreSQL 12+ ([#6780](https://github.com/typeorm/typeorm/issues/6780)) ([990442e](https://github.com/typeorm/typeorm/commit/990442e891e91cd829f9f34eff2114d4c623d24b))
* support `autoEncryption` option for MongoDB ([#6865](https://github.com/typeorm/typeorm/issues/6865)) ([b22c27f](https://github.com/typeorm/typeorm/commit/b22c27feb2dd3892d47a9e82b0d7b11650d059b5))
* Support column comments in Postgres and CockroachDB ([#6902](https://github.com/typeorm/typeorm/issues/6902)) ([bc623a4](https://github.com/typeorm/typeorm/commit/bc623a42a868eae7c988779abc4cdc0bbf775def)), closes [#3360](https://github.com/typeorm/typeorm/issues/3360)
* support ESM in ormconfig js & ts ([#6853](https://github.com/typeorm/typeorm/issues/6853)) ([7ebca2b](https://github.com/typeorm/typeorm/commit/7ebca2b9b1fd21e546b3a345a069637d6aab4b3e)), closes [#5003](https://github.com/typeorm/typeorm/issues/5003)
* support query comments in the query builder ([#6892](https://github.com/typeorm/typeorm/issues/6892)) ([84c18a9](https://github.com/typeorm/typeorm/commit/84c18a9cab2e87b28eb046b5688bfca4d3ce9da6)), closes [#3643](https://github.com/typeorm/typeorm/issues/3643)
* transactional events in subscriber interface + "transaction" option in FindOptions ([#6996](https://github.com/typeorm/typeorm/issues/6996)) ([0e4b239](https://github.com/typeorm/typeorm/commit/0e4b2397a6e62f5f2c35e5890bba53abe40a49ac))

### Performance Improvements

* Improve MySQL LoadTables Performance ([#6886](https://github.com/typeorm/typeorm/issues/6886)) ([0f0e0b6](https://github.com/typeorm/typeorm/commit/0f0e0b660c83409bb59f806b9f6e099ca8dbc61c)), closes [#6800](https://github.com/typeorm/typeorm/issues/6800)
* Improve replacePropertyNames ([#4760](https://github.com/typeorm/typeorm/issues/4760)) ([d86671c](https://github.com/typeorm/typeorm/commit/d86671cb179751730d0324b23d9f4bcb21010728))

## [0.2.28](https://github.com/typeorm/typeorm/compare/0.2.27...0.2.28) (2020-09-30)

### Bug Fixes

* FindManyOptions order in parameter typing is important ([51608ae](https://github.com/typeorm/typeorm/commit/51608aebccd31570fc33ba0cd90c3147cdfc70b8))
* lock Typescript to 3.6.0 ([#6810](https://github.com/typeorm/typeorm/issues/6810)) ([7f7e4d5](https://github.com/typeorm/typeorm/commit/7f7e4d53119506bdbb86999606707cd740859fe7)), closes [#6809](https://github.com/typeorm/typeorm/issues/6809) [#6805](https://github.com/typeorm/typeorm/issues/6805)

## [0.2.27](https://github.com/typeorm/typeorm/compare/0.2.26...0.2.27) (2020-09-29)

### Bug Fixes

* add dummy for FileLogger, ConnectionOptionsReaders, and update gulpfile ([#6763](https://github.com/typeorm/typeorm/issues/6763)) ([180fbd4](https://github.com/typeorm/typeorm/commit/180fbd415da80ce383b426f6d38486aa3826296d))
* backport FindOperator return types ([#6717](https://github.com/typeorm/typeorm/issues/6717)) ([2b37808](https://github.com/typeorm/typeorm/commit/2b3780836f5fd737fdc58fe4e0eb2ea4200cae66))
* coerce port to number in ConnectionOptionsEnvReader ([#6786](https://github.com/typeorm/typeorm/issues/6786)) ([55fbb69](https://github.com/typeorm/typeorm/commit/55fbb696c6c2324a67a08061322dc5726844b7d1)), closes [#6781](https://github.com/typeorm/typeorm/issues/6781)
* count() method for multiple primary keys for cockroachdb ([#6745](https://github.com/typeorm/typeorm/issues/6745)) ([dfe8259](https://github.com/typeorm/typeorm/commit/dfe8259ef53a432f1c02607e6ffee662dd4fd8a9))
* enforce name argument of migration generate command ([#2719](https://github.com/typeorm/typeorm/issues/2719)) ([#6690](https://github.com/typeorm/typeorm/issues/6690)) ([dfcb2db](https://github.com/typeorm/typeorm/commit/dfcb2db216d6ed33946dfa190e19eb14c0fed390)), closes [#4798](https://github.com/typeorm/typeorm/issues/4798) [#4805](https://github.com/typeorm/typeorm/issues/4805) [#4798](https://github.com/typeorm/typeorm/issues/4798) [#4805](https://github.com/typeorm/typeorm/issues/4805)
* ensure browser builds don't include any non-browser modules ([#6743](https://github.com/typeorm/typeorm/issues/6743)) ([c714867](https://github.com/typeorm/typeorm/commit/c714867d3d0c43ccbb7ca8fb3ce969207e4d5c04)), closes [#6739](https://github.com/typeorm/typeorm/issues/6739)
* hdb-pool is not namespaced under [@sap](https://github.com/sap) ([#6700](https://github.com/typeorm/typeorm/issues/6700)) ([9583430](https://github.com/typeorm/typeorm/commit/9583430e8282d1ad758724957971a5d5d9664f63)), closes [#6697](https://github.com/typeorm/typeorm/issues/6697)
* migration:generate issue with onUpdate using mariadb 10.4 ([#6714](https://github.com/typeorm/typeorm/issues/6714)) ([6e28322](https://github.com/typeorm/typeorm/commit/6e28322ca65ba739bf0d767075016bc0cae7a48c))
* prevent multiple `release` listeners in PostgresQueryRunner ([#6708](https://github.com/typeorm/typeorm/issues/6708)) ([208cf6b](https://github.com/typeorm/typeorm/commit/208cf6b0511a2d565c7999837497bb6cf8f8e7c7)), closes [#6699](https://github.com/typeorm/typeorm/issues/6699)
* prevent wrong returned entity in ReturningResultsEntityUpdator ([#6440](https://github.com/typeorm/typeorm/issues/6440)) ([c1c8e88](https://github.com/typeorm/typeorm/commit/c1c8e88f8945bf6a03bde728de370f5c61c5bdb8))
* resolve issues ora-00972:identifier is too long ([#6751](https://github.com/typeorm/typeorm/issues/6751)) ([b55a417](https://github.com/typeorm/typeorm/commit/b55a417ea4852ad2e66091cfa800534f7ccdd3c9)), closes [#5067](https://github.com/typeorm/typeorm/issues/5067) [#5067](https://github.com/typeorm/typeorm/issues/5067)
* sql.js v1.2+ don't support undefined parameters ([#6698](https://github.com/typeorm/typeorm/issues/6698)) ([ea59b8d](https://github.com/typeorm/typeorm/commit/ea59b8d46b2a36ac251f43c8a8fb98ff15ab4e2d)), closes [#5720](https://github.com/typeorm/typeorm/issues/5720)

### Features

* add option to pass postgres server notices to client logger ([#6215](https://github.com/typeorm/typeorm/issues/6215)) ([5084e47](https://github.com/typeorm/typeorm/commit/5084e47be4fd42316ad47e6102645534fae45d9f)), closes [#2216](https://github.com/typeorm/typeorm/issues/2216)
* backport SQLite Busy handler & WAL mode enable ([#6588](https://github.com/typeorm/typeorm/issues/6588)) ([7a52f18](https://github.com/typeorm/typeorm/commit/7a52f18c86613292c3503484eac332f59141a6e3))
* Beautify generated SQL for migrations ([#6685](https://github.com/typeorm/typeorm/issues/6685)) ([370442c](https://github.com/typeorm/typeorm/commit/370442c27a0aecd67eeb44f6077922dda16bcef8)), closes [#4415](https://github.com/typeorm/typeorm/issues/4415)
* create EntityTarget and use instead of EntitySchema / ObjectType / etc ([#6701](https://github.com/typeorm/typeorm/issues/6701)) ([8b68f40](https://github.com/typeorm/typeorm/commit/8b68f40a01b6cdc0e8d21492d988fe21cbef64de))

### Reverts

* Revert "fix: properly override database url properties (#6247)" (#6802) ([45b980c](https://github.com/typeorm/typeorm/commit/45b980cf7fd61b0ee2e9560d9aadb96ce331d5cb)), closes [#6247](https://github.com/typeorm/typeorm/issues/6247) [#6802](https://github.com/typeorm/typeorm/issues/6802)

## [0.2.26](https://github.com/typeorm/typeorm/compare/0.2.25...0.2.26) (2020-09-10)

### Bug Fixes

* @JoinTable does not respect inverseJoinColumns referenced column width ([#6444](https://github.com/typeorm/typeorm/issues/6444)) ([f642a9e](https://github.com/typeorm/typeorm/commit/f642a9e)), closes [#6442](https://github.com/typeorm/typeorm/issues/6442)
* add missing schema for OracleDriver ([#6673](https://github.com/typeorm/typeorm/issues/6673)) ([8b8bc35](https://github.com/typeorm/typeorm/commit/8b8bc35))
* change InsertQueryBuilder.values() with an empty array into a no-op ([#6584](https://github.com/typeorm/typeorm/issues/6584)) ([9d2df28](https://github.com/typeorm/typeorm/commit/9d2df28)), closes [#3111](https://github.com/typeorm/typeorm/issues/3111)
* Child entities not being saved correctly with cascade actions ([#6219](https://github.com/typeorm/typeorm/issues/6219)) ([16a2d80](https://github.com/typeorm/typeorm/commit/16a2d80))
* correctly parse connection URI with query params ([#6390](https://github.com/typeorm/typeorm/issues/6390)) ([54a3a15](https://github.com/typeorm/typeorm/commit/54a3a15)), closes [#6389](https://github.com/typeorm/typeorm/issues/6389)
* decorators should implement the official TypeScript interface ([#6398](https://github.com/typeorm/typeorm/issues/6398)) ([c23c888](https://github.com/typeorm/typeorm/commit/c23c888)), closes [#5922](https://github.com/typeorm/typeorm/issues/5922)
* DeepPartial with any and {[k: string]: any} ([#6581](https://github.com/typeorm/typeorm/issues/6581)) ([8d90d40](https://github.com/typeorm/typeorm/commit/8d90d40)), closes [#6580](https://github.com/typeorm/typeorm/issues/6580) [#6580](https://github.com/typeorm/typeorm/issues/6580)
* exporting missing load event ([#6396](https://github.com/typeorm/typeorm/issues/6396)) ([c6336aa](https://github.com/typeorm/typeorm/commit/c6336aa))
* get correct insert ids for multiple entities inserted ([#6668](https://github.com/typeorm/typeorm/issues/6668)) ([ef2011d](https://github.com/typeorm/typeorm/commit/ef2011d)), closes [#2131](https://github.com/typeorm/typeorm/issues/2131) [#5973](https://github.com/typeorm/typeorm/issues/5973) [#2131](https://github.com/typeorm/typeorm/issues/2131)
* getPendingMigrations isn't properly working ([#6372](https://github.com/typeorm/typeorm/issues/6372)) ([7c0da1c](https://github.com/typeorm/typeorm/commit/7c0da1c))
* handle 'error' events from pool connection ([#6262](https://github.com/typeorm/typeorm/issues/6262)) ([ae3cf0e](https://github.com/typeorm/typeorm/commit/ae3cf0e))
* insert IN(null) instead of IN() when In([]) empty array for mysqlDriver ([#6237](https://github.com/typeorm/typeorm/issues/6237)) ([6f6bdbd](https://github.com/typeorm/typeorm/commit/6f6bdbd))
* make only a single SELECT to get inserted default and generated values of multiple entities ([#6669](https://github.com/typeorm/typeorm/issues/6669)) ([4fc4a1b](https://github.com/typeorm/typeorm/commit/4fc4a1b)), closes [#6266](https://github.com/typeorm/typeorm/issues/6266) [#6266](https://github.com/typeorm/typeorm/issues/6266)
* Migration issues with scale & precision in sqlite/sql.js ([#6638](https://github.com/typeorm/typeorm/issues/6638)) ([0397e44](https://github.com/typeorm/typeorm/commit/0397e44)), closes [#6636](https://github.com/typeorm/typeorm/issues/6636)
* mysql migration: make sure the indices sql which left-join be the same database ([#6426](https://github.com/typeorm/typeorm/issues/6426)) ([906d97f](https://github.com/typeorm/typeorm/commit/906d97f))
* pass `ids_` to alias builder to prevent length overflow ([#6624](https://github.com/typeorm/typeorm/issues/6624)) ([cf3ad62](https://github.com/typeorm/typeorm/commit/cf3ad62))
* pass formatOptions to Data API Client, fix extensions ([#6404](https://github.com/typeorm/typeorm/issues/6404)) ([9abab82](https://github.com/typeorm/typeorm/commit/9abab82)), closes [#1](https://github.com/typeorm/typeorm/issues/1)
* Query builder makes query with joins, without limit for inherited entities ([#6402](https://github.com/typeorm/typeorm/issues/6402)) ([874e573](https://github.com/typeorm/typeorm/commit/874e573)), closes [#6399](https://github.com/typeorm/typeorm/issues/6399)
* remove unnecessary optionality from Raw operator's columnAlias argument ([#6321](https://github.com/typeorm/typeorm/issues/6321)) ([0d99b46](https://github.com/typeorm/typeorm/commit/0d99b46))
* resolve missing decorators on shim ([#6354](https://github.com/typeorm/typeorm/issues/6354)) ([8e2d97d](https://github.com/typeorm/typeorm/commit/8e2d97d)), closes [#6093](https://github.com/typeorm/typeorm/issues/6093)
* revert fix handle URL objects as column field values ([#6145](https://github.com/typeorm/typeorm/issues/6145)) ([e073e02](https://github.com/typeorm/typeorm/commit/e073e02))
* SqlQueryRunner.hasColumn was not working ([#6146](https://github.com/typeorm/typeorm/issues/6146)) ([a595fed](https://github.com/typeorm/typeorm/commit/a595fed)), closes [#5718](https://github.com/typeorm/typeorm/issues/5718)
* support multiple `JoinColumn`s in EntitySchema ([#6397](https://github.com/typeorm/typeorm/issues/6397)) ([298a3b9](https://github.com/typeorm/typeorm/commit/298a3b9)), closes [#5444](https://github.com/typeorm/typeorm/issues/5444)
* Unnecessary migrations for fulltext indices ([#6634](https://github.com/typeorm/typeorm/issues/6634)) ([c81b405](https://github.com/typeorm/typeorm/commit/c81b405)), closes [#6633](https://github.com/typeorm/typeorm/issues/6633)
* unnecessary migrations for unsigned numeric types ([#6632](https://github.com/typeorm/typeorm/issues/6632)) ([7ddaf23](https://github.com/typeorm/typeorm/commit/7ddaf23)), closes [#2943](https://github.com/typeorm/typeorm/issues/2943) [/github.com/typeorm/typeorm/pull/6632#pullrequestreview-480932808](https://github.com//github.com/typeorm/typeorm/pull/6632/issues/pullrequestreview-480932808)
* update query deep partial TypeScript definition ([#6085](https://github.com/typeorm/typeorm/issues/6085)) ([23110d1](https://github.com/typeorm/typeorm/commit/23110d1))

### Features

* add AWS configurationOptions to aurora-data-api-pg connector ([#6106](https://github.com/typeorm/typeorm/issues/6106)) ([203f51d](https://github.com/typeorm/typeorm/commit/203f51d))
* add better-sqlite3 driver ([#6224](https://github.com/typeorm/typeorm/issues/6224)) ([2241451](https://github.com/typeorm/typeorm/commit/2241451))
* add postgres connection timeout option ([#6160](https://github.com/typeorm/typeorm/issues/6160)) ([0072149](https://github.com/typeorm/typeorm/commit/0072149))
* FileLogger accepts custom file path ([#6642](https://github.com/typeorm/typeorm/issues/6642)) ([c99ba40](https://github.com/typeorm/typeorm/commit/c99ba40)), closes [#4410](https://github.com/typeorm/typeorm/issues/4410)
* implement postgres ltree ([#6480](https://github.com/typeorm/typeorm/issues/6480)) ([43a7386](https://github.com/typeorm/typeorm/commit/43a7386)), closes [#4193](https://github.com/typeorm/typeorm/issues/4193)
* support absolute paths in migrationsDir for the CLI ([#6660](https://github.com/typeorm/typeorm/issues/6660)) ([2b5f139](https://github.com/typeorm/typeorm/commit/2b5f139))
* support cjs extension for ormconfig ([#6285](https://github.com/typeorm/typeorm/issues/6285)) ([6eeb03a](https://github.com/typeorm/typeorm/commit/6eeb03a))

## [0.2.25](https://github.com/typeorm/typeorm/compare/0.2.24...0.2.25) (2020-05-19)

### Bug Fixes

* 'in' clause case for ORACLE ([#5345](https://github.com/typeorm/typeorm/issues/5345)) ([8977365](https://github.com/typeorm/typeorm/commit/8977365))
* calling EntityManager.insert() with an empty array of entities ([#5745](https://github.com/typeorm/typeorm/issues/5745)) ([f8c52f3](https://github.com/typeorm/typeorm/commit/f8c52f3)), closes [#5734](https://github.com/typeorm/typeorm/issues/5734) [#5734](https://github.com/typeorm/typeorm/issues/5734) [#5734](https://github.com/typeorm/typeorm/issues/5734)
* columns with transformer should be normalized for update ([#5700](https://github.com/typeorm/typeorm/issues/5700)) ([4ef6b65](https://github.com/typeorm/typeorm/commit/4ef6b65)), closes [#2703](https://github.com/typeorm/typeorm/issues/2703)
* escape column comment in mysql driver ([#6056](https://github.com/typeorm/typeorm/issues/6056)) ([5fc802d](https://github.com/typeorm/typeorm/commit/5fc802d))
* expo sqlite driver disconnect() ([#6027](https://github.com/typeorm/typeorm/issues/6027)) ([61d59ca](https://github.com/typeorm/typeorm/commit/61d59ca))
* HANA - SSL options, column delta detection mechanism ([#5938](https://github.com/typeorm/typeorm/issues/5938)) ([2fd0a8a](https://github.com/typeorm/typeorm/commit/2fd0a8a))
* handle URL objects as column field values ([#5771](https://github.com/typeorm/typeorm/issues/5771)) ([50a0641](https://github.com/typeorm/typeorm/commit/50a0641)), closes [#5762](https://github.com/typeorm/typeorm/issues/5762) [#5762](https://github.com/typeorm/typeorm/issues/5762)
* insert and update query builder to handle mssql geometry column correctly ([#5947](https://github.com/typeorm/typeorm/issues/5947)) ([87cc6f4](https://github.com/typeorm/typeorm/commit/87cc6f4))
* migrations being generated for FK even if there are no changes ([#5869](https://github.com/typeorm/typeorm/issues/5869)) ([416e419](https://github.com/typeorm/typeorm/commit/416e419))
* multiple assignments to same column on UPDATE [#2651](https://github.com/typeorm/typeorm/issues/2651) ([#5598](https://github.com/typeorm/typeorm/issues/5598)) ([334e17e](https://github.com/typeorm/typeorm/commit/334e17e))
* prevent TypeError when calling bind function with sql.js 1.2.X ([#5789](https://github.com/typeorm/typeorm/issues/5789)) ([c6cbddc](https://github.com/typeorm/typeorm/commit/c6cbddc))
* prototype pollution issue ([#6096](https://github.com/typeorm/typeorm/issues/6096)) ([db9d0fa](https://github.com/typeorm/typeorm/commit/db9d0fa))
* provide a default empty array for parameters. ([#5677](https://github.com/typeorm/typeorm/issues/5677)) ([9e8a8cf](https://github.com/typeorm/typeorm/commit/9e8a8cf))
* redundant undefined parameters are not generated in migration files anymore ([#5690](https://github.com/typeorm/typeorm/issues/5690)) ([d5cde49](https://github.com/typeorm/typeorm/commit/d5cde49))
* replacing instanceof Array checks to Array.isArray because instanceof Array seems to be problematic on some platforms ([#5606](https://github.com/typeorm/typeorm/issues/5606)) ([b99b4ad](https://github.com/typeorm/typeorm/commit/b99b4ad))
* respect database from connection urls ([#5640](https://github.com/typeorm/typeorm/issues/5640)) ([ed75d59](https://github.com/typeorm/typeorm/commit/ed75d59)), closes [#2096](https://github.com/typeorm/typeorm/issues/2096)
* sha.js import ([#5728](https://github.com/typeorm/typeorm/issues/5728)) ([8c3f48a](https://github.com/typeorm/typeorm/commit/8c3f48a))
* Unknown fields are stripped from WHERE clause (issue [#3416](https://github.com/typeorm/typeorm/issues/3416)) ([#5603](https://github.com/typeorm/typeorm/issues/5603)) ([215f106](https://github.com/typeorm/typeorm/commit/215f106))
* update dependency mkdirp to 1.x ([#5748](https://github.com/typeorm/typeorm/issues/5748)) ([edeb561](https://github.com/typeorm/typeorm/commit/edeb561))
* update Entity decorator return type to ClassDecorator ([#5776](https://github.com/typeorm/typeorm/issues/5776)) ([7d8a1ca](https://github.com/typeorm/typeorm/commit/7d8a1ca))
* use an empty string enum as the type of a primary key column ([#6063](https://github.com/typeorm/typeorm/issues/6063)) ([8e0d817](https://github.com/typeorm/typeorm/commit/8e0d817)), closes [#3874](https://github.com/typeorm/typeorm/issues/3874)
* use correct typings for the result of `getUpsertedIds()` ([#5878](https://github.com/typeorm/typeorm/issues/5878)) ([2ab88c2](https://github.com/typeorm/typeorm/commit/2ab88c2))
* wrong table name parameter when not using default schema ([#5801](https://github.com/typeorm/typeorm/issues/5801)) ([327144a](https://github.com/typeorm/typeorm/commit/327144a))

### Features

* add FOR NO KEY UPDATE lock mode for postgresql ([#5971](https://github.com/typeorm/typeorm/issues/5971)) ([360122f](https://github.com/typeorm/typeorm/commit/360122f))
* add name option to view column ([#5962](https://github.com/typeorm/typeorm/issues/5962)) ([3cfcc50](https://github.com/typeorm/typeorm/commit/3cfcc50)), closes [#5708](https://github.com/typeorm/typeorm/issues/5708)
* Add soft remove and recover methods to entity ([#5854](https://github.com/typeorm/typeorm/issues/5854)) ([9d2b8e0](https://github.com/typeorm/typeorm/commit/9d2b8e0))
* added support for NOWAIT & SKIP LOCKED in Postgres ([#5927](https://github.com/typeorm/typeorm/issues/5927)) ([2c90e1c](https://github.com/typeorm/typeorm/commit/2c90e1c))
* Aurora Data API - Postgres Support ([#5651](https://github.com/typeorm/typeorm/issues/5651)) ([e584297](https://github.com/typeorm/typeorm/commit/e584297))
* aurora Data API - Support for AWS configuration options through aurora driver ([#5754](https://github.com/typeorm/typeorm/issues/5754)) ([1829f96](https://github.com/typeorm/typeorm/commit/1829f96))
* create-column, update-column, version-column column kinds now support user specified values ([#5867](https://github.com/typeorm/typeorm/issues/5867)) ([5a2eb30](https://github.com/typeorm/typeorm/commit/5a2eb30)), closes [#3271](https://github.com/typeorm/typeorm/issues/3271)
* names of extra columns for specific tree types moved to NamingStrategy ([#5737](https://github.com/typeorm/typeorm/issues/5737)) ([ec3be41](https://github.com/typeorm/typeorm/commit/ec3be41))
* PG allow providing a function for password ([#5673](https://github.com/typeorm/typeorm/issues/5673)) ([265d1ae](https://github.com/typeorm/typeorm/commit/265d1ae))
* update cli migration up and down from any to void ([#5630](https://github.com/typeorm/typeorm/issues/5630)) ([76e165d](https://github.com/typeorm/typeorm/commit/76e165d))
* UpdateResult returns affected rows in mysql ([#5628](https://github.com/typeorm/typeorm/issues/5628)) ([17f2fff](https://github.com/typeorm/typeorm/commit/17f2fff)), closes [#1308](https://github.com/typeorm/typeorm/issues/1308)

### Performance Improvements

* An optimized version of EntityMetadata#compareIds() for the common case ([#5419](https://github.com/typeorm/typeorm/issues/5419)) ([a9bdb37](https://github.com/typeorm/typeorm/commit/a9bdb37))

## [0.2.23](https://github.com/typeorm/typeorm/compare/0.2.22...0.2.23), [0.2.24](https://github.com/typeorm/typeorm/compare/0.2.23...0.2.24) (2020-02-28)

### Bug Fixes

* .synchronize() drops json column on mariadb ([#5391](https://github.com/typeorm/typeorm/issues/5391)) ([e3c78c1](https://github.com/typeorm/typeorm/commit/e3c78c1)), closes [typeorm/typeorm#3636](https://github.com/typeorm/typeorm/issues/3636)
* (base-entity) set create return type to T[] ([#5400](https://github.com/typeorm/typeorm/issues/5400)) ([ceff897](https://github.com/typeorm/typeorm/commit/ceff897))
* add the enableArithAbort option to the sql server connection option typings ([#5526](https://github.com/typeorm/typeorm/issues/5526)) ([d19dbc6](https://github.com/typeorm/typeorm/commit/d19dbc6))
* bug when default value in mssql were not updated if previous default was already set ([9fc8329](https://github.com/typeorm/typeorm/commit/9fc8329))
* change OrmUtils.mergeDeep to not merge RegExp objects ([#5182](https://github.com/typeorm/typeorm/issues/5182)) ([0f51836](https://github.com/typeorm/typeorm/commit/0f51836)), closes [#3534](https://github.com/typeorm/typeorm/issues/3534)
* fk on update should not use attributes of on delete ([2baa934](https://github.com/typeorm/typeorm/commit/2baa934))
* load typeorm-aurora-data-api-driver correctly when using webpack ([#4788](https://github.com/typeorm/typeorm/issues/4788)) ([#5302](https://github.com/typeorm/typeorm/issues/5302)) ([9da0d34](https://github.com/typeorm/typeorm/commit/9da0d34))
* not to make typeorm generate alter query on geometry column when that column was not changed ([#5525](https://github.com/typeorm/typeorm/issues/5525)) ([ee57557](https://github.com/typeorm/typeorm/commit/ee57557))
* Oracle sql expression for date column ([#5305](https://github.com/typeorm/typeorm/issues/5305)) ([40e9d3a](https://github.com/typeorm/typeorm/commit/40e9d3a)), closes [#4452](https://github.com/typeorm/typeorm/issues/4452) [#4452](https://github.com/typeorm/typeorm/issues/4452)
* refactoring instance of with Array.isArray() ([#5539](https://github.com/typeorm/typeorm/issues/5539)) ([1e1595e](https://github.com/typeorm/typeorm/commit/1e1595e))
* Return NULL when normalize default null value ([#5517](https://github.com/typeorm/typeorm/issues/5517)) ([1826b75](https://github.com/typeorm/typeorm/commit/1826b75)), closes [#5509](https://github.com/typeorm/typeorm/issues/5509)
* SAP HANA driver fixes ([#5445](https://github.com/typeorm/typeorm/issues/5445)) ([87b161f](https://github.com/typeorm/typeorm/commit/87b161f))
* update foreign keys when table name changes ([#5482](https://github.com/typeorm/typeorm/issues/5482)) ([7157cb3](https://github.com/typeorm/typeorm/commit/7157cb3))
* use OUTPUT INTO on SqlServer for returning columns ([#5361](https://github.com/typeorm/typeorm/issues/5361)) ([6bac3ca](https://github.com/typeorm/typeorm/commit/6bac3ca)), closes [#5160](https://github.com/typeorm/typeorm/issues/5160) [#5160](https://github.com/typeorm/typeorm/issues/5160)
* use sha.js instead of crypto for hash calculation ([#5270](https://github.com/typeorm/typeorm/issues/5270)) ([b380a7f](https://github.com/typeorm/typeorm/commit/b380a7f))

### Features

* Add basic support for custom cache providers ([#5309](https://github.com/typeorm/typeorm/issues/5309)) ([6c6bde7](https://github.com/typeorm/typeorm/commit/6c6bde7))
* add fulltext parser option ([#5380](https://github.com/typeorm/typeorm/issues/5380)) ([dd73395](https://github.com/typeorm/typeorm/commit/dd73395))

## [0.2.22](https://github.com/typeorm/typeorm/compare/0.2.21...0.2.22) (2019-12-23)

### Bug Fixes

* use a prefix on SelectQueryBuilder internal parameters ([#5178](https://github.com/typeorm/typeorm/issues/5178)) ([cacb08b](https://github.com/typeorm/typeorm/commit/cacb08b)), closes [#5174](https://github.com/typeorm/typeorm/issues/5174) [#5174](https://github.com/typeorm/typeorm/issues/5174)

### Features

* hash aliases to avoid conflicts ([#5227](https://github.com/typeorm/typeorm/issues/5227)) ([edc8e6d](https://github.com/typeorm/typeorm/commit/edc8e6d))
* implement driver options for NativeScript ([#5217](https://github.com/typeorm/typeorm/issues/5217)) ([3e58426](https://github.com/typeorm/typeorm/commit/3e58426))
* SAP Hana support ([#5246](https://github.com/typeorm/typeorm/issues/5246)) ([ec90341](https://github.com/typeorm/typeorm/commit/ec90341))
* speed ​​up id search in buildChildrenEntityTree ([#5202](https://github.com/typeorm/typeorm/issues/5202)) ([2e628c3](https://github.com/typeorm/typeorm/commit/2e628c3))

### BREAKING CHANGES

* aliases for very long relation names may be replaced with hashed strings.
    Fix: avoid collisions by using longest possible hash.
    Retain more entropy by not using only 8 characters of hashed aliases.

## [0.2.21](https://github.com/typeorm/typeorm/compare/0.2.20...0.2.21) (2019-12-05)


### Bug Fixes

* allow expireAfterSeconds 0 in Index decorator (close [#5004](https://github.com/typeorm/typeorm/issues/5004)) ([#5005](https://github.com/typeorm/typeorm/issues/5005)) ([d05467c](https://github.com/typeorm/typeorm/commit/d05467c))
* do not mutate connection options ([#5078](https://github.com/typeorm/typeorm/issues/5078)) ([1047989](https://github.com/typeorm/typeorm/commit/1047989))
* mysql driver query streaming ([#5036](https://github.com/typeorm/typeorm/issues/5036)) ([aff2f56](https://github.com/typeorm/typeorm/commit/aff2f56))
* remove consrc usage (postgres,cockroachdb) ([#4333](https://github.com/typeorm/typeorm/issues/4333)) ([ce7cb16](https://github.com/typeorm/typeorm/commit/ce7cb16)), closes [#4332](https://github.com/typeorm/typeorm/issues/4332)
* repo for app-root-path in lock file ([#5052](https://github.com/typeorm/typeorm/issues/5052)) ([f0fd192](https://github.com/typeorm/typeorm/commit/f0fd192))
* resolve MySQL unique index check when bigNumberStrings is false ([#4822](https://github.com/typeorm/typeorm/issues/4822)) ([d205574](https://github.com/typeorm/typeorm/commit/d205574)), closes [#2737](https://github.com/typeorm/typeorm/issues/2737)
* resolve sorting bug for several mongo vesions with typeorm migration ([#5121](https://github.com/typeorm/typeorm/issues/5121)) ([cb771a1](https://github.com/typeorm/typeorm/commit/cb771a1)), closes [#5115](https://github.com/typeorm/typeorm/issues/5115)
* throwing error on duplicate migration names [#4701](https://github.com/typeorm/typeorm/issues/4701) ([#4704](https://github.com/typeorm/typeorm/issues/4704)) ([3e4dc9f](https://github.com/typeorm/typeorm/commit/3e4dc9f))
* unescaped column name in order clause of "migrations" ([#5108](https://github.com/typeorm/typeorm/issues/5108)) ([c0c8566](https://github.com/typeorm/typeorm/commit/c0c8566))
* upgrade app-root-path ([#5023](https://github.com/typeorm/typeorm/issues/5023)) ([7f87f0c](https://github.com/typeorm/typeorm/commit/7f87f0c))


### Features

* add distinct on() support for postgres ([#4954](https://github.com/typeorm/typeorm/issues/4954)) ([1293065](https://github.com/typeorm/typeorm/commit/1293065))
* add migrations transaction option to connection options ([#5147](https://github.com/typeorm/typeorm/issues/5147)) ([fb60688](https://github.com/typeorm/typeorm/commit/fb60688)), closes [#4629](https://github.com/typeorm/typeorm/issues/4629) [#4629](https://github.com/typeorm/typeorm/issues/4629)
* asynchronous ormconfig support ([#5048](https://github.com/typeorm/typeorm/issues/5048)) ([f9fdaee](https://github.com/typeorm/typeorm/commit/f9fdaee)), closes [#4149](https://github.com/typeorm/typeorm/issues/4149)
* export Migration Execution API from main package (fixes [#4880](https://github.com/typeorm/typeorm/issues/4880)) ([#4892](https://github.com/typeorm/typeorm/issues/4892)) ([8f4f908](https://github.com/typeorm/typeorm/commit/8f4f908))
* support spatial types of MySQL 8+ ([#4794](https://github.com/typeorm/typeorm/issues/4794)) ([231dadf](https://github.com/typeorm/typeorm/commit/231dadf)), closes [#3702](https://github.com/typeorm/typeorm/issues/3702)

## [0.2.20](https://github.com/typeorm/typeorm/compare/0.2.19...0.2.20) (2019-10-18)

### Bug Fixes

* ensure distinct property is respected cloning query builder ([#4843](https://github.com/typeorm/typeorm/issues/4843)) ([ea17094](https://github.com/typeorm/typeorm/commit/ea17094)), closes [#4842](https://github.com/typeorm/typeorm/issues/4842)
* **aurora:** apply mysql query fixes to aurora ([#4779](https://github.com/typeorm/typeorm/issues/4779)) ([ee61c51](https://github.com/typeorm/typeorm/commit/ee61c51))
* allow EntitySchema to be passed to EntityRepository ([#4884](https://github.com/typeorm/typeorm/issues/4884)) ([652a20e](https://github.com/typeorm/typeorm/commit/652a20e))
* better timestamp comparison ([#4769](https://github.com/typeorm/typeorm/issues/4769)) ([0a13e6a](https://github.com/typeorm/typeorm/commit/0a13e6a))
* broken database option when using replication, changes introduced by [#4753](https://github.com/typeorm/typeorm/issues/4753) ([#4826](https://github.com/typeorm/typeorm/issues/4826)) ([df5479b](https://github.com/typeorm/typeorm/commit/df5479b))
* check for version of MariaDB before extracting COLUMN_DEFAULT ([#4783](https://github.com/typeorm/typeorm/issues/4783)) ([c30b485](https://github.com/typeorm/typeorm/commit/c30b485))
* connection Reuse is broken in a Lambda environment: ([#4804](https://github.com/typeorm/typeorm/issues/4804)) ([7962036](https://github.com/typeorm/typeorm/commit/7962036))
* FindOptionUtils export ([#4746](https://github.com/typeorm/typeorm/issues/4746)) ([4a62b1c](https://github.com/typeorm/typeorm/commit/4a62b1c)), closes [#4745](https://github.com/typeorm/typeorm/issues/4745)
* loading of aurora-data-api driver ([#4765](https://github.com/typeorm/typeorm/issues/4765)) ([fbb8947](https://github.com/typeorm/typeorm/commit/fbb8947))
* **postgres:** postgres query runner to create materialized view ([#4877](https://github.com/typeorm/typeorm/issues/4877)) ([d744966](https://github.com/typeorm/typeorm/commit/d744966))
* migrations run in reverse order for mongodb ([#4702](https://github.com/typeorm/typeorm/issues/4702)) ([2f27581](https://github.com/typeorm/typeorm/commit/2f27581))
* mongodb Cursor.forEach types ([#4759](https://github.com/typeorm/typeorm/issues/4759)) ([fccbe3e](https://github.com/typeorm/typeorm/commit/fccbe3e))
* Slack invite URL ([#4836](https://github.com/typeorm/typeorm/issues/4836)) ([149af26](https://github.com/typeorm/typeorm/commit/149af26))


### Features

* add name to MigrationInterface (fixes [#3933](https://github.com/typeorm/typeorm/issues/3933) and fixes [#2549](https://github.com/typeorm/typeorm/issues/2549)) ([#4873](https://github.com/typeorm/typeorm/issues/4873)) ([4a73fde](https://github.com/typeorm/typeorm/commit/4a73fde))
* add new transaction mode to wrap each migration in transaction ([#4629](https://github.com/typeorm/typeorm/issues/4629)) ([848fb1f](https://github.com/typeorm/typeorm/commit/848fb1f))
* add option to Column to specify the complete enumName ([#4824](https://github.com/typeorm/typeorm/issues/4824)) ([d967180](https://github.com/typeorm/typeorm/commit/d967180))
* add support for cube array for PostgreSQL ([#4848](https://github.com/typeorm/typeorm/issues/4848)) ([154a441](https://github.com/typeorm/typeorm/commit/154a441))
* implements Sqlite 'WITHOUT ROWID' table modifier ([#4688](https://github.com/typeorm/typeorm/issues/4688)) ([c1342ad](https://github.com/typeorm/typeorm/commit/c1342ad)), closes [#3330](https://github.com/typeorm/typeorm/issues/3330)

## [0.2.19](https://github.com/typeorm/typeorm/compare/0.2.18...0.2.19) (2019-09-13)

### Bug Fixes

* "database" option error in driver when use "url" option for connection ([690e6f5](https://github.com/typeorm/typeorm/commit/690e6f5))
* "hstore injection" & properly handle NULL, empty string, backslashes & quotes in hstore key/value pairs ([#4720](https://github.com/typeorm/typeorm/issues/4720)) ([3abe5b9](https://github.com/typeorm/typeorm/commit/3abe5b9))
* add SaveOptions and RemoveOptions into ActiveRecord ([#4318](https://github.com/typeorm/typeorm/issues/4318)) ([a6d7ba2](https://github.com/typeorm/typeorm/commit/a6d7ba2))
* apostrophe in Postgres enum strings breaks query ([#4631](https://github.com/typeorm/typeorm/issues/4631)) ([445c740](https://github.com/typeorm/typeorm/commit/445c740))
* change PrimaryColumn decorator to clone passed options ([#4571](https://github.com/typeorm/typeorm/issues/4571)) ([3cf470d](https://github.com/typeorm/typeorm/commit/3cf470d)), closes [#4570](https://github.com/typeorm/typeorm/issues/4570)
* createQueryBuilder relation remove works only if using ID ([#2632](https://github.com/typeorm/typeorm/issues/2632)) ([#4734](https://github.com/typeorm/typeorm/issues/4734)) ([1d73a90](https://github.com/typeorm/typeorm/commit/1d73a90))
* resolve issue with conversion string to simple-json ([#4476](https://github.com/typeorm/typeorm/issues/4476)) ([d1594f5](https://github.com/typeorm/typeorm/commit/d1594f5)), closes [#4440](https://github.com/typeorm/typeorm/issues/4440)
* sqlite connections don't ignore the schema property ([#4599](https://github.com/typeorm/typeorm/issues/4599)) ([d8f1c81](https://github.com/typeorm/typeorm/commit/d8f1c81))
* the excessive stack depth comparing types `FindConditions<?>` and `FindConditions<?>` problem ([#4470](https://github.com/typeorm/typeorm/issues/4470)) ([7a0beed](https://github.com/typeorm/typeorm/commit/7a0beed))
* views generating broken Migrations ([#4726](https://github.com/typeorm/typeorm/issues/4726)) ([c52b3d2](https://github.com/typeorm/typeorm/commit/c52b3d2)), closes [#4123](https://github.com/typeorm/typeorm/issues/4123)


### Features

* add `set` datatype support for MySQL/MariaDB ([#4538](https://github.com/typeorm/typeorm/issues/4538)) ([19e2179](https://github.com/typeorm/typeorm/commit/19e2179)), closes [#2779](https://github.com/typeorm/typeorm/issues/2779)
* add materialized View support for Postgres ([#4478](https://github.com/typeorm/typeorm/issues/4478)) ([dacac83](https://github.com/typeorm/typeorm/commit/dacac83)), closes [#4317](https://github.com/typeorm/typeorm/issues/4317) [#3996](https://github.com/typeorm/typeorm/issues/3996)
* add mongodb `useUnifiedTopology` config parameter ([#4684](https://github.com/typeorm/typeorm/issues/4684)) ([92e4270](https://github.com/typeorm/typeorm/commit/92e4270))
* add multi-dimensional cube support for PostgreSQL ([#4378](https://github.com/typeorm/typeorm/issues/4378)) ([b6d6278](https://github.com/typeorm/typeorm/commit/b6d6278))
* add options to input init config for sql.js ([#4560](https://github.com/typeorm/typeorm/issues/4560)) ([5c311ed](https://github.com/typeorm/typeorm/commit/5c311ed))
* add postgres pool error handler ([#4474](https://github.com/typeorm/typeorm/issues/4474)) ([a925be9](https://github.com/typeorm/typeorm/commit/a925be9))
* add referenced table metadata to NamingStrategy to resolve foreign key name ([#4274](https://github.com/typeorm/typeorm/issues/4274)) ([0094f61](https://github.com/typeorm/typeorm/commit/0094f61)), closes [#3847](https://github.com/typeorm/typeorm/issues/3847) [#1355](https://github.com/typeorm/typeorm/issues/1355)
* add support for ON CONFLICT for cockroach ([#4518](https://github.com/typeorm/typeorm/issues/4518)) ([db8074a](https://github.com/typeorm/typeorm/commit/db8074a)), closes [#4513](https://github.com/typeorm/typeorm/issues/4513)
* Added support for DISTINCT queries ([#4109](https://github.com/typeorm/typeorm/issues/4109)) ([39a8e34](https://github.com/typeorm/typeorm/commit/39a8e34))
* Aurora Data API ([#4375](https://github.com/typeorm/typeorm/issues/4375)) ([c321562](https://github.com/typeorm/typeorm/commit/c321562))
* export additional schema builder classes ([#4325](https://github.com/typeorm/typeorm/issues/4325)) ([e589fda](https://github.com/typeorm/typeorm/commit/e589fda))
* log files loaded from glob patterns ([#4346](https://github.com/typeorm/typeorm/issues/4346)) ([e12479e](https://github.com/typeorm/typeorm/commit/e12479e)), closes [#4162](https://github.com/typeorm/typeorm/issues/4162)
* UpdateResult returns affected rows in postgresql ([#4432](https://github.com/typeorm/typeorm/issues/4432)) ([7808bba](https://github.com/typeorm/typeorm/commit/7808bba)), closes [#1308](https://github.com/typeorm/typeorm/issues/1308)

## 0.2.18

### Bug fixes

* fixed loadRelationCountAndMap when entities' primary keys are strings ([#3946](https://github.com/typeorm/typeorm/issues/3946))
* fixed QueryExpressionMap not cloning all values correctly ([#4156](https://github.com/typeorm/typeorm/issues/4156))
* fixed transform embeddeds with no columns but with nested embeddeds (mongodb) ([#4131](https://github.com/typeorm/typeorm/pull/4131))
* fixed the getMany() result being droped randomly bug when using the buffer as primary key. ([#4220](https://github.com/typeorm/typeorm/issues/4220))

### Features

* adds `typeorm migration:show` command ([#4173](https://github.com/typeorm/typeorm/pull/4173))
* deprecate column `readonly` option in favor of `update` and `insert` options ([#4035](https://github.com/typeorm/typeorm/pull/4035))
* support sql.js v1.0 ([#4104](https://github.com/typeorm/typeorm/issues/4104))
* added support for `orUpdate` in SQLlite ([#4097](https://github.com/typeorm/typeorm/pull/4097))
* added support for `dirty_read` (NOLOCK) in SQLServer ([#4133](https://github.com/typeorm/typeorm/pull/4133))
* extend afterLoad() subscriber interface to take LoadEvent ([issue #4185](https://github.com/typeorm/typeorm/issues/4185))
* relation decorators (e.g. `@OneToMany`) now also accept `string` instead of `typeFunction`, which prevents circular dependency issues in the frontend/browser ([issue #4190](https://github.com/typeorm/typeorm/issues/4190))
* added support for metadata reflection in typeorm-class-transformer-shim.js ([issue #4219](https://github.com/typeorm/typeorm/issues/4219))
* added `sqlJsConfig` to input config when initializing sql.js ([issue #4559](https://github.com/typeorm/typeorm/issues/4559))

## 0.2.17 (2019-05-01)

### Bug fixes

* fixed transform embeddeds with boolean values (mongodb) ([#3900](https://github.com/typeorm/typeorm/pull/3900))
* fixed issue with schema inheritance in STI pattern ([#3957](https://github.com/typeorm/typeorm/issues/3957))
* revert changes from [#3814](https://github.com/typeorm/typeorm/pull/3814) ([#3828](https://github.com/typeorm/typeorm/pull/3828))
* fix performance issue when inserting into raw tables with QueryBuilder
  ([#3931](https://github.com/typeorm/typeorm/issues/3931))
* sqlite date hydration is susceptible to corruption ([#3949](https://github.com/typeorm/typeorm/issues/3949))
* fixed mongodb uniques, support 3 ways to define uniques ([#3986](https://github.com/typeorm/typeorm/pull/3986))
* fixed mongodb TTL index ([#4044](https://github.com/typeorm/typeorm/pull/4044))

### Features

* added deferrable options for foreign keys (postgres) ([#2191](https://github.com/typeorm/typeorm/issues/2191))
* added View entity implementation ([#1024](https://github.com/typeorm/typeorm/issues/1024)). Read more at [View entities](https://typeorm.io/#/view-entities)
* added multiple value transformer support ([#4007](https://github.com/typeorm/typeorm/issues/4007))

## 0.2.16 (2019-03-26)

### Bug fixes

* removed unused parameters from `insert`, `update`, `delete` methods ([#3888](https://github.com/typeorm/typeorm/pull/3888))
* fixed: migration generator produces duplicated changes ([#1960](https://github.com/typeorm/typeorm/issues/1960))
* fixed: unique constraint not created on embedded entity field ([#3142](https://github.com/typeorm/typeorm/issues/3142))
* fixed: FK columns have wrong length when PrimaryGeneratedColumn('uuid') is used ([#3604](https://github.com/typeorm/typeorm/issues/3604))
* fixed: column option unique sqlite error ([#3803](https://github.com/typeorm/typeorm/issues/3803))
* fixed: 'uuid' in PrimaryGeneratedColumn causes Many-to-Many Relationship to Fail ([#3151](https://github.com/typeorm/typeorm/issues/3151))
* fixed: sync enums on schema sync ([#3694](https://github.com/typeorm/typeorm/issues/3694))
* fixed: changes in enum type is not reflected when generating migration (in definition file) ([#3244](https://github.com/typeorm/typeorm/issues/3244))
* fixed: migration will keep create and drop indexes if index name is the same across tables ([#3379](https://github.com/typeorm/typeorm/issues/3379))

### Features

* added `lock` option in `FindOptions`

## 0.2.15 (2019-03-14)

### Bug fixes

* fixed bug in `connection.dropDatabase` method ([#1414](https://github.com/typeorm/typeorm/pull/3727))
* fixed "deep relations" not loaded/mapped due to the built-in max length of Postgres ([#3118](https://github.com/typeorm/typeorm/issues/3118))
* updated all dependencies
* fixed types issue from [#3725](https://github.com/typeorm/typeorm/issues/3725)
* removed sql-function-support (`() => ` syntax) in parameters to prevent security considerations
* fix sync schema issue with postgres enum in case capital letters in entity name ([#3536](https://github.com/typeorm/typeorm/issues/3536))

### Features

* added `uuidExtension` option to Postgres connection options, which allows TypeORM to use the newer `pgcrypto` extension to generate UUIDs

## 0.2.14 (2019-02-25)

### Bug fixes

* fixed migration issue with postgres numeric enum type - change queries are not generated if enum is not modified ([#3587](https://github.com/typeorm/typeorm/issues/3587))
* fixed mongodb entity listeners in optional embeddeds ([#3450](https://github.com/typeorm/typeorm/issues/3450))
* fixes returning invalid delete result
* reverted lazy loading properties not enumerable feature to fix related bugs

### Features

* added CockroachDB support
* added browser entry point to `package.json` ([3583](https://github.com/typeorm/typeorm/issues/3583))
* replaced backend-only drivers by dummy driver in browser builds
* added `useLocalForage` option to Sql.js connection options, which enables asynchronous load and save operations of the datatbase from the indexedDB ([#3554](https://github.com/typeorm/typeorm/issues/3554))
* added simple-enum column type ([#1414](https://github.com/typeorm/typeorm/issues/1414))

## 0.2.13 (2019-02-10)

### Bug Fixes

* fixed undefined object id field in case property name is `_id` ([3517](https://github.com/typeorm/typeorm/issues/3517))
* allow to use mongodb index options in `Index` decorator ([#3592](https://github.com/typeorm/typeorm/pull/3592))
* fixed entity embeddeds indices in mongodb ([#3585](https://github.com/typeorm/typeorm/pull/3585))
* fixed json/jsonb column data types comparison ([#3496](https://github.com/typeorm/typeorm/issues/3496))
* fixed increment/decrement value of embedded entity ([#3182](https://github.com/typeorm/typeorm/issues/3182))
* fixed missing call `transformer.from()` in case column is NULL ([#3395](https://github.com/typeorm/typeorm/issues/3395))
* fixed signatures of `update`/`insert` methods, some `find*` methods in repositories, entity managers, BaseEntity and QueryBuilders
* handle embedded documents through multiple levels in mongodb ([#3551](https://github.com/typeorm/typeorm/issues/3551))
* fixed hanging connections in `mssql` driver ([#3327](https://github.com/typeorm/typeorm/pull/3327))

### Features

* Injection 2nd parameter(options) of constructor to `ioredis/cluster` is now possible([#3538](https://github.com/typeorm/typeorm/issues/3538))

## 0.2.12 (2019-01-20)

### Bug Fixes

* fixed mongodb entity listeners and subscribers ([#1527](https://github.com/typeorm/typeorm/issues/1527))
* fixed connection options builder - paramters parsed from url are assigned on top of options ([#3442](https://github.com/typeorm/typeorm/pull/3442))
* fixed issue with logical operator precedence in `QueryBuilder` `whereInIds` ([#2103](https://github.com/typeorm/typeorm/issues/2103))
* fixed missing `isolationLevel` in `Connection.transaction()` method ([#3363](https://github.com/typeorm/typeorm/issues/3363))
* fixed broken findOne method with custom join column name
* fixed issue with uuid in mysql ([#3374](https://github.com/typeorm/typeorm/issues/3374))
* fixed missing export of `Exclusion` decorator
* fixed ignored extra options in mongodb driver ([#3403](https://github.com/typeorm/typeorm/pull/3403), [#1741](https://github.com/typeorm/typeorm/issues/1741))
* fixed signature of root `getRepository` function to accept `EntitySchema<Entity>` ([#3402](https://github.com/typeorm/typeorm/pull/3402))
* fixed false undefined connection options passed into mongodb client ([#3366](https://github.com/typeorm/typeorm/pull/3366))
* fixed ER_DUP_FIELDNAME with simple find ([#3350](https://github.com/typeorm/typeorm/issues/3350))

### Features

* added `tslib` to reduce package size ([#3457](https://github.com/typeorm/typeorm/issues/3457), [#3458](https://github.com/typeorm/typeorm/pull/3458))
* queries are simplified in `findByIds` and `whereInIds` for simple entities with single primary key ([#3431](https://github.com/typeorm/typeorm/pull/3431))
* added `ioredis` and `ioredis-cluster` cache support ([#3289](https://github.com/typeorm/typeorm/pull/3289),[#3364](https://github.com/typeorm/typeorm/pull/3364))
* added `LessThanOrEqual` and `MoreThanOrEqual` find options ([#3373](https://github.com/typeorm/typeorm/pull/3373))
* improve support of string, numeric and heterogeneous enums in postgres and mysql ([#3414](https://github.com/typeorm/typeorm/pull/3414))
* default value of enum array in postgres is now possible define as typescript array ([#3414](https://github.com/typeorm/typeorm/pull/3414))
```typescript
@Column({
    type: "enum",
    enum: StringEnum,
    array: true,
    default: [StringEnum.ADMIN]
})
stringEnums: StringEnum[];
```

### Breaking changes

* `UpdateQueryBuilder` now throw error if update values are not provided or unknown property is passed into `.set()` method ([#2849](https://github.com/typeorm/typeorm/issues/2849),[#3324](https://github.com/typeorm/typeorm/pull/3324))


## 0.2.11

* hot fix for mysql schema sync bug

## 0.2.10

* allowed caching options from environment variable (#3321)
* more accurate type for postgres ssl parameters
* added support for `ON UPDATE CASCADE` relations for mysql
* `repository.save` returns union type
* added reuse of lazy relationships
* added ability to disable prefixes for embedded columns
* migrations can be tested
* migration run returns array of successful migrations
* added debug ENV option
* added support for postgres exclusion constraints
* bug fixes
* documentation updates
* fixed issue with mysql primary generated uuid ER_TOO_LONG_KEY (#1139)

## 0.2.9

* `UpdateEvent` now returns with contains `updatedColumns` and `updatedRelations`

## 0.2.8

* added support for specifying isolation levels in transactions
* added SQLCipher connection option for sqlite
* added driver to support Expo platform for sqlite
* added support for nativescript
* bug fixes
* documentation updates

## 0.2.7

* added support for rowversion type for mssql (#2198)

## 0.2.6

* fixed wrong aggregate and count methods signature in mongodb

## 0.2.5

* added support for enum arrays in postgres
* fixed issue with lazy relations (#1953)
* fixed issue with migration file generator using a wrong class name (#2070)
* fixed issue with unhandled promise rejection warning on postgres connection (#2067)

## 0.2.4

* fixed bug with relation id loader queries not working with self-referencing relations
* fixed issues with zerofill and unsigned options not available in column options (#2049)
* fixed issue with lazy relation loader (#2029)
* fixed issue with closure table not properly escaped when using custom schema (#2043)
* fixed issue #2053

## 0.2.3

* fixed bug with selecting default values after persistence when initialized properties defined
* fixed bug with find operators used on relational columns (#2031)
* fixed bug with DEFAULT as functions in mssql (#1991)

## 0.2.2

* fixing bugs with STI
* fixed bug in mysql schema synchronization

## 0.2.1

* fixed bug with STI
* fixed bug with lazy relations inside transactions

## 0.2.0

* completely refactored, improved and optimized persistence process and performance.
* removed cascade remove functionality, refactored how cascades are working.
* removed `cascadeRemove` option from relation options.
* replaced `cascadeAll` with `cascade: true` syntax from relation options.
* replaced `cascadeInsert` with `cascade: ["insert"]` syntax from relation options.
* replaced `cascadeUpdate` with `cascade: ["update"]` syntax from relation options.
* now when one-to-one or many-to-one relation is loaded and its not set (set to null) ORM returns you entity with relation set to `null` instead of `undefined property` as before.
* now relation id can be set directly to relation, e.g. `Post { @ManyToOne(type => Tag) tag: Tag|number }` with `post.tag = 1` usage.
* now you can disable persistence on any relation by setting `@OneToMany(type => Post, post => tag, { persistence: false })`. This can dramatically improve entity save performance.
* `loadAllRelationIds` method of `QueryBuilder` now accepts list of relation paths that needs to be loaded, also `disableMixedMap` option is now by default set to false, but you can enable it via new method parameter `options`
* now `returning` and `output` statements of `InsertQueryBuilder` support array of columns as argument
* now when many-to-many and one-to-many relation set to `null` all items from that relation are removed, just like it would be set to empty array
* fixed issues with relation update from one-to-one non-owner side
* now version column is updated on the database level, not by ORM anymore
* now created date and update date columns is set on the database level, not by ORM anymore (e.g. using `CURRENT_TIMESTAMP` as a default value)
* now `InsertQueryBuilder`, `UpdateQueryBuilder` and `DeleteQueryBuilder` automatically update entities after execution.
This only happens if real entity objects are passed.
Some databases (like mysql and sqlite) requires a separate query to perform this operation.
If you want to disable this behavior use `queryBuilder.updateEntity(false)` method.
This feature is convenient for users who have uuid, create/update date, version columns or columns with DEFAULT value set.
* now `InsertQueryBuilder`, `UpdateQueryBuilder` and `DeleteQueryBuilder` call subscribers and listeners.
You can disable this behavior by setting `queryBuilder.callListeners(false)` method.
* `Repository` and `EntityManager` method `.findOneById` is deprecated and will be removed in next 0.3.0 version.
Use `findOne(id)` method instead now.
* `InsertQueryBuilder` now returns `InsertResult` which contains extended information and metadata about runned query
* `UpdateQueryBuilder` now returns `UpdateResult` which contains extended information and metadata about runned query
* `DeleteQueryBuilder` now returns `DeleteResult` which contains extended information and metadata about runned query
* now insert / update / delete queries built with QueryBuilder can be wrapped into a transaction using `useTransaction(true)` method of the QueryBuilder.
* `insert`, `update` and `delete` methods of `QueryRunner` now use `InsertQueryRunner`, `UpdateQueryRunner` and `DeleteQueryRunner` inside
* removed deprecated `removeById`, `removeByIds` methods
* removed `deleteById` method - use `delete(id)` method instead now
* removed `updateById` method - use `update(id)` method instead now
* changed `snakeCase` utility - check table names after upgrading
* added ability to disable transaction in `save` and `remove` operations
* added ability to disable listeners and subscribers in `save` and `remove` operations
* added ability to save and remove objects in chunks
* added ability to disable entity reloading after insertion and updation
* class table inheritance functionality has been completely dropped
* single table inheritance functionality has been fixed
* `@SingleEntityChild` has been renamed to `@ChildEntity`
* `@DiscriminatorValue` has been removed, instead parameter in `@ChildEntity` must be used, e.g. `@ChildEntity("value")`
* `@DiscriminatorColumn` decorator has been removed, use `@TableInheritance` options instead now
* `skipSync` in entity options has been renamed to `synchronize`. Now if it set to false schema synchronization for the entity will be disabled.
By default its true.
* now array initializations for relations are forbidden and ORM throws an error if there are entities with initialized relation arrays.
* `@ClosureEntity` decorator has been removed. Instead `@Entity` + `@Tree("closure-table")` must be used
* added support for nested set and materialized path tree hierarchy patterns
* breaking change on how array parameters work in queries - now instead of (:param) new syntax must be used (:...param).
This fixed various issues on how real arrays must work
* changed the way how entity schemas are created (now more type-safe), now interface EntitySchema is a class
* added `@Unique` decorator. Accepts custom unique constraint name and columns to be unique. Used only on as
composite unique constraint, on table level. E.g. `@Unique("uq_id_name", ["id", "name"])`
* added `@Check` decorator. Accepts custom check constraint name and expression. Used only on as
composite check constraint, on table level. E.g. `@Check("chk_name", "name <> 'asd'")`
* fixed `Oracle` issues, now it will be fully maintained as other drivers
* implemented migrations functionality in all drivers
* CLI commands changed from `migrations:create`, `migrations:generate`, `migrations:revert` and `migrations:run` to `migration:create`, `migration:generate`, `migration:revert` and `migration:run`
* changed the way how migrations work (more info in #1315). Now migration table contains `id` column with auto-generated keys, you need to re-create migrations table or add new column manually.
* entity schemas syntax was changed
* dropped support for WebSql and SystemJS
* `@Index` decorator now accepts `synchronize` option. This option need to avoid deleting custom indices which is not created by TypeORM
* new flag in relation options was introduced: `{ persistence: false }`. You can use it to prevent any extra queries for relations checks
* added support for `UNSIGNED` and `ZEROFILL` column attributes in MySQL
* added support for generated columns in MySQL
* added support for `ON UPDATE` column option in MySQL
* added `SPATIAL` and `FULLTEXT` index options in MySQL
* added `hstore` and `enum` column types support in Postgres
* added range types support in Postgres
* TypeORM now uses `{ "supportBigNumbers": true, "bigNumberStrings": true }` options by default for `node-mysql`
* Integer data types in MySQL now accepts `width` option instead of `length`
* junction tables now have `onDelete: "CASCADE"` attribute on their foreign keys
* `ancestor` and `descendant` columns in ClosureTable marked as primary keys
* unique index now will be created for the join columns in `ManyToOne` and `OneToOne` relations

## 0.1.19

* fixed bug in InsertQueryBuilder

## 0.1.18

* fixed timestamp issues

## 0.1.17

* fixed issue with entity order by applied to update query builder

## 0.1.16

* security and bug fixes

## 0.1.15

* security and bug fixes

## 0.1.14

* optimized hydration performance ([#1672](https://github.com/typeorm/typeorm/pull/1672))

## 0.1.13

* added simple-json column type ([#1448](https://github.com/typeorm/typeorm/pull/1488))
* fixed transform behaviour for timestamp columns ([#1140](https://github.com/typeorm/typeorm/issues/1140))
* fixed issue with multi-level relations loading ([#1504](https://github.com/typeorm/typeorm/issues/1504))

## 0.1.12

* EntitySubscriber now fires events on subclass entity ([#1369](https://github.com/typeorm/typeorm/issues/1369))
* fixed error with entity schema validator being async  ([#1448](https://github.com/typeorm/typeorm/issues/1448))

## 0.1.11

* postgres extensions now gracefully handled when user does not have rights to use them ([#1407](https://github.com/typeorm/typeorm/issues/1407))

## 0.1.10

* `sqljs` driver now enforces FK integrity by default (same behavior as `sqlite`)
* fixed issue that broke browser support in 0.1.8 because of the debug package ([#1344](https://github.com/typeorm/typeorm/pull/1344))

## 0.1.9

* fixed bug with sqlite and mysql schema synchronization when uuid column is used ([#1332](https://github.com/typeorm/typeorm/issues/1332))

## 0.1.8

* New DebugLogger ([#1302](https://github.com/typeorm/typeorm/pull/1302))
* fixed issue with primary relations being nullable by default - now they are not nullable always
* fixed issue with multiple databases support when tables with same name are used across multiple databases

## 0.1.7

* fixed bug with migrations execution in mssql ([#1254](https://github.com/typeorm/typeorm/issues/1254))
* added support for more complex ordering in paginated results ([#1259](https://github.com/typeorm/typeorm/issues/1259))
* MSSQL users are required to add "order by" for skip/offset operations since mssql does not support OFFSET/LIMIT statement without order by applied
* fixed issue when relation query builder methods execute operations with empty arrays ([#1241](https://github.com/typeorm/typeorm/issues/1241))
* Webpack can now be used for node projects and not only for browser projects. To use TypeORM in Ionic with minimal changes checkout the [ionic-example](https://github.com/typeorm/ionic-example#typeorm--017) for the needed changes. To use webpack for non-Ionic browser webpack projects, the needed configuration can be found in the [docs]( http://typeorm.io/#/supported-platforms) ([#1280](https://github.com/typeorm/typeorm/pulls/1280))
* added support for loading sub-relations in via find options ([#1270](https://github.com/typeorm/typeorm/issues/1270))

## 0.1.6

* added support for indices and listeners in embeddeds
* added support for `ON CONFLICT` keyword
* fixed bug with query builder where lazy relations are loaded multiple times when using `leftJoinAndSelect` ([#996](https://github.com/typeorm/typeorm/issues/996))
* fixed bug in all sqlite based drivers that generated wrong uuid columns ([#1128](https://github.com/typeorm/typeorm/issues/1128) and [#1161](https://github.com/typeorm/typeorm/issues/1161))

## 0.1.5

* fixed bug where `findByIds` would return values with an empty array ([#1118](https://github.com/typeorm/typeorm/issues/1118))
* fixed bug in MigrationExecutor that didn't release created query builder ([#1201](https://github.com/typeorm/typeorm/issues/1201))

## 0.1.4

* fixed bug in mysql driver that generated wrong query when using skip ([#1099](https://github.com/typeorm/typeorm/issues/1099))
* added option to create query builder from repository without alias([#1084](https://github.com/typeorm/typeorm/issues/1084))
* fixed bug that made column option "select" unusable ([#1110](https://github.com/typeorm/typeorm/issues/1110))
* fixed bug that generated mongodb projects what don't work ([#1119](https://github.com/typeorm/typeorm/issues/1119))

## 0.1.3

* added support for `sql.js`. To use it you just need to install `npm i sql.js` and use `sqljs` as driver type ([#894](https://github.com/typeorm/typeorm/pull/894)).
* added explicit require() statements for drivers ([#1143](https://github.com/typeorm/typeorm/pull/1143))
* fixed bug where wrong query is generated with multiple primary keys ([#1146](https://github.com/typeorm/typeorm/pull/1146))
* fixed bug for oracle driver where connect method was wrong ([#1177](https://github.com/typeorm/typeorm/pull/1177))

## 0.1.2

* sqlite now supports relative database file paths ([#798](https://github.com/typeorm/typeorm/issues/798) and [#799](https://github.com/typeorm/typeorm/issues/799))
* fixed bug with not properly working `update` method ([#1037](https://github.com/typeorm/typeorm/issues/1037), [#1042](https://github.com/typeorm/typeorm/issues/1042))
* fixed bug with replication support ([#1035](https://github.com/typeorm/typeorm/pull/1035))
* fixed bug with wrong embedded column names being generated ([#969](https://github.com/typeorm/typeorm/pull/969))
* added support for caching in respositories ([#1057](https://github.com/typeorm/typeorm/issues/1057))
* added support for the `citext` column type for postgres ([#1075](https://github.com/typeorm/typeorm/pull/1075))

## 0.1.1

* added support for `pg-native` for postgres (#975). To use it you just need to install `npm i pg-native` and it will be picked up automatically.
* now Find Options support `-1` and `1` for `DESC` and `ASC` values. This is better user experience for MongoDB users.
* now inheritances in embeddeds are supported (#966).
* `isArray: boolean` in `ColumnOptions` is deprecated. Use `array: boolean` instead.
* deprecated `removeById` method, now use `deleteById` method instead.
* added `insert` and `delete` methods into repository and entity manager.
* fixed multiple issues with `update`, `updateById` and `removeById` methods in repository and entity manager. Now they do not use `save` and `remove` methods anymore - instead they are using QueryBuilder to build and execute their queries.
* now `save` method can accept partial entities.
* removed opencollective dependency.
* fixed issues with bulk entity insertions.
* find* methods now can find by embed conditions.
* fixed issues with multiple schema support, added option to `@JoinTable` to support schema and database.
* multiple small bugfixes.

## 0.1.0

#### BREAKING CHANGES

* `Table`, `AbstractTable`, `ClassTableChild`, `ClosureTable`, `EmbeddableTable`, `SingleTableChild` deprecated  decorators were removed. Use `Entity`, `ClassEntityChild`, `ClosureEntity`, `SingleEntityChild` decorators instead.
* `EntityManager#create`, `Repository#create`, `EntityManager#preload`, `Repository#preload`, `EntityManager#merge`, `Repository#merge` methods now accept `DeepPartial<Entity>` instead of `Object`.
*  `EntityManager#merge`, `Repository#merge` methods first argument is now an entity where to need to merge all given entity-like objects.
* changed `find*` repository methods. Now conditions are `Partial<Entity>` type.
* removed `FindOptions` interface and introduced two new interfaces: `FindOneOptions` and `FindManyOptions` - each for its own `findOne*` or `find*` methods.
* dropped out some of options of `FindOptions`. Use `QueryBuilder` instead. However, added  few new options as well.
* deprecated method `addParameters` has been removed from `QueryBuilder`. Use `setParameters` instead.
* removed `setMaxResults`, `setFirstResult` methods in `QueryBuilder`. Use `take` and `skip` methods instead.
* renamed `entityManager` to `manager` in `Connection`, `AbstractRepository` and event objects. `entityManager` property was removed.
* renamed `persist` to `save` in `EntityManager` and `Repository` objects. `persist` method was removed.
* `SpecificRepository` is removed. Use relational query builder functionality instead.
* `transaction` method has been removed from `Repository`. Use `EntityManager#transaction` method instead.
* custom repositories do not support container anymore.
* controller / subscriber / migrations from options tsconfig now appended with a project root directory
* removed naming strategy decorator, naming strategy by name functionality. Now naming strategy should be registered by passing naming strategy instance directly.
* `driver` section in connection options now deprecated. All settings should go directly to connection options root.
* removed `fromTable` from the `QueryBuilder`. Now use regular `from` to select from tables.
* removed `usePool` option from the connection options. Pooling now is always enabled.
* connection options interface has changed and now each platform has its own set of connection options.
* `storage` in sqlite options has been renamed to `database`.
* env variable names for connection were changed (`TYPEORM_DRIVER_TYPE` has been renamed to `TYPEORM_CONNECTION`, some other renaming). More env variable names you can find in `ConnectionOptionsEnvReader` class.
* some api changes in `ConnectionManager` and `createConnection` / `createConnections` methods of typeorm main entrypoint.
* `simple_array` column type now is called `simple-array`
* some column types were removed. Now orm uses column types of underlying database.
* now `number` type in column definitions (like `@Column() likes: number`) maps to `integer` instead of `double`. This is more programmatic design. If you need to store float-pointing values - define a type explicitly.
* `fixedLength` in column options has been removed. Now actual column types can be used, e.g. `@Column("char")` or `@Column("varchar")`.
* `timezone` option has been removed from column options. Now corresponding database types can be used instead.
* `localTimezone` has been removed from the column options.
* `skipSchemaSync` in entity options has been renamed to `skipSync`.
* `setLimit` and `setOffset` in `QueryBuilder` were renamed into `limit` and `offset`.
* `nativeInterface` has been removed from a driver interface and implementations.
* now typeorm works with the latest version of mssql (version 4).
* fixed how orm creates default values for SqlServer - now it creates constraints for it as well.
* migrations interface has changed - now `up` and `down` accept only `QueryRunner`. To use `Connection` and `EntityManager` use properties of `QueryRunner`, e.g. `queryRunner.connection` and `queryRunner.manager`.
* now `update` method in `QueryBuilder` accepts `Partial<Entity>` and property names used in update map are column property names and they are automatically mapped to column names.
* `SpecificRepository` has been removed. Instead new `RelationQueryBuilder` was introduced.
* `getEntitiesAndRawResults` of `QueryBuilder` has been renamed to `getRawAndEntities`.
* in mssql all constraints are now generated using table name in their names - this is fixes issues with duplicate constraint names.
* now when object is loaded from the database all its columns with null values will be set into entity properties as null.  Also after saving entity with unset properties that will be stored as nulls - their (properties) values will be set to null.
* create and update dates in entities now use date with fractional seconds.
* `@PrimaryGeneratedColumn` decorator now accept generation strategy as first argument (default is `increment`), instead of column type. Column type must be passed in options object, e.g. `@PrimaryGeneratedColumn({ type: "bigint"})`.
* `@PrimaryColumn` now does not accept `generated` parameter in options. Use `@Generated` or `@PrimaryGeneratedColumn` decorators instead.
* Logger interface has changed. Custom logger supply mechanism has changed.
* Now `logging` options in connection options is simple "true", or "all", or list of logging modes can be supplied.
* removed `driver` section in connection options. Define options right in the connection options section.
* `Embedded` decorator is deprecated now. use `@Column(type => SomeEmbedded)` instead.
* `schemaName` in connection options is removed. Use `schema` instead.
* `TYPEORM_AUTO_SCHEMA_SYNC` env variable is now called `TYPEORM_SYNCHRONIZE`.
* `schemaSync` method in `Connection` has been renamed to `synchronize`.
* `getEntityManager` has been deprecated. Use `getManager` instead.
* `@TransactionEntityManager` is now called `@TransactionManager` now.
* `EmbeddableEntity`, `Embedded`, `AbstractEntity` decorators has been removed. There is no need to use `EmbeddableEntity` and `AbstractEntity` decorators at all - entity will work as expected without them. Instead of `@Embedded(type => X)` decorator now `@Column(type => X)` must be used instead.
* `tablesPrefix`, `autoSchemaSync`, `autoMigrationsRun`, `dropSchemaOnConnection` options were removed. Use `entityPrefix`, `synchronize`, `migrationsRun`, `dropSchema` options instead.
* removed `persist` method from the `Repository` and `EntityManager`. Use `save` method instead.
* removed `getEntityManager` from `typeorm` namespace. Use `getManager` method instead.
* refactored how query runner works, removed query runner provider
* renamed `TableSchema` into `Table`
* renamed `ColumnSchema` into `TableColumn`
* renamed `ForeignKeySchema` into `TableForeignKey`
* renamed `IndexSchema` into `TableIndex`
* renamed `PrimaryKeySchema` into `TablePrimaryKey`

#### NEW FEATURES

* added `mongodb` support.
* entity now can be saved partially within `update` method.
* added prefix support to embeddeds.
* now embeddeds inside other embeddeds are supported.
* now relations are supported inside embeds.
* now relations for multiple primary keys are generated properly.
* now ormconfig is read from `.env`, `.js`, `.json`, `.yml`, `.xml` formats.
* all database-specific types are supported now.
* now migrations generation in mysql is supported. Use `typeorm migrations:generate` command.
* `getGeneratedQuery` was renamed to `getQuery` in `QueryBuilder`.
* `getSqlWithParameters` was renamed to `getSqlAndParameters` in `QueryBuilder`.
* sql queries are highlighted in console.
* added `@Generated` decorator. It can accept `strategy` option with values `increment` and `uuid`. Default is `increment`. It always generates value for column, except when column defined as `nullable` and user sets `null` value in to column.
* added logging of log-running requests.
* added replication support.
* added custom table schema and database support in `Postgres`, `Mysql` and `Sql Server` drivers.
* multiple bug fixes.
* added ActiveRecord support (by extending BaseEntity) class
* `Connection` how has `createQueryRunner` that can be used to control database connection and its transaction state
* `QueryBuilder` is abstract now and all different kinds of query builders were created for different query types - `SelectQueryBuilder`, `UpdateQueryBuilder`, `InsertQueryBuilder` and `DeleteQueryBuilder` with individual method available.

## 0.0.11

* fixes [#341](https://github.com/typeorm/typeorm/issues/341) - issue when trying to create a `OneToOne` relation with
`referencedColumnName` where the relation is not between primary keys


## 0.0.10

* added `ObjectLiteral` and `ObjectType` into main exports
* fixed issue fixes [#345](https://github.com/typeorm/typeorm/issues/345).
* fixed issue with migration not saving into the database correctly.
    Note its a breaking change if you have run migrations before and have records in the database table,
    make sure to apply corresponding changes. More info in [#360](https://github.com/typeorm/typeorm/issues/360) issue.

## 0.0.9

* fixed bug with indices from columns are not being inherited from parent entity [#242](https://github.com/typeorm/typeorm/issues/242)
* added support of UUID primary columns (thanks [@seanski](https://github.com/seanski))
* added `count` method to repository and entity manager (thanks [@aequasi](https://github.com/aequasi))

## 0.0.8

* added complete babel support
* added `clear` method to `Repository` and `EntityManager` which allows to truncate entity table
* exported `EntityRepository` in `typeorm/index`
* fixed issue with migration generation in [#239](https://github.com/typeorm/typeorm/pull/239) (thanks to [@Tobias4872](https://github.com/Tobias4872))
* fixed issue with using extra options with SqlServer [#236](https://github.com/typeorm/typeorm/pull/236) (thanks to [@jmai00](https://github.com/jmai00))
* fixed issue with non-pooled connections [#234](https://github.com/typeorm/typeorm/pull/234) (thanks to [@benny-medflyt](https://github.com/benny-medflyt))
* fixed issues:
[#242](https://github.com/typeorm/typeorm/issues/242),
[#240](https://github.com/typeorm/typeorm/issues/240),
[#204](https://github.com/typeorm/typeorm/issues/204),
[#219](https://github.com/typeorm/typeorm/issues/219),
[#233](https://github.com/typeorm/typeorm/issues/233),
[#234](https://github.com/typeorm/typeorm/issues/234)

## 0.0.7

* added custom entity repositories support
* merged typeorm-browser and typeorm libraries into single package
* added `@Transaction` decorator
* added exports to `typeorm/index` for naming strategies
* added shims for browsers using typeorm in frontend models, also added shim to use typeorm
with class-transformer library on the frontend
* fixed issue when socketPath could not be used with mysql driver (thanks @johncoffee)
* all table decorators are renamed to `Entity` (`Table` => `Entity`, `AbstractTable` => `AbstractEntity`,
`ClassTableChild` => `ClassEntityChild`, `ClosureTable` => `ClosureEntity`, `EmbeddableTable` => `EmbeddableEntity`,
`SingleTableChild` => `SingleEntityChild`). This change is required because upcoming versions of orm will work
not only with tables, but also with documents and other database-specific "tables".
Previous decorator names are deprecated and will be removed in the future.
* added custom repositories support. Example in samples directory.
* cascade remove options has been removed from `@ManyToMany`, `@OneToMany` decorators. Also cascade remove is not possible
from two sides of `@OneToOne` relationship now.
* fixed issues with subscribers and transactions
* typeorm now has translation in chinese (thanks [@brookshi](https://github.com/brookshi))
* added `schemaName` support for postgres database [#152](https://github.com/typeorm/typeorm/issues/152) (thanks [@mingyang91](https://github.com/mingyang91))
* fixed bug when new column was'nt added properly in sqlite [#157](https://github.com/typeorm/typeorm/issues/157)
* added ability to set different types of values for DEFAULT value of the column [#150](https://github.com/typeorm/typeorm/issues/150)
* added ability to use zero, false and empty string values as DEFAULT values in [#189](https://github.com/typeorm/typeorm/pull/189) (thanks to [@Luke265](https://github.com/Luke265))
* fixed bug with junction tables persistence (thanks [@Luke265](https://github.com/Luke265))
* fixed bug regexp in `QueryBuilder` (thanks [@netnexus](https://github.com/netnexus))
* fixed issues [#202](https://github.com/typeorm/typeorm/issues/202), [#203](https://github.com/typeorm/typeorm/issues/203) (thanks to [@mingyang91](https://github.com/mingyang91))
* fixed issues
[#159](https://github.com/typeorm/typeorm/issues/159),
[#181](https://github.com/typeorm/typeorm/issues/181),
[#176](https://github.com/typeorm/typeorm/issues/176),
[#192](https://github.com/typeorm/typeorm/issues/192),
[#191](https://github.com/typeorm/typeorm/issues/191),
[#190](https://github.com/typeorm/typeorm/issues/190),
[#179](https://github.com/typeorm/typeorm/issues/179),
[#177](https://github.com/typeorm/typeorm/issues/177),
[#175](https://github.com/typeorm/typeorm/issues/175),
[#174](https://github.com/typeorm/typeorm/issues/174),
[#150](https://github.com/typeorm/typeorm/issues/150),
[#159](https://github.com/typeorm/typeorm/issues/159),
[#173](https://github.com/typeorm/typeorm/issues/173),
[#195](https://github.com/typeorm/typeorm/issues/195),
[#151](https://github.com/typeorm/typeorm/issues/151)

## 0.0.6

* added `JSONB` support for Postgres in #126 (thanks [@CreepGin](https://github.com/CreepGin)@CreepGin)
* fixed in in sqlite query runner in #141 (thanks [@marcinwadon](https://github.com/marcinwadon))
* added shortcut exports for table schema classes in #135 (thanks [@eduardoweiland](https://github.com/eduardoweiland))
* fixed bugs with single table inheritance in #132 (thanks [@eduardoweiland](https://github.com/eduardoweiland))
* fixed issue with `TIME` column in #134 (thanks [@cserron](https://github.com/cserron))
* fixed issue with relation id in #138 (thanks [@mingyang91](https://github.com/mingyang91))
* fixed bug when URL for pg was parsed incorrectly #114 (thanks [@mingyang91](https://github.com/mingyang91))
* fixed bug when embedded is not being updated
* metadata storage now in global variable
* entities are being loaded in migrations and can be used throw the entity manager or their repositories
* migrations now accept `EntityMetadata` which can be used within one transaction
* fixed issue with migration running on windows #140
* fixed bug with with Class Table Inheritance #144

## 0.0.5

* changed `getScalarMany` to `getRawMany` in `QueryBuilder`
* changed `getScalarOne` to `getRawOne` in `QueryBuilder`
* added migrations support

## 0.0.4

* fixed problem when `order by` is used with `limit`
* fixed problem when `decorators-shim.d.ts` exist and does not allow to import decorators (treats like they exist in global)
* fixed Sql Server driver bugs

## 0.0.3

* completely refactored persistence mechanism:
    * added experimental support of `{ nullable: true }` in relations
    * cascade operations should work better now
    * optimized all queries
    * entities with recursive entities should be persisted correctly now
* now `undefined` properties are skipped in the persistence operation, as well as `undefined` relations.
* added platforms abstractions to allow typeorm to work on multiple platforms
* added experimental support of typeorm in the browser
* breaking changes in `QueryBuilder`:
    * `getSingleResult()` renamed to `getOne()`
    * `getResults()` renamed to `getMany()`
    * `getResultsAndCount()` renamed to `getManyAndCount()`
    * in the innerJoin*/leftJoin* methods now no need to specify `ON`
    * in the innerJoin*/leftJoin* methods no longer supports parameters, use `addParameters` or `setParameter` instead.
    * `setParameters` is now works just like `addParameters` (because previous behaviour confused users),
    `addParameters` now is deprecated
    * `getOne` returns `Promise<Entity|undefined>`
* breaking changes in `Repository` and `EntityManager`:
    * `findOne` and .findOneById` now return `Promise<Entity|undefined>` instead of `Promise<Entity>`
* now typeorm is compiled into `ES5` instead of `ES6` - this allows to run it on older versions of node.js
* fixed multiple issues with dates and utc-related stuff
* multiple bugfixes

## 0.0.2

* lot of API refactorings
* complete support TypeScript 2
* optimized schema creation
* command line tools
* multiple drivers support
* multiple bugfixes

## 0.0.1

* first stable version, works with TypeScript 1.x
