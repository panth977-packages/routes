/**
 * # Endpoint
 * - {@link ROUTES.Endpoint}
 * - {@link ROUTES.Middleware.build}
 * - {@link ROUTES.Http.build}
 * - {@link ROUTES.Sse.build}
 * 
 * # Schemas
 * - {@link ROUTES.z.MiddlewareInput}
 * - {@link ROUTES.z.MiddlewareOutput}
 * - {@link ROUTES.z.HttpInput}
 * - {@link ROUTES.z.HttpOutput}
 * - {@link ROUTES.z.SseInput}
 * - {@link ROUTES.z.SseYield}
 * - {@link ROUTES.z.is}
 * 
 * # Helper
 * - {@link ROUTES.getRouteDocJson}
 * - {@link ROUTES.getEndpointsFromBundle}
 * - {@link ROUTES.execute}
 * - {@link ROUTES.pathParser}
 * 
 * # Code Generation
 * - {@link ROUTES.CodeGen.genJsCode}
 * - {@link ROUTES.CodeGen.genTsCode}
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
