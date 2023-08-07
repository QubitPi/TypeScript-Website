---
title: Choosing the Best Dependency Injection Containers
layout: docs
permalink: /docs/handbook/dependency-injection-containers.html
oneline: Comparison of dependency injection containers in TypeScript
translatable: true
---

To follow along with this article, one should be familiar with the following concepts:

- **Inversion of Control**: a design pattern that stipulates frameworks should call userland code, instead of userland 
  code calling library code
- **Dependency injection**: a variant of IoC in which objects receive other objects as dependencies instead of through
  constructors or setters
- [**Decorators**](/docs/handbook/decorators.html)
- [**Decorator metadata**](/docs/handbook/decorators.html#metadata): a way to store configuration for language
  structures in runtime by using decorators to define targets

In our pursuit of choosing the best TypeScript DI library, we researched existing DI libraries. We found there are a 
couple of TypeScripts DI options out there. In this article, we first outline which requirements the library must meet 
to satisfy our demands. Then we present contenders that made it to the final cut. We highlight their pros and cons

## Requirements

We already know we will be using Open Source Solutions, so we will base most of our criteria upon their OS communities.

### Popularity and maintenance

The library in question needs to be **popular** and **maintained**. This was a key requirement. The library should have 
official support from its original creators. We measured the popularity by **GitHub stars**, **npm weekly downloads**, 
and how long ago was the **latest publish date**.

### Ease of Use

Ideally, the library has to be easy to use to shorten our development time. To estimate this, we judged the contenders' documentation on a subjective scale from 1 (Hardest to Read) to 5 (Easiest to Read).

### Minimum TS Version Required

The library needs to work with relatively a wide range of TypeScript versions, because out team might develop
application that requires a relatively old TS version.

We've had experience in the past we are prototyping a new product on top of an existing framework but in the middle
of the development, we found we were unable to bump our yarn version from 1 to 2 simply because the TypeScript version
in the framework is too old to migrate from yarn 1 to 2. It was important to us that the library could easily work with
varying TS versions.

### Decorator Required

It would be prefect if the library goes without any uncertainty, but
[since decorators, which most DI libraries requires, are a stage 2 proposal for JavaScript and are available only as an 
experimental feature of TypeScript](/docs/handbook/decorators.html)
at the time of writing, we need to take the risk of loosing that feature in the future. Basically, to turn on the 
decorator in TypeScript, we need to tune tsconfig file with the following two options:

```json
{
    "compilerOptions": {
        "target": "ES5",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

## TypeScript Dependency Injection Library Landscape Overview

We can get a high-level overview of the findings in the table below.

|                  | **GitHub stars** | **Weekly downloads** ([Download Stats in the past 1 year](https://npmtrends.com/inversify-vs-tsyringe-vs-typed-inject-vs-typedi) is also available) | **Latest version** | **latest publish date** | **Documentation** | **License** | **Minimum TS Version** | **reflect-metadata Required** | **TS Decorator Required** | **Decorate Metadata Required** |
|:----------------:|:----------------:|:---------------------------------------------------------------------------------------------------------------------------------------------------:|:------------------:|:-----------------------:|:-----------------:|:-----------:|:----------------------:|:-----------------------------:|:-------------------------:|:------------------------------:|
| **InversifyJS**  | 10k              |                                                                       683,854                                                                       | 6.0.1              | 2 years ago             | 4                 | MIT         | 4.4                    | Y                             | Y                         | Y                              |
|    **TypeDI**    | 3.6k             |                                                                       232,767                                                                       | 0.10.0             | 2 years ago             | 5                 | MIT         | No Strict Requirement  | Y                             | Y                         | Y                              |
|   **TSyringe**   | 4.1k             |                                                                       242,953                                                                       | 4.7.0              | 1 year ago              | 3                 | MIT         | No Strict Requirement  | Y                             | Y                         | Y                              |
| **Typed Inject** | 341              |                                                                       62,034                                                                        | 4.0.0              | 19 days ago             | 3                 | Apache 2.0  | 3.0                    | N                             | N                         | N                              |

That is how we ended up with 2 main candidates - InversifyJS & Typed Inject.

We also looked at [NPM trends](https://npmtrends.com/inversify-vs-tsyringe-vs-typed-inject-vs-typedi) to make sure that
the weekly downloads does reflect the overall popularity of those DI livraries:

![Error loading DI-compare.png](/TypeScript-Website/images/docs/DI-compare.png)

## InversifyJS

A very popular, easy-to-use tool with descent-quality documentation that provides a lot of tools and extensions through 
its [ecosystem](https://github.com/inversify/InversifyJS/blob/master/wiki/ecosystem.md), such as the
[support to GraphQL](https://github.com/oguimbal/inversify-graphql), which our team heavily uses. What we liked the
most was the powerful expressiveness on its binding options that the library provides. 

The [InversifyJS](https://github.com/inversify/InversifyJS) uses decorators and decorators' metadata for injections.
Some manual work, however, is still necessary for binding implementations to interfaces. For example

```ts
export const TYPES = {
    Logger: Symbol.for("Logger"),
    FileSystem: Symbol.for("FileSystem"),
    SettingsService: Symbol.for("SettingsService"),
};

@injectable()
export class InversifyLogger implements Logger {
    // ...
}

@injectable()
export class InversifyFileSystem implements FileSystem<string> {
    // ...
}

@injectable()
export class InversifySettingsTxtService implements SettingsService {
    constructor(
        @inject(TYPES.Logger) protected readonly logger: Logger,
        @inject(TYPES.FileSystem) protected readonly fileSystem: FileSystem<string>,
    ) {
        // ...
    }
}
```

A map called _TYPES_ is created to contain all, what we call, tokens for injection later. The interface implementations
are annotated with decorator _@injectable_. The parameters of the _InversifySettingsTxtService_ constructor use the
`@inject` decorator, helping the DI container to resolve dependencies in runtime.

The code for the DI container/injector is seen in the code snippet below:

```ts
const container = new Container();
container.bind<Logger>(TYPES.Logger).to(InversifyLogger).inSingletonScope();
container.bind<FileSystem<string>>(TYPES.FileSystem).to(InversifyFileSystem).inSingletonScope();
container.bind<SettingsService>(TYPES.SettingsService).to(InversifySettingsTxtService).inSingletonScope();
```

InversifyJS uses the fluent interface pattern. The IoC container achieves type binding between tokens and classes by 
declaring it explicitly in code. Getting instances of managed classes requires only one call with proper casting:

```ts
const logger = container.get<InversifyLogger>(TYPES.Logger);
const fileSystem = container.get<InversifyFileSystem>(TYPES.FileSystem);
const settingsService = container.get<SettingsTxtService>(TYPES.SettingsService);
```

## Typed Inject

The [Typed Inject](https://github.com/nicojs/typed-inject) project focuses on type safety and explicitness. It uses
neither decorators nor decorator metadata, opting instead for manually declaring dependencies. It allows for multiple
DI containers to exist, and dependencies are scoped either as singletons or as transient objects. For example

```ts
export class TypedInjectLogger implements Logger {
    // ...
}
export class TypedInjectFileSystem implements FileSystem<string> {
    // ...
}

export class TypedInjectSettingsTxtService extends SettingsTxtService {
    public static inject = ["logger", "fileSystem"] as const;

    constructor(
        protected logger: Logger,
        protected fileSystem: FileSystem<string>,
    ) {
        super();
    }
}
```

The _TypedInjectLogger_ and _TypedInjectFileSystem_ classes serve as concrete implementations of the required interfaces. Type bindings are defined on the class-level by listing object dependencies using _inject_, a static variable.

The following code snippet demonstrates all major container operations within the Typed Inject environment:

```ts
const appInjector = createInjector()
    .provideClass("logger", TypedInjectLogger, Scope.Singleton)
    .provideClass("fileSystem", TypedInjectFileSystem, Scope.Singleton);
```

The container is instantiated using the _createInjector_ functions, with token-to-class bindings declared explicitly.

Developers can access instances of provided classes using the _resolve_ function. Injectable classes can be obtained 
using the _injectClass_ method.

```ts
const logger = appInjector.resolve("logger");
const fileSystem = appInjector.resolve("fileSystem");
const settingsService = appInjector.injectClass(TypedInjectSettingsTxtService);
```

## Others

### TypeDI

The [TypeDI](https://github.com/typestack/typedi) project aims for simplicity by leveraging decorators and decorator
metadata. It supports dependency scoping with singletons and transient objects and allows for multiple DI containers to
exist. We have two options for working with TypeDI:

1. [class-based injections](#class-based-injections-with-typedi)
2. [token-based injections](#token-based-injections-with-typedi)

#### Class-Based Injections with TypeDI

Class-based injections allow for the insertion of classes by passing interface-class relationships:

```ts
@Service({ global: true })
export class TypeDiLogger implements Logger {}

@Service({ global: true })
export class TypeDiFileSystem implements FileSystem<string> {}

@Service({ global: true })
export class TypeDiSettingsTxtService extends SettingsTxtService {
    constructor(
        protected logger: TypeDiLogger,
        protected fileSystem: TypeDiFileSystem,
    ) {
        super();
    }
}
```

Every class uses the class-level _@Service_ decorator. The **global** option means all classes will be instantiated as
singletons in the global scope. The constructor parameters of the _TypeDiSettingsTxtService_ class explicitly state that
it requires one instance of the _TypeDiLogger_ class and one of the _TypeDiFileSystem_ class.

Once we have declared all dependencies, we can use TypeDI containers as follows:

```ts
const container = Container.of();

const logger = container.get(TypeDiLogger);
const fileSystem = container.get(TypeDiFileSystem);
const settingsService = container.get(TypeDiSettingsTxtService);
```

#### Token-Based Injections with TypeDI

Token-based injections bind interfaces to their implementations using a **token** as an intermediary. The only change
in comparison to class-based injections is declaring the appropriate token for each construction parameter using the
_@Inject_ decorator:

```ts
@Service({ global: true })
export class TypeDiLogger extends FakeLogger {}

@Service({ global: true })
export class TypeDiFileSystem extends FakeFileSystem {}

@Service({ global: true })
export class ServiceNamedTypeDiSettingsTxtService extends SettingsTxtService {
    constructor(
        @Inject("logger") protected logger: Logger,
        @Inject("fileSystem") protected fileSystem: FileSystem<string>,
    ) {
        super();
    }
}
```

In addition, we have to construct the instances of the classes we need and **connect** them to the container:

```ts
const container = Container.of();

const logger = new TypeDiLogger();
const fileSystem = new TypeDiFileSystem();

container.set("logger", logger);
container.set("fileSystem", fileSystem);

const settingsService = container.get(ServiceNamedTypeDiSettingsTxtService);
```

### TSyringe

The [TSyringe](https://github.com/microsoft/tsyringe) project is a DI container maintained by Microsoft. It is a
versatile container that supports virtually all standard DI container features, including resolving circular
dependencies. Similar to TypeDI, TSyringe supports [class-based](#class-based-injections-with-tsyringe) and
[token-based](#token-based-injections-with-tsyringe) injections.

#### Class-Based Injections with TSyringe

Developers must mark the target classes with TSyringe's class-level decorators. In the code snippet below, we use the
**@singleton** decorator:

```ts
@singleton()
export class TsyringeLogger implements Logger {
    // ...
}

@singleton()
export class TsyringeFileSystem implements FileSystem {
    // ...
}

@singleton()
export class TsyringeSettingsTxtService extends SettingsTxtService {
    constructor(
        protected logger: TsyringeLogger,
        protected fileSystem: TsyringeFileSystem,
    ) {
        super();
    }
}
```

The TSyringe containers can then resolve dependencies _automatically_:

```ts
const childContainer = container.createChildContainer();

const logger = childContainer.resolve(TsyringeLogger);
const fileSystem = childContainer.resolve(TsyringeFileSystem);
const settingsService = childContainer.resolve(TsyringeSettingsTxtService);
```

#### Token-Based Injections with TSyringe

Similar to other libraries, TSyringe requires programmers to use constructor parameter decorators for **token-based**
injections:

```ts
@singleton()
export class TsyringeLogger implements Logger {
    // ...
}

@singleton()
export class TsyringeFileSystem implements FileSystem {
    // ...
}

@singleton()
export class TokenedTsyringeSettingsTxtService extends SettingsTxtService {
    constructor(
        @inject("logger") protected logger: Logger,
        @inject("fileSystem") protected fileSystem: FileSystem<string>,
    ) {
        super();
    }
}
```

After declaring target classes, we register token-class tuples with the associated lifecycles. In the code snippet
below, we are using a singleton:

```ts
const childContainer = container.createChildContainer();

childContainer.register("logger", TsyringeLogger, { lifecycle: Lifecycle.Singleton });
childContainer.register("fileSystem", TsyringeFileSystem, { lifecycle: Lifecycle.Singleton });

const logger = childContainer.resolve<FakeLogger>("logger");
const fileSystem = childContainer.resolve<FakeFileSystem>("fileSystem");
const settingsService = childContainer.resolve(TokenedTsyringeSettingsTxtService);
```

### NestJS (Server Sided)

[NestJS](https://nestjs.com/) is a framework that uses a custom DI container under the hood. It is possible to run
NestJS as a standalone application as a wrapper over its DI container. It uses decorators and their metadata for
injections. Scoping is allowed, and we can choose from singletons, transient objects, or request-bound objects.

```ts
@Injectable()
export class NestLogger implements Logger {
    // ...
}

@Injectable()
export class NestFileSystem extends FileSystem<string> {
    // ...
}

@Injectable()
export class NestSettingsTxtService extends SettingsTxtService {
    constructor(
        protected logger: NestLogger,
        protected fileSystem: NestFileSystem,
    ) {
        super();
    }
}
```

Next, we defined the **AppModule**, the core class of the application, and specified its dependencies, **providers**:

```ts
@Module({
    providers: [NestLogger, NestFileSystem, NestSettingsTxtService],
})
export class AppModule {}
```

Finally, we can create the application context and get the instances of the aforementioned classes:

```ts
const applicationContext = await NestFactory.createApplicationContext(
    AppModule,
    { logger: false },
);

const logger = applicationContext.get(NestLogger);
const fileSystem = applicationContext.get(NestFileSystem);
const settingsService = applicationContext.get(NestSettingsTxtService);
``` 
