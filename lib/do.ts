import { Task } from "./task";
import { Option, UnwrapNoneError } from "./option";
import { Result } from "./result";
import { isPromiseLike } from "./internals";

class Gen<T, A> implements Generator<T, A> {
  called = false;

  constructor(readonly self: T) {}

  next(a: A): IteratorResult<T, A> {
    return this.called
      ? {
          value: a,
          done: true,
        }
      : ((this.called = true),
        {
          value: this.self,
          done: false,
        });
  }

  return(a: A): IteratorResult<T, A> {
    return {
      value: a,
      done: true,
    };
  }

  throw(e: unknown): IteratorResult<T, A> {
    throw e;
  }

  [Symbol.iterator](): Generator<T, A> {
    return new Gen<T, A>(this.self);
  }
}

class AsyncGen<T, A> implements AsyncGenerator<T, A> {
  called = false;

  constructor(readonly self: T) {}

  async next(a: A): Promise<IteratorResult<T, A>> {
    return this.called
      ? {
          value: a,
          done: true,
        }
      : ((this.called = true),
        {
          value: this.self,
          done: false,
        });
  }

  async return(a: A): Promise<IteratorResult<T, A>> {
    return {
      value: a,
      done: true,
    };
  }

  async throw(e: unknown): Promise<IteratorResult<T, A>> {
    throw e;
  }

  [Symbol.asyncIterator](): AsyncGenerator<T, A> {
    return new AsyncGen<T, A>(this.self);
  }
}

type Monad<E, A> = Option<A> | Result<E, A> | Task<E, A>;

class UnwrapGen<E, A> {
  constructor(readonly value: unknown) {}
  [Symbol.iterator]() {
    return new Gen<this, UnwrapValue<Monad<E, A>>>(this);
  }
  [Symbol.asyncIterator]() {
    return new AsyncGen<this, UnwrapValue<Monad<E, A>>>(this);
  }
}

type UnwrapValue<A> = A extends Option<infer B>
  ? B
  : A extends Result<infer _, infer C>
  ? C
  : A extends Task<infer _, infer D>
  ? D
  : A extends PromiseLike<Result<unknown, infer A>>
  ? A
  : A;

type UnwrapError<A> = A extends Option<unknown>
  ? UnwrapNoneError
  : A extends Result<infer A, unknown>
  ? A
  : A extends Task<infer A, unknown>
  ? A
  : A extends PromiseLike<Result<infer A, unknown>>
  ? A
  : unknown;

export type Unwrapper = <const A>(
  a: A
) => UnwrapGen<UnwrapError<A>, UnwrapValue<A>>;

export function Do<T, Gen extends UnwrapGen<unknown, unknown>>(
  f: ($: Unwrapper) => Generator<Gen, T, any>
): Result<
  [Gen] extends [never]
    ? never
    : [Gen] extends [UnwrapGen<infer E, any>]
    ? E
    : never,
  [Gen] extends [never]
    ? never
    : [Gen] extends [UnwrapGen<any, infer V>]
    ? V
    : never
>;
export function Do<T, Gen extends UnwrapGen<unknown, unknown>>(
  f: ($: Unwrapper) => AsyncGenerator<Gen, T, any>
): Task<
  [Gen] extends [never]
    ? never
    : [Gen] extends [UnwrapGen<infer E, any>]
    ? E
    : never,
  [Gen] extends [never]
    ? never
    : [Gen] extends [UnwrapGen<any, infer V>]
    ? V
    : never
>;
export function Do<T, Gen extends UnwrapGen<unknown, unknown>>(
  f: ($: Unwrapper) => Generator<Gen, T, any> | AsyncGenerator<Gen, T, any>
) {
  const iterator = f((x: unknown) => new UnwrapGen(x));

  const state = iterator.next();
  if (isPromiseLike(state)) {
    // @ts-expect-error
    const run = async (state: any) => {
      return state.done
        ? await unwrap(getGeneratorValue(state.value))
        : run(
            await iterator.next(await unwrap(getGeneratorValue(state.value)))
          );
    };

    return Task.from(async () => run(await state)) as any;
  }

  // @ts-expect-error
  const run = (state: any) => {
    return state.done
      ? unwrap(getGeneratorValue(state.value))
      : run(iterator.next(unwrap(getGeneratorValue(state.value))));
  };

  return Result.from(() => run(state)) as any;
}

function isUnwrapable(x: unknown): x is {
  unwrap: () => unknown;
} {
  return (
    !!x &&
    typeof x === "object" &&
    "unwrap" in x &&
    typeof x.unwrap === "function"
  );
}

function unwrap(x: unknown): unknown {
  return isUnwrapable(x) ? x.unwrap() : x;
}

function getGeneratorValue(x: unknown): unknown {
  return x instanceof UnwrapGen ? x.value : x;
}