# module-init

Initialisation system for easy module loading.

## Get it

Download from NPM:

    npm install --save @stugotech/module-init


## Use it

## Define a module

Use the `define` function to define a new module.

```typescript
import { define } from 'module-init';
import * as dependency from './dependency';
import * as after from './after';


export const definition = define('modulename', [dependency.definition], [after.definition], async () => {
  // init code here
});
```

This makes `dependency` a dependency of the current module, and the current module a dependency of `after`.


## Load a directory of modules

Use [require-all](https://www.npmjs.com/package/require-all):

```typescript
import * as requireAll from 'require-all';
import { ModuleCollection, getDefinition } from 'module-init';

// load an object like { module1: module2.definition, module2: module2.definition }
const moduleMap = requireAll({
  dirname: 'modules',
  recursive: true, 
  filter: /^(.*).ts$/,
  excludeDirs: options.excludeDirs,
  resolve: getDefinition,
});

const modules = new ModuleCollection<string>(Object.values(moduleMap));
await modules.init('hello world');
```