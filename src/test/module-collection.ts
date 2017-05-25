import test from 'ava';
import { define, ModuleCollection } from '../lib';

test('it loads modules in correct order', async (it) => {
  const a = define('a', [], [], (ctx: string) => {});
  const g = define('g', [], [], (ctx: string) => {});
  const f = define('f', [], [], (ctx: string) => {});
  const e = define('e', [f], [], (ctx: string) => {});
  const d = define('d', [f], [a], (ctx: string) => {});
  const c = define('c', [], [a], (ctx: string) => {});
  const b = define('b', [e], [], (ctx: string) => {});

  const collection = new ModuleCollection([a, b, c, d, e, f, g]);
  const stages = collection.getInitStages().map(s => s.map(x => x.name).sort());

  it.deepEqual(stages, [
    ['c', 'f', 'g'],
    ['d', 'e'],
    ['a', 'b'],
  ]);
});

test('it detects cycles', async (it) => {
  const g = define('g', [], [], (ctx: string) => {});
  const f = define('f', [], [], (ctx: string) => {});
  const e = define('e', [f], [], (ctx: string) => {});
  const d = define('d', [f], [], (ctx: string) => {});
  const c = define('c', [], [], (ctx: string) => {});
  const b = define('b', [e], [], (ctx: string) => {});
  const a = define('a', [c, d], [], (ctx: string) => {});
  f.needs.push(a);

  const collection = new ModuleCollection([a, b, c, d, e, f, g]);

  it.throws(
    () => collection.getInitStages(), 
    err => (err instanceof Error) && err.message === 'found circular reference a -> f -> d -> a'
  );
});

test('it inits modules in correct order', async (it) => {
  const inits: string[] = [];
  const g = define('g', [], [], (ctx: string) => { inits.push('g'); });
  const e = define('e', [], [], (ctx: string) => { inits.push('e'); });
  const f = define('f', [], [e], (ctx: string) => { inits.push('f'); });
  const d = define('d', [f], [], (ctx: string) => { inits.push('d'); });
  const c = define('c', [], [], (ctx: string) => { inits.push('c'); });
  const b = define('b', [e], [], (ctx: string) => { inits.push('b'); });
  const a = define('a', [c, d], [], (ctx: string) => { inits.push('a'); });

  const collection = new ModuleCollection([a, b, c, d, e, f, g]);
  await collection.init('hello');

  it.deepEqual(inits, [
    'g', 'f', 'c',
    'e', 'd',
    'b', 'a',
  ]);
});