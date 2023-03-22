---
title: How to Set up Basic Node.js + Express.js Server with TypeScript
layout: docs
permalink: /docs/handbook/node-express-with-typescript.html
oneline: Write Express in TypeScript
---

## Getting Started

First things first, we need to create the directory for our application:

```bash
mkdir express-typescript
```

Time to set up our `package.json` file where we can define all our dependencies as well as executable scripts.

```bash
npm init
```

Once this script is run, it will ask us the following questions:

```bash
package name: (src) express-typescript
version: (1.0.0)
description:
entry point: index.ts
test command:
git repository:
keywords:
author:
license: (ISC)
```

Feel free to provide the correct details. For now, the only information we cared to provide is the `package name` and
the `entry point` set to **index.ts**.

## Installing Dependencies

Since we are going to work with Express.js, we need to install Express.

```bash
npm i --save-dev express
```

We need to install TypeScript as well as Express types as part of the dev dependencies to take advantage of TypeScript

```bash
npm i --save-dev typescript @types/express
```

## Create Minimal Server with Express.js and TypeScript

Let's create what could be considered the most basic server using Express.js. Inside the `src` folder, create an
**index.ts** file and copy the following code:

```typescript
import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
```

As you notice, it will be a simple GET API endpoint returning a message.

## Running TypeScript Files in Node.js: Understanding the Process

First, it is important for us to understand the process that happens to run TypeScript files in node.js. Previously, we 
created a simple server inside the `index.ts`. If we were working with plain JavaScript, a similar code could be written
in a `js` file such as `index.js`. Normally, we will run a `js` file using the node command.

```bash
node src/index.js
```

If we try to do something similar with `index.ts` file, the terminal will fail due to syntax errors as we are writing
code in TypeScript.

```bash
// it will fail
node src/index.ts
```

What we need to do is to compile our TypeScript code into JavaScript code, and we are going to do that using the `tsc` 
command which it is available after installing typescript dependency in the project.

```bash
npx tsc src/index.ts
```

This will generate an `index.js` file. Now that we have our JavaScript file, we can use `node` to run our code.

```bash
node src/index.js
```

### Running TypeScript Files in Node.js: Quick Process

There is a package available called [ts-node](https://www.npmjs.com/package/ts-node) which allows executing our
TypeScript file in node. Therefore, we are going to install `ts-node` as part of our development dependencies.

```bash
npm i --save-dev ts-node
```

Once the package is installed, we can run our project with only one command.

```bash
npx ts-node src/index.ts
```

The best thing is that we don't see any `index.js` file generated anymore

## Setting up TypeScript Configuration

The **tsconfig.json** file specifies the root files and the compiler options required to compile a TypeScript project. 
Without it, our TypeScript project would still feel as a JavaScript project because we are not enforcing the usage of
types in our codebase. Therefore, we are going to create a `tsconfig.json` file in the root folder of our project. Once 
this is done, add the following configuration:

```json
{
  "compilerOptions": {
      "module": "commonjs",
      "esModuleInterop": true,
      "allowSyntheticDefaultImports": true,
      "target": "es6",
      "noImplicitAny": true,
      "moduleResolution": "node",
      "sourceMap": true,
      "outDir": "dist",
      "baseUrl": ".",
      "paths": {
          "*": [
              "node_modules/*",
              "src/types/*"
          ]
      },
  },
  "include": [
      "src/**/*"
  ]
}
```

## Setting Up Scripts in the package.json

Now that we understand how to run TypeScript files, we can set up a start script in the package.json for our
application.

```json
"scripts": {
    "start": "npx ts-node src/index.ts"
},
```

Once we save, we can open the terminal and run `npm run start` and we will notice our project is running.
