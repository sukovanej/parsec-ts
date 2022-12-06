import { TypeLambda } from "@fp-ts/core/HKT";
import * as RA from "@fp-ts/data/ReadonlyArray"
import * as E from "@fp-ts/data/Either"
import * as flatMap_ from "@fp-ts/core/typeclass/FlatMap"
import * as invariant_ from "@fp-ts/core/typeclass/Invariant"
import * as covariant_ from "@fp-ts/core/typeclass/Covariant"
import * as chainable_ from "@fp-ts/core/typeclass/Chainable"
import * as semiProduct_ from "@fp-ts/core/typeclass/SemiProduct"
import * as product_ from "@fp-ts/core/typeclass/Product"
import * as semiCoproduct_ from "@fp-ts/core/typeclass/SemiCoproduct"
import * as coproduct_ from "@fp-ts/core/typeclass/Coproduct"
import * as semiApplicative_ from "@fp-ts/core/typeclass/SemiApplicative"
import * as applicative_ from "@fp-ts/core/typeclass/Applicative"
import * as of_ from "@fp-ts/core/typeclass/Of"
import { pipe } from "@fp-ts/data/Function";
import * as Tuple from "./Tuple";

export interface Parser<A> {
  (s: String): ReadonlyArray<Tuple.Tuple<A, String>>;
}

export interface ParserTypeLambda extends TypeLambda {
  readonly type: Parser<this['Target']>;
}

export const evalToEither = <A>(p: Parser<A>) => (input: string): E.Either<string, A> => pipe(
  E.of(p(input)),
  E.flatMap((results) => pipe(
    E.of(results),
    E.filter(
      (r) => r.length === 1,
      () => {
        const formatted = results.map(([x, xs]) => `[x=${x}, xs=${xs}]`).join(";;");
        return `${results.length} results returned returned: ${formatted}`;
      }
    )
  )),
  E.map((results) => results[0]),
  E.filter(([_, remaining]) => remaining.length === 0, () => `"Remaining string after parsing`),
  E.map(([result]) => result)
);

export const of = <A>(a: A): Parser<A> => (s) => [[a, s]];

export const flatMap = <A, B>(f: (a: A) => Parser<B>) => (self: Parser<A>): Parser<B> =>
  (s) => pipe(self(s), RA.flatMap(([x, xs]) => f(x)(xs)));

export const map = <A, B>(f: (a: A) => B) => (self: Parser<A>): Parser<B> =>
  (s) => pipe(self(s), RA.map(([x, xs]) => [f(x), xs]));

export const product = <B>(that: Parser<B>) => <A>(self: Parser<A>): Parser<readonly [A, B]> =>
  (s) => pipe(
    self(s),
    RA.flatMap(([x, xs]) => pipe(
      that(xs),
      RA.map(Tuple.mapLeft((y) => [x, y]))
    )),
  );

export const productMany =
  <A>(that: Iterable<Parser<A>>) =>
  (self: Parser<A>): Parser<readonly [A, ...ReadonlyArray<A>]> =>
    pipe(
      Array.from(that),
      RA.reduce(
        map(RA.of)(self),
        (results, current) => pipe(
          current,
          product(results),
          map(([a, rest]) => RA.prepend(a)(rest)),
        )
      )
    );

export const productAll = <A>(collection: Iterable<Parser<A>>): Parser<ReadonlyArray<A>> =>
  pipe(Array.from(collection), RA.match(() => of([]), (head, tail) => productMany(tail)(head)));

export const zero = <A>(): Parser<A> => (_) => [];

export const coproductAll = <A>(collection: Iterable<Parser<A>>): Parser<A> =>
  (s) => pipe(Array.from(collection), RA.reduce([] as ReadonlyArray<Tuple.Tuple<A, String>>, (acc, a) => a(s).concat(acc)));

export const coproduct = <B>(that: Parser<B>) => <A>(self: Parser<A>): Parser<A | B> =>
  (s) => (self(s) as ReadonlyArray<Tuple.Tuple<A | B, String>>).concat(that(s));

