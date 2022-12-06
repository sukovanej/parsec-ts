import { TypeLambda } from "@fp-ts/core/HKT";
import * as bicovariant_ from '@fp-ts/core/typeclass/Bicovariant';

export type Tuple<A, B> = readonly [A, B];

export interface TupleTypeLambda extends TypeLambda {
  readonly type: Tuple<this["Out1"], this["Target"]>;
}

export const bimap = <E1, E2, A, B>(f: (e: E1) => E2, g: (a: A) => B) => ([e, a]: Tuple<E1, A>): Tuple<E2, B> => [f(e), g(a)];

/**
 * @category instances
 * @since 1.0.0
 */
export const Invariant: bicovariant_.Bicovariant<TupleTypeLambda> = {
  bimap
}

export const map = bicovariant_.map(Invariant);
export const mapLeft = bicovariant_.mapLeft(Invariant);
