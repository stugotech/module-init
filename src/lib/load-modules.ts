import callback from './callback';
import * as fs from 'fs';
import { Module } from './module';
import * as path from 'path';


/**
 * Options for loading modules.
 */
export interface LoadModulesOptions {
  recursive?: boolean;
  filter?: RegExp;
  resolve?: (module: any) => Module<any> | undefined;
  postResolve?: (module: Module<any>) => void;
};

/**
 * loadModules loads modules from a given file system path.
 */
export async function loadModules(modulePath: string, options?: LoadModulesOptions, modules?: { [name: string]: Module<any> }) {
  if (modules === undefined) {
    modules = {};
  }

  // default options
  options = Object.assign(<LoadModulesOptions>{
    recursive: true,
    filter: /\.js$/,
    resolve: getDefinition,
  }, options || {});

  // make paths relative to working dir (otherwise require might look in unexpected places).
  if (!path.isAbsolute(modulePath)) {
    modulePath = path.resolve('.', modulePath);
  }

  let files = await callback<string[]>(cb => fs.readdir(modulePath, cb));

  for (const file of files) {
    const filePath = path.join(modulePath, file);
    const st = await callback<fs.Stats>(cb => fs.stat(filePath, cb));

    if (st.isDirectory()) {
      if (options.recursive) {
        loadModules(filePath, options, modules);
      }
    } else if (options.filter === undefined || options.filter.test(file)) {
      const module = options.resolve!(require(filePath));

      if (module !== undefined) {
        if (options.postResolve !== undefined) {
          options.postResolve(module);
        }

        if (module.name in modules) {
          throw new Error(`duplicate module name '${module.name}'`);
        }

        modules[module.name] = module;
      }
    }
  }

  return modules;
}


/**
 * Get the definition of a module if defined, or undefined otherwise.
 * @param module The module to load.
 */
export function getDefinition(module: any) : Module<any> | undefined {
  if (module.__esModule && !module.definition) {
    module = module.default;
  }

  if (module && module.definition) {
    return module.definition;
  } else {
    return undefined;
  }
}
