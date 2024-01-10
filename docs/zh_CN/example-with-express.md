# 使用 TypeORM 和 Express 的示例

  * [初始设置](#初始设置)
  * [将Express添加到应用程序](#将Express添加到应用程序)
  * [将TypeORM添加到应用程序](#将TypeORM添加到应用程序)

## 初始设置

让我们创建一个名为"user"的简单应用程序，它将用户存储在数据库中
并允许我们在 web api 创建、更新、删除和获取所有用户的列表，以及通过 id 获取的单个用户。

首先，创建一个名为"user"的目录：

```
mkdir user
```

然后切换到目录并创建一个新项目：

```
cd user
npm init
```

通过填写所有必需的应用程序信息来完成初始化过程。

现在我们需要安装和设置 TypeScript 编译器。 首先安装：

```
npm i typescript --save-dev
```

然后创建一个`tsconfig.json`文件，其中包含应用程序编译和运行所需的配置。 使用你常用的编辑器创建它并进行以下配置：

```json
{
  "compilerOptions": {
    "lib": ["es5", "es6"],
    "target": "es5",
    "module": "commonjs",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

现在让我们在`src`目录中创建一个主应用程序入口--`app.ts`：

```
mkdir src
cd src
touch app.ts
```

先在其中添加一个简单的`console.log`：

```typescript
console.log("Application is up and running");
```

然后运行程序。在运行之前，你需要首先编译 typescript 项目：

```
tsc
```

编译之后，可以看到生成一个`src/app.js`文件。
然后可以使用以下命令运行它

```
node src/app.js
```

运行应用程序后，则在控制台中看到"Application is up and running"的消息。

每次进行更改时都必须编译文件。
或者，你可以设置监听程序或安装[ts-node](http://github.com/ts-node/ts-node)以避免每次手动编译。

## 将Express添加到应用程序

将 Express 添加到应用程序中。 首先，需要安装依赖包：d:

```
npm i express body-parser @types/express @types/body-parser --save
```

- `express` 是 express 引擎，允许我们创建一个 web api
- `body-parser` 用于设置 express 如何处理客户端发送的 body
- `@types/express` 用于在使用 express 时具有类型提示信息
- `@types/body-parser` 用于在使用 body parser 时具有类型提示信息

让我们编辑`src/app.ts`文件并添加与表达相关的逻辑：

```typescript
import * as express from "express";
import { Request, Response } from "express";
import * as bodyParser from "body-parser";

//创建并设置 express app
const app = express();
app.use(bodyParser.json());

// 注册路由

app.get("/users", function(req: Request, res: Response) {
  // 获取用户信息的逻辑操作
});

app.get("/users/:id", function(req: Request, res: Response) {
  // 通过id获得用户信息的逻辑操作
});

app.post("/users", function(req: Request, res: Response) {
  // 保存用户信息的逻辑操作
});

app.put("/users/:id", function(req: Request, res: Response) {
  // 根据给定id更新某个用户的逻辑操作
});

app.delete("/users/:id", function(req: Request, res: Response) {
  // 根据给定id删除一个用户的逻辑操作
});

// 启动 express 服务
app.listen(3000);
```

现在你可以编译并运行项目。
此时你应该有一个启动的 express 服务，并且有可以工作的路由。
但是，这些路由目前并未返回任何内容。

## 将TypeORM添加到应用程序

最后，让我们将 TypeORM 添加到应用程序中。
在这个例子中，我们将使用`mysql`驱动程序。
其他驱动程序的安装过程类似。

首先安装依赖包：

```
npm i typeorm mysql reflect-metadata --save
```

- `typeorm` typeorm 包
- `mysql` 是底层数据库驱动程序。如果你使用的是其他数据库系统，则必须安装相应的包。
- `reflect-metadata` 需要使装饰器正常工作

然后创建一个`ormconfig.json`文件来配置数据库连接。

```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "test",
  "password": "test",
  "database": "test",
  "entities": ["src/entity/*.js"],
  "logging": true
}
```

根据需要配置每个选项。
了解有关 [连接选项](./connection-options.md)的更多信息。

让我们在`src/entity`中创建一个`User`实体：

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;
}
```

然后修改 `src/app.ts`:

```typescript
import * as express from "express";
import { Request, Response } from "express";
import * as bodyParser from "body-parser";
import { createConnection } from "typeorm";
import { User } from "./User";

// 创建 typeorm 连接
createConnection().then(connection => {
  const userRepository = connection.getRepository(User);

  // 创建并设置express app
  const app = express();
  app.use(bodyParser.json());

  // 注册路由

  app.get("/users", async function(req: Request, res: Response) {
    return userRepository.find();
  });

  app.get("/users/:id", async function(req: Request, res: Response) {
    return userRepository.findOne(req.params.id);
  });

  app.post("/users", async function(req: Request, res: Response) {
    const user = userRepository.create(req.body);
    return userRepository.save(user);
  });

  app.put("/users/:id", function(req: Request, res: Response) {
    const user = userRepository.findOne(req.params.id);
    userRepository.merge(user, req.body);
    return userRepository.save(user);
  });

  app.delete("/users/:id", async function(req: Request, res: Response) {
    return userRepository.remove(req.params.id);
  });

  // 启动 express server
  app.listen(3000);
});
```

如果要将逻辑处理提取到单独的文件中并且还需要`connection`实例，则可以使用`getConnection`：

```typescript
import { getConnection } from "typeorm";
import { User } from "./User";

export function UsersListAction(req: Request, res: Response) {
  return getConnection()
    .getRepository(User)
    .find();
}
```

在这个例子中你甚至不需要`getConnection` - 可以直接使用`getRepository`函数：

```typescript
import { getRepository } from "typeorm";
import { User } from "./User";

export function UsersListAction(req: Request, res: Response) {
  return getRepository(User).find();
}
```
