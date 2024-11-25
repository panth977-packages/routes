/**
 * # Endpoint
 * - {@link ROUTES.Endpoint}
 * - {@link ROUTES.Middleware.build}
 * - {@link ROUTES.Http.build}
 * - {@link ROUTES.Sse.build}
 * 
 * # Schemas
 * - {@link ROUTES.zMiddlewareInput}
 * - {@link ROUTES.zMiddlewareOutput}
 * - {@link ROUTES.zHttpInput}
 * - {@link ROUTES.zHttpOutput}
 * - {@link ROUTES.zSseInput}
 * - {@link ROUTES.zSseYield}
 * - {@link ROUTES.WRAPPERS.Debug}
 * - {@link ROUTES.WRAPPERS.MemoData}
 * - {@link ROUTES.WRAPPERS.SafeParse}
 * 
 * # Helper
 * - {@link ROUTES.getRouteDocJson}
 * - {@link ROUTES.getEndpointsFromBundle}
 * 
 * @module
 * 
 * @example
 * ```ts
 * import { ROUTES } from "@panth977/routes";
 *
 * ROUTES.{api}
 * ```
 */

export * as ROUTES from "./exports.ts";
