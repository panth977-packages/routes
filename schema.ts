import { z } from "zod";

type TakeIfDefined<T extends Record<never, z.ZodType | undefined>> =
  z.ZodObject<{
    [k in {
      [k in keyof T]: T[k] extends z.ZodType ? k : never;
    }[keyof T]]: T[k] extends z.ZodType ? T[k] : never;
  }>;

function takeIfDefined<T extends Record<never, z.ZodType | undefined>>(
  obj: T
): TakeIfDefined<T> {
  const ret: Record<string, z.ZodType> = {};
  for (const k in obj) {
    const v = obj[k];
    if (v instanceof z.ZodType) {
      ret[k] = v;
    }
  }
  return z.object(ret) as never;
}
const instance = Symbol();
export function MiddlewareInput<
  H extends undefined | z.AnyZodObject = undefined,
  Q extends undefined | z.AnyZodObject = undefined
>(shape: { headers?: H; query?: Q }): TakeIfDefined<{ headers: H; query: Q }> {
  const ret = takeIfDefined(shape as { headers: H; query: Q });
  Object.assign(ret, { [instance]: MiddlewareInput });
  return ret;
}
export function MiddlewareOutput<
  H extends undefined | z.AnyZodObject
>(shape: {
  headers?: H;
}): TakeIfDefined<{ headers: H }> {
  const ret = takeIfDefined(shape as { headers: H });
  Object.assign(ret, { [instance]: MiddlewareOutput });
  return ret;
}
export function HttpInput<
  H extends undefined | z.AnyZodObject = undefined,
  Q extends undefined | z.AnyZodObject = undefined,
  P extends undefined | z.AnyZodObject = undefined,
  B extends undefined | z.ZodType = undefined
>(shape: {
  headers?: H;
  path?: P;
  query?: Q;
  body?: B;
}): TakeIfDefined<{ headers: H; path: P; query: Q; body: B }> {
  const ret = takeIfDefined(
    shape as { headers: H; path: P; query: Q; body: B }
  );
  Object.assign(ret, { [instance]: HttpInput });
  return ret;
}
export function HttpOutput<
  H extends undefined | z.AnyZodObject = undefined,
  B extends undefined | z.ZodType = undefined
>(shape: { headers?: H; body?: B }): TakeIfDefined<{ headers: H; body: B }> {
  const ret = takeIfDefined(shape as { headers: H; body: B });
  Object.assign(ret, { [instance]: HttpOutput });
  return ret;
}
export function SseInput<
  P extends undefined | z.AnyZodObject = undefined,
  Q extends undefined | z.AnyZodObject = undefined
>(shape: { path?: P; query?: Q }): TakeIfDefined<{ path: P; query: Q }> {
  const ret = takeIfDefined(shape as { path: P; query: Q });
  Object.assign(ret, { [instance]: SseInput });
  return ret;
}
export function SseYield<Y extends undefined | z.ZodString = undefined>(
  _yield?: Y
): z.ZodString {
  const ret = _yield ?? z.string();
  Object.assign(ret, { [instance]: SseYield });
  return ret;
}
export function is<R extends z.ZodType>(
  schema: z.ZodType,
  is: (...arg: any) => R
): schema is R {
  return instance in schema ? schema[instance] === is : false;
}
