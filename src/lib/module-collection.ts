import { Module, InitFunction } from './module';
import { DirectedGraph } from '@stugotech/directed-graph';
import once from './once';


/**
 * ModuleCollection is a collection of modules that can be initialised in dependency order.
 */
export class ModuleCollection<TInitContext> {
  private rootModule: Module<TInitContext>;
  private readonly graph: DirectedGraph<Module<TInitContext>>;

  /**
   * Create a new instance of ModuleCollection.
   * @param modules List of modules to load.
   */
  constructor(modules: Iterable<Module<TInitContext>>) {
    this.rootModule = new Module<TInitContext>('__root__', [], [], () => {});
    const graph = new DirectedGraph<Module<TInitContext>>();

    for (let module of modules) {
      graph.addVertex(module);

      for (let need of module.needs) {
        graph.addEdge(module, need);
      }
      for (let neededBy of module.neededBy) {
        graph.addEdge(neededBy, module);
      }
    }

    for (let leaf of graph.leaves()) {
      graph.addEdge(leaf, this.rootModule);
    }

    this.graph = graph.reverse();
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
    const adjacencies = this.graph.getAdjacencyToNode(this.rootModule);

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