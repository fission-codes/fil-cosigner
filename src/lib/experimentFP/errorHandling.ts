import { tryCatch, left, right, isLeft, Either } from "fp-ts/lib/Either";

// using fp-ts Either for error handling
//https://gcanti.github.io/fp-ts/modules/Either.ts.html

// sidenote; https://hvalls.dev/posts/intro-functional-fpts

// other https://medium.com/@cb.yannick/functional-programming-with-typescript-part-2-471b9b91d0bb

// const tryCatch = <T, E>(fn: () => T, onError: (error: unknown) => E) => {
//   try {
//     return right(fn());
//   } catch (error) {
//     return left(onError(error));
//   }
// };

export class InvalidURLError extends Error {}
const makeURLFromString = (str: string) =>
  tryCatch(
    () => str,
    () => new InvalidURLError()
  );

export class SomeError extends Error {}
const myfunc = (
  maybeType: string
): Either<InvalidURLError | SomeError, Promise<any>> => {
  const urlResult = makeURLFromString(maybeType);
  // early return the error
  if (isLeft(urlResult)) return urlResult;

  const url = urlResult.right;
  if (url !== "mything") return left(new SomeError());

  return right(fetch(url));
}

//---
// alternative repo is https://github.com/supermacro/neverthrow
// which focuses explicitly on Result<ok, err> and monads thereof
// not as many stars and community as fp-ts though
