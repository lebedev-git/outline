"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _koa = _interopRequireDefault(require("koa"));
var _koaBody = _interopRequireDefault(require("koa-body"));
var _koaRouter = _interopRequireDefault(require("koa-router"));
var _koaUseragent = _interopRequireDefault(require("koa-useragent"));
var _env = _interopRequireDefault(require("./../../env"));
var _errors = require("./../../errors");
var _apiContext = require("./../../middlewares/apiContext");
var _coaleseBody = _interopRequireDefault(require("./../../middlewares/coaleseBody"));
var _requestContext = _interopRequireDefault(require("./../../middlewares/requestContext"));
var _requestTracer = _interopRequireDefault(require("./../../middlewares/requestTracer"));
var _csrf = require("./../../middlewares/csrf");
var _PluginManager = require("./../../utils/PluginManager");
var _ai = _interopRequireDefault(require("./ai"));
var _apiKeys = _interopRequireDefault(require("./apiKeys"));
var _attachments = _interopRequireDefault(require("./attachments"));
var _auth = _interopRequireDefault(require("./auth"));
var _authenticationProviders = _interopRequireDefault(require("./authenticationProviders"));
var _collections = _interopRequireDefault(require("./collections"));
var _comments = _interopRequireDefault(require("./comments/comments"));
var _cron = _interopRequireDefault(require("./cron"));
var _developer = _interopRequireDefault(require("./developer"));
var _documents = _interopRequireDefault(require("./documents"));
var _emojis = _interopRequireDefault(require("./emojis"));
var _events = _interopRequireDefault(require("./events"));
var _fileOperations = _interopRequireDefault(require("./fileOperations"));
var _groupMemberships = _interopRequireDefault(require("./groupMemberships"));
var _groups = _interopRequireDefault(require("./groups"));
var _imports = _interopRequireDefault(require("./imports"));
var _installation = _interopRequireDefault(require("./installation"));
var _integrations = _interopRequireDefault(require("./integrations"));
var _apiErrorHandler = _interopRequireDefault(require("./middlewares/apiErrorHandler"));
var _apiResponse = _interopRequireDefault(require("./middlewares/apiResponse"));
var _editor = _interopRequireDefault(require("./middlewares/editor"));
var _notifications = _interopRequireDefault(require("./notifications"));
var _oauthAuthentications = _interopRequireDefault(require("./oauthAuthentications"));
var _oauthClients = _interopRequireDefault(require("./oauthClients"));
var _pins = _interopRequireDefault(require("./pins"));
var _reactions = _interopRequireDefault(require("./reactions"));
var _relationships = _interopRequireDefault(require("./relationships"));
var _revisions = _interopRequireDefault(require("./revisions"));
var _searches = _interopRequireDefault(require("./searches"));
var _shares = _interopRequireDefault(require("./shares"));
var _stars = _interopRequireDefault(require("./stars"));
var _subscriptions = _interopRequireDefault(require("./subscriptions"));
var _suggestions = _interopRequireDefault(require("./suggestions"));
var _teams = _interopRequireDefault(require("./teams"));
var _templates = _interopRequireDefault(require("./templates"));
var _urls = _interopRequireDefault(require("./urls"));
var _userMemberships = _interopRequireDefault(require("./userMemberships"));
var _users = _interopRequireDefault(require("./users"));
var _views = _interopRequireDefault(require("./views"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const api = new _koa.default();
const router = new _koaRouter.default();

// middlewares
api.use((0, _requestContext.default)());
api.use((0, _koaBody.default)({
  multipart: true,
  formidable: {
    maxFileSize: Math.max(_env.default.FILE_STORAGE_UPLOAD_MAX_SIZE, _env.default.FILE_STORAGE_IMPORT_MAX_SIZE),
    maxFieldsSize: 10 * 1024 * 1024
  },
  jsonLimit: 5 * 1024 * 1024 // 5MB limit for JSON payloads
}));
api.use((0, _coaleseBody.default)());
api.use(_koaUseragent.default);
api.use((0, _requestTracer.default)());
api.use((0, _apiResponse.default)());
api.use((0, _apiErrorHandler.default)());
api.use((0, _editor.default)());
api.use((0, _apiContext.apiContext)());
api.use((0, _csrf.verifyCSRFToken)());

// Register plugin API routes before others to allow for overrides
_PluginManager.PluginManager.getHooks(_PluginManager.Hook.API).forEach(hook => router.use("/", hook.value.routes()));

// routes
router.use("/", _auth.default.routes());
router.use("/", _authenticationProviders.default.routes());
router.use("/", _events.default.routes());
router.use("/", _ai.default.routes());
router.use("/", _users.default.routes());
router.use("/", _collections.default.routes());
router.use("/", _comments.default.routes());
router.use("/", _documents.default.routes());
router.use("/", _emojis.default.routes());
router.use("/", _pins.default.routes());
router.use("/", _revisions.default.routes());
router.use("/", _views.default.routes());
router.use("/", _apiKeys.default.routes());
router.use("/", _searches.default.routes());
router.use("/", _shares.default.routes());
router.use("/", _stars.default.routes());
router.use("/", _subscriptions.default.routes());
router.use("/", _suggestions.default.routes());
router.use("/", _teams.default.routes());
router.use("/", _templates.default.routes());
router.use("/", _integrations.default.routes());
router.use("/", _notifications.default.routes());
router.use("/", _oauthAuthentications.default.routes());
router.use("/", _oauthClients.default.routes());
router.use("/", _attachments.default.routes());
router.use("/", _cron.default.routes());
router.use("/", _groups.default.routes());
router.use("/", _groupMemberships.default.routes());
router.use("/", _fileOperations.default.routes());
router.use("/", _urls.default.routes());
router.use("/", _userMemberships.default.routes());
router.use("/", _reactions.default.routes());
router.use("/", _relationships.default.routes());
router.use("/", _imports.default.routes());
if (!_env.default.isCloudHosted) {
  router.use("/", _installation.default.routes());
}
if (_env.default.isDevelopment) {
  router.use("/", _developer.default.routes());
}
router.post("*", ctx => {
  ctx.throw((0, _errors.NotFoundError)("Endpoint not found"));
});
router.get("*", ctx => {
  ctx.throw((0, _errors.NotFoundError)("Endpoint not found"));
});

// Router is embedded in a Koa application wrapper, because koa-router does not
// allow middleware to catch any routes which were not explicitly defined.
api.use(router.routes());
api.use(router.allowedMethods());
var _default = exports.default = api;
