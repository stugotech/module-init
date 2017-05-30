import { Module, InitFunction } from './module';
import { DirectedGraph } from '@stugotech/directed-graph';
import once from './once';


/**
 * ModuleCollection is a collection of modules that can be initialised in dependency order.
 */
export class ModuleCollection<TInitContext> {
  private readonly graph: DirectedGraph<Module<TInitContext>>;

  /**
   * Create a new instance of ModuleCollection.
   * @param modules List of modules to load.
   */
  constructor(modules?: Iterable<Module<TInitContext>>) {
    this.graph = new DirectedGraph<Module<TInitContext>>();

    if (modules !== undefined) {
      this.add(modules);
    }
  }


  /**
   * Add one or more modules.
   * @param modules List of modules to add, or a single module.
   */
  add(modules: Iterable<Module<TInitContext>>|Module<TInitContext>) {
    if (!isIterable(modules)) {
      modules = [modules];
    }

    for (let module of modules) {
      this.graph.addVertex(module);

      for (let need of module.needs) {
        this.graph.addEdge(module, need);
      }
      for (let neededBy of module.neededBy) {
        this.graph.addEdge(neededBy, module);
      }
    }
  }


  /**
   * Initialise the collection of modules in the correct order.
   * @param context The initialisation context.
   */
  init = once(async (context: TInitContext) => {
    const stages = this.getInitStages();
    for (let stage of stages) {
      // load each stage in parallel
      await Promise.all(stage.map(x => x.init(context)));
    }
  });


  /**
   * Group the modules into stages for initialisation in sequence.
   */
  getInitStages() : Module<TInitContext>[][] {
    const rootModule = new Module<TInitContext>('__root__', [], [], () => {});
    const graph = this.graph.shallowClone();
    
    for (let leaf of graph.leaves()) {
      graph.addEdge(leaf, rootModule);
    }

    const adjacencies = graph.reverse().getAdjacencyToNode(rootModule);

    // group modules into stages by path length
    const stages = [...adjacencies.entries()]
      .reduce((map: Module<TInitContext>[][], kv) => {
        (map[kv[1]] = map[kv[1]] || []).push(kv[0]);
        return map;
      }, [])

    // drop initial stage (root node)
    stages.shift();
    return stages;
  }
};



function isIterable<T>(obj: T|Iterable<T>): obj is Iterable<T> {
  return obj != null && typeof (obj as any)[Symbol.iterator] === 'function';
}