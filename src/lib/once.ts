/**
 * Run an async function only once.
 * @param init The function to run once.
 */
export default function once<TContext>(init: (context: TContext) => Promise<void>) {
  let promise: Promise<void> | null = null;
  return async function(context: TContext) {
    if (promise === null) {
      promise = init(context);
    }
    return promise;
  };
}