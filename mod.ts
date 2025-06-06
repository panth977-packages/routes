/**
 * # Endpoint
 * - {@link R.Endpoint}
 *
 * # Middleware
 * - {@link R.syncFuncMiddleware}
 * - {@link R.asyncFuncMiddleware}
 * - {@link R.asyncCbMiddleware}
 * - {@link R.asyncCancelableCbMiddleware}
 *
 * # Http
 * - {@link R.syncFuncHttp}
 * - {@link R.asyncFuncHttp}
 * - {@link R.asyncCbHttp}
 * - {@link R.asyncCancelableCbHttp}
 *
 * # Sse
 * - {@link R.subsCbSse}
 * - {@link R.subsCancelableCbSse}
 *
 * # Context & Execution
 * - {@link R.HttpContext}
 * - {@link R.HttpExecutor}
 * - {@link R.SseContext}
 * - {@link R.SseExecutor}
 *
 * # Utils
 * - {@link R.generateOpenAPI}
 * - {@link R.getEndpointsFromBundle}
 *
 * @module
 *
 * @example
 * ```ts
 * import { R } from "@panth977/routes";
 *
 * R.{api}
 * ```
 */

import * as R from "./exports.ts";
export { R };
