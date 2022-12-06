import { pipe } from '@fp-ts/data/Function';
import * as P from '../src/index';

const numbersE = pipe(
  P.many1(pipe(P.decimal, P.andThenDiscard(P.spaces))),
  P.andThenDiscard(P.eof)
);

const exampleInput1 = "1 2   3 4   5   ";

console.log(pipe(exampleInput1, P.evalToEither(numbersE)));

const listOfNumbersE = pipe(
  P.char('[' as P.Char),
  P.andThen(P.sepBy1(P.decimal, pipe(P.spaces, P.andThen(P.string(',')), P.andThen(P.spaces)))),
  P.andThenDiscard(P.char(']' as P.Char)),
  P.andThenDiscard(P.eof),
);

const exampleInput2 = "[1, 2,   3,   4,   5]";

console.log(pipe(exampleInput2, P.evalToEither(listOfNumbersE)));

const addingNumbersE = pipe(
  P.sepBy1(P.decimal, pipe(P.spaces, P.andThen(P.char('+' as P.Char)), P.andThen(P.spaces))),
  P.andThenDiscard(P.eof),
  P.map((ns) => ns.reduce((a, b) => a + b, 0))
);

const exampleInput3 = "1 + 2  +   3 +   4  + 5";

console.log(pipe(exampleInput3, P.evalToEither(addingNumbersE)));
