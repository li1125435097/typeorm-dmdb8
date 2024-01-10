import {promises as fs} from "fs";
import {expect} from "chai";
import {ConnectionOptions} from "../../../src/connection/ConnectionOptions";
import {ConnectionOptionsReader} from "../../../src/connection/ConnectionOptionsReader";
import path from "path";

async function createDotenvFiles() {
    // These files may not always exist
    await fs.writeFile(path.join(__dirname, "configs/.env"), "TYPEORM_CONNECTION = mysql\nTYPEORM_DATABASE = test-env");
    await fs.writeFile(path.join(__dirname, "configs/ormconfig.env"), "TYPEORM_CONNECTION = mysql\nTYPEORM_DATABASE = test-ormconfig-env");
}

async function createYamlFiles() {
  await fs.mkdir(path.join(__dirname, "configs/yaml"));
  await fs.writeFile(path.join(__dirname, "configs/yaml/test-yaml.yaml"), "- type: \"sqlite\"\n  name: \"file\"\n  database: \"test-yaml\"");
}

describe("ConnectionOptionsReader", () => {
  beforeEach(() => {
    delete process.env['TYPEORM_CONNECTION'];
    delete process.env['TYPEORM_DATABASE'];
  });

  after(() => {
    delete process.env.TYPEORM_CONNECTION;
    delete process.env.TYPEORM_DATABASE;
  });

  it("properly loads config with entities specified", async () => {
    type EntititesList = Function[] | string[];
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/class-entities" });
    const options: ConnectionOptions = await connectionOptionsReader.get("test-conn");
    expect(options.entities).to.be.an.instanceOf(Array);
    const entities: EntititesList = options.entities as EntititesList;
    expect(entities.length).to.equal(1);
  });

  it("properly loads sqlite in-memory/path config", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/sqlite-memory" });
    const inmemoryOptions: ConnectionOptions = await connectionOptionsReader.get("memory");
    expect(inmemoryOptions.database).to.equal(":memory:");
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test");
  });

  it("properly loads config with specified file path", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-path-config" });
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test-js");
  });

  it("properly loads asynchronous config with specified file path", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-path-config-async" });
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test-js-async");
  });

  it("properly loads config with specified file path from esm in js", async () => {
    const connectionOptionsReader = new ConnectionOptionsReader({ root: __dirname, configName: "configs/test-path-config-esm" });
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test-js-esm");
  });

  it("properly loads config from .env file", async () => {
    await createDotenvFiles();

    const connectionOptionsReader = new ConnectionOptionsReader({ root:  __dirname, configName: "configs/.env" });
    const [ fileOptions ]: ConnectionOptions[] = await connectionOptionsReader.all();
    expect(fileOptions.database).to.have.string("test-env");
    expect(process.env.TYPEORM_DATABASE).to.equal("test-env");
  });

  it("properly loads config from ormconfig.env file", async () => {
    await createDotenvFiles();

    const connectionOptionsReader = new ConnectionOptionsReader({ root:  __dirname, configName: "configs/ormconfig.env" });
    const [ fileOptions ]: ConnectionOptions[] = await connectionOptionsReader.all();
    expect(fileOptions.database).to.have.string("test-ormconfig-env");
    expect(process.env.TYPEORM_DATABASE).to.equal("test-ormconfig-env");
  });

  it("properly loads config ormconfig.env when given multiple choices", async () => {
    await createDotenvFiles();

    const connectionOptionsReader = new ConnectionOptionsReader({ root:  path.join(__dirname, "configs") });
    const [ fileOptions ]: ConnectionOptions[] = await connectionOptionsReader.all();
    expect(fileOptions.database).to.have.string("test-ormconfig-env");
    expect(process.env.TYPEORM_DATABASE).to.equal("test-ormconfig-env");
  });

  it("properly loads config from yaml", async () => {
    await createYamlFiles();

    const connectionOptionsReader = new ConnectionOptionsReader({ root: path.join(__dirname, "configs/yaml"), configName: "test-yaml" });
    const fileOptions: ConnectionOptions = await connectionOptionsReader.get("file");
    expect(fileOptions.database).to.have.string("/test-yaml");
  });
});
