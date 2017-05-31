import * as fs from 'mz/fs';
import { Module } from './module';
import * as path from 'path';


/**
 * Options for loading modules.
 */
export interface LoadModulesOptions {
  recursive?: boolean;
  filter?: RegExp;
  resolve?: (module: any, filename: string) => Module<any> | undefined;
  postResolve?: (module: Module<any>, filename: string) => void;
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

  let files = await fs.readdir(modulePath);

  await Promise.all(files.map(async (file) => {
    // not sure why TSC thinks these will be null but override
    options = options!;
    modules = modules!;
    
    const filePath = path.join(modulePath, file);
    const st = await fs.stat(filePath);

    if (st.isDirectory()) {
      if (options.recursive) {
        await loadModules(filePath, options, modules);
      }
    } else if (options.filter === undefined || options.filter.test(file)) {
      const module = options.resolve!(require(filePath), filePath);

      if (module !== undefined) {
        if (options.postResolve !== undefined) {
          options.postResolve(module, filePath);
        }

        if (module.name in modules) {
          throw new Error(`duplicate module name '${module.name}'`);
        }

        modules[module.name] = module;
      }
    }
  }));

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
