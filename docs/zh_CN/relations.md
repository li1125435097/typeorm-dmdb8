# 关系

  * [什么是关系](#什么是关系)
  * [关系选项](#关系选项)
  * [级联](#级联)
  * [`@JoinColumn`选项](#`@JoinColumn`选项)
  * [`@JoinTable`选项](#`@JoinTable`选项)

## 什么是关系

关系可以帮助你轻松地与相关实体合作。
有几种类型的关系：

* [一对一](./one-to-one-relations.md) 使用 `@OneToOne`
* [多对一](./many-to-one-one-to-many-relations.md) 使用 `@ManyToOne`
* [一对多](./many-to-one-one-to-many-relations.md) 使用 `@OneToMany`
* [多对多](./many-to-many-relations.md) 使用 `@ManyToMany`

## 关系选项

你可以为关系指定几个选项：

- `eager: boolean` - 如果设置为 true，则在此实体上使用`find *` 或`QueryBuilder`时，将始终使用主实体加载关系
- `cascade: boolean` - 如果设置为 true，则将插入相关对象并在数据库中更新。
- `onDelete: "RESTRICT"|"CASCADE"|"SET NULL"` - 指定删除引用对象时外键的行为方式
- `primary: boolean` - 指示此关系的列是否为主列。
- `nullable: boolean` -指示此关系的列是否可为空。 默认情况下是可空。
- `orphanedRowAction: "nullify" | "delete"` - 将子行从其父行中删除后，确定该子行是孤立的（默认值）还是删除的。

## 级联

级联例子:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Question } from "./Question";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(type => Question, question => question.categories)
  questions: Question[];
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Category } from "./Category";

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  text: string;

  @ManyToMany(type => Category, category => category.questions, {
    cascade: true
  })
  @JoinTable()
  categories: Category[];
}
```

```typescript
const category1 = new Category();
category1.name = "animals";

const category2 = new Category();
category2.name = "zoo";

const question = new Question();
question.categories = [category1, category2];
await connection.manager.save(question);
```

正如您在本示例中所看到的，我们没有为`category1`和`category2`调用`save`。
由于我们将`cascade`设置为 true，因此它们将自动插入数据库。

请记住，能力越大，责任越大。
级联可能看起来像是一种处理关系的好方法，
但是当一些不需要的对象被保存到数据库中时，它们也可能带来错误和安全问题。
此外，它们提供了一种将新对象保存到数据库中的不太明确的方法。

## `@JoinColumn`选项

`@ JoinColumn`不仅定义了关系的哪一侧包含带有外键的连接列，还允许自定义连接列名和引用的列名。

当我们设置`@ JoinColumn`时，它会自动在数据库中创建一个名为`propertyName + referencedColumnName`的列。
例如：

```typescript
@ManyToOne(type => Category)
@JoinColumn() // 这个装饰器对于@ManyToOne是可选的，但@OneToOne是必需的
category: Category;
```

此代码将在数据库中创建`categoryId`列。
如果要在数据库中更改此名称，可以指定自定义连接列名称：

```typescript
@ManyToOne(type => Category)
@JoinColumn({ name: "cat_id" })
category: Category;
```

Join 列始终是对其他一些列的引用（使用外键）。
默认情况下，关系始终引用相关实体的主列。
如果要与相关实体的其他列创建关系 - 你也可以在`@ JoinColumn`中指定它们：

```typescript
@ManyToOne(type => Category)
@JoinColumn({ referencedColumnName: "name" })
category: Category;
```

该关系现在引用`Category`实体的`name`，而不是`id`。
该关系的列名将变为`categoryName`

## `@JoinTable`选项

`@ JoinTable`用于“多对多”关系，并描述"junction"表的连接列。
联结表是由 TypeORM 自动创建的一个特殊的单独表，其中的列引用相关实体。
你可以使用`@ JoinColumn`更改联结表及其引用列中的列名：
你还可以更改生成的"junction"表的名称。

```typescript
@ManyToMany(type => Category)
@JoinTable({
    name: "question_categories" // 此关系的联结表的表名
    joinColumn: {
        name: "question",
        referencedColumnName: "id"
    },
    inverseJoinColumn: {
        name: "category",
        referencedColumnName: "id"
    }
})
categories: Category[];
```

如果目标表具有复合主键，
则必须将一组属性发送到`@ JoinTable`。
