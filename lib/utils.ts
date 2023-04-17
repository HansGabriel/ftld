import type { Option } from "./option";
import type { Result } from "./result";
import type { Task } from "./task";
import { Dict, List } from "./collection";
import type { Collection } from "./collection";
import type {
  CollectionLike,
  DictLike,
  ListLike,
  NonEmptyArray,
} from "./types";

export function identity<A>(a: A): A {
  return a;
}

export function isResult<E, A>(value: unknown): value is Result<E, A> {
  return (
    typeof value === "object" &&
    value !== null &&
    "__tag" in value &&
    (value.__tag === "Ok" || value.__tag === "Err")
  );
}

export function isOption<A>(value: unknown): value is Option<A> {
  return (
    typeof value === "object" &&
    value !== null &&
    "__tag" in value &&
    (value.__tag === "Some" || value.__tag === "None")
  );
}

export function isTask<E, A>(value: unknown): value is Task<E, A> {
  return (
    typeof value === "object" &&
    value !== null &&
    "__tag" in value &&
    value.__tag === "Task"
  );
}

export function isCollection<A>(value: unknown): value is Collection<A> {
  return (
    typeof value === "object" &&
    value !== null &&
    "__tag" in value &&
    (value.__tag === "Dict" || value.__tag === "List")
  );
}

export function isCollectionLike<A>(a: unknown): a is CollectionLike<A> {
  return (
    Array.isArray(a) ||
    a instanceof List ||
    a instanceof Dict ||
    a instanceof Set ||
    a instanceof Map ||
    (typeof a === "object" && a !== null && !Array.isArray(a))
  );
}

export function isListLike<A>(a: unknown): a is ListLike<A> {
  return Array.isArray(a) || a instanceof List || a instanceof Set;
}

export function isDictLike<A>(a: unknown): a is DictLike<A> {
  return (
    a instanceof Dict ||
    a instanceof Map ||
    (typeof a === "object" &&
      a !== null &&
      !Array.isArray(a) &&
      !(a instanceof Set))
  );
}

export function isNonEmptyArray<A>(a: unknown): a is NonEmptyArray<A> {
  return Array.isArray(a) && a.length > 0;
}