export const coproductMany = <A>(collection: Iterable<Parser<A>>) => (self: Parser<A>): Parser<A> =>
  coproductAll(RA.prepend(self)(Array.from(collection)));

export const imap = covariant_.imap<ParserTypeLambda>(map);

/**
 * @category instances
 * @since 1.0.0
 */
export const Invariant: invariant_.Invariant<ParserTypeLambda> = {
  imap
}

/**
 * @category instances
 * @since 1.0.0
 */
export const FlatMap: flatMap_.FlatMap<ParserTypeLambda> = {
  flatMap
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Covariant: covariant_.Covariant<ParserTypeLambda> = {
  ...Invariant,
  map
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Of: of_.Of<ParserTypeLambda> = {
  of
}

/**
 * @category instances
 * @since 1.0.0
 */
export const SemiProduct: semiProduct_.SemiProduct<ParserTypeLambda> = {
  ...Invariant,
  product,
  productMany,
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Product: product_.Product<ParserTypeLambda> = {
  ...SemiProduct,
  ...Of,
  productAll
}

/**
 * @category instances
 * @since 1.0.0
 */
export const SemiApplicative: semiApplicative_.SemiApplicative<ParserTypeLambda> = {
  ...SemiProduct,
  ...Covariant
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Applicative: applicative_.Applicative<ParserTypeLambda> = {
  ...SemiApplicative,
  ...Product,
}

/**
 * @category instances
 * @since 1.0.0
 */
export const SemiCoproduct: semiCoproduct_.SemiCoproduct<ParserTypeLambda> = {
  ...Invariant,
  coproduct,
  coproductMany
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Coproduct: coproduct_.Coproduct<ParserTypeLambda> = {
  ...SemiCoproduct,
  zero,
  coproductAll,
}

/**
 * @category instances
 * @since 1.0.0
 */
export const Chainable: chainable_.Chainable<ParserTypeLambda> = {
  ...FlatMap,
  ...Covariant
}

export const ap = semiApplicative_.ap(SemiApplicative);
export const Do = of_.Do(Of);
export const bind = chainable_.bind(Chainable);

const _let = covariant_.let(Covariant);
export { _let as let };

export const andThen = semiApplicative_.andThen(SemiApplicative);
export const andThenDiscard = semiApplicative_.andThenDiscard(SemiApplicative);

// combinators

export type Char = string & { readonly _tag: unique symbol };

export const charsToString = (c: ReadonlyArray<Char>): string => c.join("")

export const item: Parser<Char> =
  (s) => s.length === 0 ? [] : [[s[0] as Char, s.slice(1)]];

export const sat = (p: (ch: Char) => boolean): Parser<Char> =>
  pipe(item, flatMap((s) => p(s) ? of(s) : zero()));

export const char = (c: Char): Parser<Char> => sat((i) => i == c);

export const space: Parser<Char> = sat((i) => i == ' ');

export const string = (str: string): Parser<string> =>
  (s) => s.startsWith(str) ? [[str, s.slice(str.length)]] : [];

export const many = <A>(p: Parser<A>): Parser<ReadonlyArray<A>> =>
  pipe(many1(p), coproduct(of([])));

export const many1 = <A>(p: Parser<A>): Parser<RA.NonEmptyReadonlyArray<A>> =>
  pipe(
    Do,
    bind('a', () => p),
    bind('as', () => many(p)),
    map(({a, as}) => RA.prepend(a)(as))
  );

const isDigit = (c: Char) => c >= '0' && c <= '9';

export const decimal: Parser<number> = pipe(
  many1(sat(isDigit)),
  map((n) => parseInt(charsToString(n), 10))
);

export const spaces: Parser<string> = pipe(many(space), map(charsToString));
export const spaces1: Parser<string> = pipe(many1(space), map(charsToString));

export const eof: Parser<string> = (s) => s === "" ? [["", ""]] : [];

export const sepBy1 = <A, _>(p: Parser<A>, sep: Parser<_>): Parser<RA.NonEmptyReadonlyArray<A>> => pipe(
  Do,
  bind('first', () => p),
  bind('rest', () => many(pipe(sep, andThen(p)))),
  map(({ first, rest }) => RA.prepend(first)(rest))
);
