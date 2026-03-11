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
  static BadRequest = (msg?: string) => new HttpError(400, msg);
  static Unauthorized = (msg?: string) => new HttpError(401, msg);
  static PaymentRequired = (msg?: string) => new HttpError(402, msg);
  static Forbidden = (msg?: string) => new HttpError(403, msg);
  static NotFound = (msg?: string) => new HttpError(404, msg);
  static MethodNotAllowed = (msg?: string) => new HttpError(405, msg);
  static NotAcceptable = (msg?: string) => new HttpError(406, msg);
  static ProxyAuthenticationRequired = (msg?: string) => new HttpError(407, msg);
  static RequestTimeout = (msg?: string) => new HttpError(408, msg);
  static Conflict = (msg?: string) => new HttpError(409, msg);
  static Gone = (msg?: string) => new HttpError(410, msg);
  static LengthRequired = (msg?: string) => new HttpError(411, msg);
  static PreconditionFailed = (msg?: string) => new HttpError(412, msg);
  static PayloadTooLarge = (msg?: string) => new HttpError(413, msg);
  static URITooLong = (msg?: string) => new HttpError(414, msg);
  static UnsupportedMediaType = (msg?: string) => new HttpError(415, msg);
  static RangeNotSatisfiable = (msg?: string) => new HttpError(416, msg);
  static ExpectationFailed = (msg?: string) => new HttpError(417, msg);
  static ImATeapot = (msg?: string) => new HttpError(418, msg);
  static MisdirectedRequest = (msg?: string) => new HttpError(421, msg);
  static UnprocessableEntity = (msg?: string) => new HttpError(422, msg);
  static Locked = (msg?: string) => new HttpError(423, msg);
  static FailedDependency = (msg?: string) => new HttpError(424, msg);
  static TooEarly = (msg?: string) => new HttpError(425, msg);
  static UpgradeRequired = (msg?: string) => new HttpError(426, msg);
  static PreconditionRequired = (msg?: string) => new HttpError(428, msg);
  static TooManyRequests = (msg?: string) => new HttpError(429, msg);
  static RequestHeaderFieldsTooLarge = (msg?: string) => new HttpError(431, msg);
  static UnavailableForLegalReasons = (msg?: string) => new HttpError(451, msg);

  // 5xx Errors
  static InternalServerError = (msg?: string) => new HttpError(500, msg);
  static NotImplemented = (msg?: string) => new HttpError(501, msg);
  static BadGateway = (msg?: string) => new HttpError(502, msg);
  static ServiceUnavailable = (msg?: string) => new HttpError(503, msg);
  static GatewayTimeout = (msg?: string) => new HttpError(504, msg);
  static HTTPVersionNotSupported = (msg?: string) => new HttpError(505, msg);
  static VariantAlsoNegotiates = (msg?: string) => new HttpError(506, msg);
  static InsufficientStorage = (msg?: string) => new HttpError(507, msg);
  static LoopDetected = (msg?: string) => new HttpError(508, msg);
  static BandwidthLimitExceeded = (msg?: string) => new HttpError(509, msg);
  static NotExtended = (msg?: string) => new HttpError(510, msg);
  static NetworkAuthenticationRequired = (msg?: string) => new HttpError(511, msg);
}

export default HttpError;
