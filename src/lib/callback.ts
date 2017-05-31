export type NodeCallback<T> = (err: Error, result: T) => void;

export default function callback<T>(fn: (cb: NodeCallback<T>) => void) : PromiseLike<T> {
  return new Promise((resolve, reject) => {
    fn((err, res) => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};