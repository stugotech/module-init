
/**
 * InitFunciton is a function for initialising a module which can be async or not.
 */
export type InitFunction<TInitContext> = (context: TInitContext) => PromiseLike<void> | void;


/**
 * Module represents a module definition.
 */
export class Module<TInitContext> {
  constructor(
    public name: string, 
    public needs: Module<TInitContext>[], 
    public neededBy: Module<TInitContext>[], 
    public init: InitFunction<TInitContext>) {
  }

  toString() {
    return this.name;
  }
}


/**
 * Define a module.
 * @param name The name of the module.
 * @param needs Modules to initialise the current one.
 * @param neededBy Modules to initialise after the current one.
 * @param init The init function for the module, which will get passed the init context.
 */
export function define<TInitContext>(
  name: string, needs: Module<TInitContext>[], neededBy: Module<TInitContext>[], init: InitFunction<TInitContext>
) {
  return new Module<TInitContext>(name, needs, neededBy, init);
}


/**
 * Get the definition of a module if defined, or undefined otherwise.
 * @param module The module to load.
 */
export function getDefinition(module: any) : InitFunction<any> | undefined {
  if (module.__esModule && !module.definition) {
    module = module.default;
  }

  if (module && module.definition) {
    return module.definition;
  } else {
    return undefined;
  }
}