"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _koaRouter = _interopRequireDefault(require("koa-router"));
var _authentication = _interopRequireDefault(require("./../../middlewares/authentication"));
var _errors = require("./../../errors");
var _models = require("./../../models");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const router = new _koaRouter.default();
const aiUrl = process.env.AI_SEARCH_INTERNAL_URL || process.env.AI_CONVERTER_URL?.replace(/\/files\/convert$/, "") || "http://ai-search:8010";
async function allowedDocumentIds(user) {
  const documents = await _models.Document.findAll({
    attributes: ["id"],
    where: {
      teamId: user.teamId,
      deletedAt: null,
      archivedAt: null
    }
  });
  return documents.map(document => document.id);
}
function requestBody(ctx) {
  return ctx.input?.body || ctx.request.body || {};
}
async function postToAi(path, body) {
  const response = await fetch(`${aiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const text = await response.text();
    throw (0, _errors.InvalidRequestError)(text || "AI service request failed");
  }
  return response.json();
}
router.post("ai.search", (0, _authentication.default)(), async ctx => {
  const {
    user
  } = ctx.state.auth;
  const body = requestBody(ctx);
  ctx.body = {
    data: await postToAi("/search", {
      query: body.query,
      limit: body.limit || 5,
      collectionId: body.collectionId,
      allowedDocumentIds: await allowedDocumentIds(user)
    })
  };
});
router.post("ai.chat", (0, _authentication.default)(), async ctx => {
  const {
    user
  } = ctx.state.auth;
  const body = requestBody(ctx);
  ctx.body = {
    data: await postToAi("/chat", {
      message: body.message,
      limit: body.limit || 5,
      collectionId: body.collectionId,
      allowedDocumentIds: await allowedDocumentIds(user)
    })
  };
});
router.post("ai.reindex", (0, _authentication.default)(), async ctx => {
  const {
    user
  } = ctx.state.auth;
  if (!user.isAdmin) {
    throw (0, _errors.AuthorizationError)();
  }
  ctx.body = {
    data: await postToAi("/index", {})
  };
});
var _default = exports.default = router;
