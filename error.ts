/**
 * Map of standard HTTP status codes to their default messages.
 */
const HTTP_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  509: 'Bandwidth Limit Exceeded',
  510: 'Not Extended',
  511: 'Network Authentication Required',
};

/**
 * The Base HttpError Class with Static Helpers
 */
export class HttpError extends Error {
  public statusCode: number;
  public status: number;

  constructor(statusCode: number, message?: string) {
    const finalMessage = message || HTTP_MESSAGES[statusCode] || 'Unknown Error';
    super(finalMessage);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode;

    // Standard fix for extending built-ins in TS
    Object.setPrototypeOf(this, HttpError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // 4xx Errors
  static BadRequest: ErrorBuilder = (msg?: string) => new HttpError(400, msg);
  static Unauthorized: ErrorBuilder = (msg?: string) => new HttpError(401, msg);
  static PaymentRequired: ErrorBuilder = (msg?: string) => new HttpError(402, msg);
  static Forbidden: ErrorBuilder = (msg?: string) => new HttpError(403, msg);
  static NotFound: ErrorBuilder = (msg?: string) => new HttpError(404, msg);
  static MethodNotAllowed: ErrorBuilder = (msg?: string) => new HttpError(405, msg);
  static NotAcceptable: ErrorBuilder = (msg?: string) => new HttpError(406, msg);
  static ProxyAuthenticationRequired: ErrorBuilder = (msg?: string) => new HttpError(407, msg);
  static RequestTimeout: ErrorBuilder = (msg?: string) => new HttpError(408, msg);
  static Conflict: ErrorBuilder = (msg?: string) => new HttpError(409, msg);
  static Gone: ErrorBuilder = (msg?: string) => new HttpError(410, msg);
  static LengthRequired: ErrorBuilder = (msg?: string) => new HttpError(411, msg);
  static PreconditionFailed: ErrorBuilder = (msg?: string) => new HttpError(412, msg);
  static PayloadTooLarge: ErrorBuilder = (msg?: string) => new HttpError(413, msg);
  static URITooLong: ErrorBuilder = (msg?: string) => new HttpError(414, msg);
  static UnsupportedMediaType: ErrorBuilder = (msg?: string) => new HttpError(415, msg);
  static RangeNotSatisfiable: ErrorBuilder = (msg?: string) => new HttpError(416, msg);
  static ExpectationFailed: ErrorBuilder = (msg?: string) => new HttpError(417, msg);
  static ImATeapot: ErrorBuilder = (msg?: string) => new HttpError(418, msg);
  static MisdirectedRequest: ErrorBuilder = (msg?: string) => new HttpError(421, msg);
  static UnprocessableEntity: ErrorBuilder = (msg?: string) => new HttpError(422, msg);
  static Locked: ErrorBuilder = (msg?: string) => new HttpError(423, msg);
  static FailedDependency: ErrorBuilder = (msg?: string) => new HttpError(424, msg);
  static TooEarly: ErrorBuilder = (msg?: string) => new HttpError(425, msg);
  static UpgradeRequired: ErrorBuilder = (msg?: string) => new HttpError(426, msg);
  static PreconditionRequired: ErrorBuilder = (msg?: string) => new HttpError(428, msg);
  static TooManyRequests: ErrorBuilder = (msg?: string) => new HttpError(429, msg);
  static RequestHeaderFieldsTooLarge: ErrorBuilder = (msg?: string) => new HttpError(431, msg);
  static UnavailableForLegalReasons: ErrorBuilder = (msg?: string) => new HttpError(451, msg);

  // 5xx Errors
  static InternalServerError: ErrorBuilder = (msg?: string) => new HttpError(500, msg);
  static NotImplemented: ErrorBuilder = (msg?: string) => new HttpError(501, msg);
  static BadGateway: ErrorBuilder = (msg?: string) => new HttpError(502, msg);
  static ServiceUnavailable: ErrorBuilder = (msg?: string) => new HttpError(503, msg);
  static GatewayTimeout: ErrorBuilder = (msg?: string) => new HttpError(504, msg);
  static HTTPVersionNotSupported: ErrorBuilder = (msg?: string) => new HttpError(505, msg);
  static VariantAlsoNegotiates: ErrorBuilder = (msg?: string) => new HttpError(506, msg);
  static InsufficientStorage: ErrorBuilder = (msg?: string) => new HttpError(507, msg);
  static LoopDetected: ErrorBuilder = (msg?: string) => new HttpError(508, msg);
  static BandwidthLimitExceeded: ErrorBuilder = (msg?: string) => new HttpError(509, msg);
  static NotExtended: ErrorBuilder = (msg?: string) => new HttpError(510, msg);
  static NetworkAuthenticationRequired: ErrorBuilder = (msg?: string) => new HttpError(511, msg);
}
type ErrorBuilder = (msg?: string) => HttpError

