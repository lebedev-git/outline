"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _outlineIcons = require("outline-icons");
var _prosemirrorState = require("prosemirror-state");
var _reactI18next = require("react-i18next");
var _files = require("../../utils/files");
var _urls = require("../../utils/urls");
var _insertFiles = _interopRequireDefault(require("../commands/insertFiles"));
var _toggleWrap = _interopRequireDefault(require("../commands/toggleWrap"));
var _FileExtension = _interopRequireDefault(require("../components/FileExtension"));
var _Widget = _interopRequireDefault(require("../components/Widget"));
var _links = _interopRequireDefault(require("../rules/links"));
var _Node = _interopRequireDefault(require("./Node"));
var _PDF = _interopRequireDefault(require("../components/PDF"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
class Attachment extends _Node.default {
  constructor() {
    super(...arguments);
    _defineProperty(this, "handleSelect", _ref => {
      let {
        getPos
      } = _ref;
      return () => {
        const {
          view
        } = this.editor;
        const $pos = view.state.doc.resolve(getPos());
        const transaction = view.state.tr.setSelection(new _prosemirrorState.NodeSelection($pos));
        view.dispatch(transaction);
      };
    });
    _defineProperty(this, "handleChangeSize", _ref2 => {
      let {
        node,
        getPos
      } = _ref2;
      return _ref3 => {
        let {
          width,
          height
        } = _ref3;
        if (!node.attrs.preview) {
          return;
        }
        const {
          view,
          commands
        } = this.editor;
        const {
          doc,
          tr
        } = view.state;
        const pos = getPos();
        const $pos = doc.resolve(pos);
        view.dispatch(tr.setSelection(new _prosemirrorState.NodeSelection($pos)));
        commands["resizeAttachment"]({
          width,
          height: height || node.attrs.height
        });
      };
    });
    _defineProperty(this, "component", props => {
      const {
        embedsDisabled
      } = this.editor.props;
      const {
        isSelected,
        isEditable,
        node
      } = props;
      const context = node.attrs.href ? (0, _files.bytesToHumanReadable)(node.attrs.size || "0") : /*#__PURE__*/(0, _jsxRuntime.jsxs)(_jsxRuntime.Fragment, {
        children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(_reactI18next.Trans, {
          children: "Uploading"
        }), "\u2026"]
      });
      return node.attrs.preview && !embedsDisabled && node.attrs.contentType === "application/pdf" ? /*#__PURE__*/(0, _jsxRuntime.jsx)(_PDF.default, {
        icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(_FileExtension.default, {
          title: node.attrs.title
        }),
        title: node.attrs.title,
        context: context,
        onChangeSize: this.handleChangeSize(props),
        ...props
      }) : /*#__PURE__*/(0, _jsxRuntime.jsx)(_Widget.default, {
        icon: /*#__PURE__*/(0, _jsxRuntime.jsx)(_FileExtension.default, {
          title: node.attrs.title
        }),
        href: node.attrs.href,
        title: node.attrs.title,
        onMouseDown: this.handleSelect(props),
        onDoubleClick: () => {
          this.editor.commands.downloadAttachment();
        },
        onClick: event => {
          if (isEditable) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        context: context,
        isSelected: isSelected,
        children: node.attrs.href && !isEditable && /*#__PURE__*/(0, _jsxRuntime.jsx)(_outlineIcons.DownloadIcon, {
          size: 20
        })
      });
    });
  }
  get name() {
    return "attachment";
  }
  get rulePlugins() {
    return [_links.default];
  }
  get schema() {
    return {
      attrs: {
        id: {
          default: null
        },
        href: {
          default: null
        },
        title: {},
        size: {
          default: 0
        },
        preview: {
          default: false
        },
        width: {
          default: null
        },
        height: {
          default: null
        },
        contentType: {
          default: null,
          validate: "string|null"
        }
      },
      group: "block",
      defining: true,
      atom: true,
      parseDOM: [{
        priority: 100,
        tag: "a.attachment",
        getAttrs: dom => ({
          id: dom.id,
          title: dom.innerText,
          href: dom.getAttribute("href"),
          size: parseInt(dom.dataset.size || "0", 10)
        })
      }],
      toDOM: node => ["a", {
        class: `attachment`,
        id: node.attrs.id,
        href: (0, _urls.sanitizeUrl)(node.attrs.href),
        download: node.attrs.title,
        "data-size": node.attrs.size
      }, String(node.attrs.title)],
      leafText: node => node.attrs.title
    };
  }
  commands(_ref4) {
    let {
      type
    } = _ref4;
    return {
      createAttachment: attrs => (0, _toggleWrap.default)(type, attrs),
      deleteAttachment: () => (state, dispatch) => {
        dispatch?.(state.tr.deleteSelection());
        return true;
      },
      replaceAttachment: () => state => {
        if (!(state.selection instanceof _prosemirrorState.NodeSelection)) {
          return false;
        }
        const {
          view
        } = this.editor;
        const {
          node
        } = state.selection;
        const {
          uploadFile,
          onFileUploadStart,
          onFileUploadStop,
          onFileUploadProgress
        } = this.editor.props;
        if (!uploadFile) {
          throw new Error("uploadFile prop is required to replace attachments");
        }
        const accept = node.attrs.contentType === "application/pdf" ? ".pdf" : node.type.name === "attachment" ? "*" : null;
        if (accept === null) {
          return false;
        }

        // create an input element and click to trigger picker
        const inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.accept = accept;
        inputElement.onchange = event => {
          const files = (0, _files.getEventFiles)(event);
          void (0, _insertFiles.default)(view, event, state.selection.from, files, {
            uploadFile,
            onFileUploadStart,
            onFileUploadStop,
            onFileUploadProgress,
            dictionary: this.options.dictionary,
            replaceExisting: true,
            attrs: {
              preview: node.attrs.preview
            }
          });
        };
        inputElement.click();
        return true;
      },
      downloadAttachment: () => state => {
        if (!(state.selection instanceof _prosemirrorState.NodeSelection)) {
          return false;
        }
        const {
          node
        } = state.selection;

        // create a temporary link node and click it
        const link = document.createElement("a");
        link.href = node.attrs.href;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();

        // cleanup
        document.body.removeChild(link);
        return true;
      },
      toggleAttachmentPreview: () => (state, dispatch) => {
        if (!(state.selection instanceof _prosemirrorState.NodeSelection)) {
          return false;
        }
        const {
          node
        } = state.selection;
        if (node.attrs.contentType !== "application/pdf") {
          return false;
        }
        const {
          attrs
        } = state.selection.node;
        const transaction = state.tr.setNodeMarkup(state.selection.from, undefined, {
          ...attrs,
          preview: !attrs.preview
        }).setMeta("addToHistory", true);
        const $pos = transaction.doc.resolve(state.selection.from);
        dispatch?.(transaction.setSelection(new _prosemirrorState.NodeSelection($pos)));
        return true;
      },
      resizeAttachment: _ref5 => {
        let {
          width,
          height
        } = _ref5;
        return (state, dispatch) => {
          if (!(state.selection instanceof _prosemirrorState.NodeSelection) || !state.selection.node.attrs.preview) {
            return false;
          }
          const {
            view
          } = this.editor;
          const {
            tr
          } = view.state;
          const {
            attrs
          } = state.selection.node;
          const transaction = tr.setNodeMarkup(state.selection.from, undefined, {
            ...attrs,
            width,
            height
          }).setMeta("addToHistory", true);
          const $pos = transaction.doc.resolve(state.selection.from);
          dispatch?.(transaction.setSelection(new _prosemirrorState.NodeSelection($pos)));
          return true;
        };
      }
    };
  }
  toMarkdown(state, node) {
    state.ensureNewLine();
    state.write(`[${node.attrs.title} ${node.attrs.size}](${node.attrs.href})\n\n`);
    state.ensureNewLine();
  }
  parseMarkdown() {
    return {
      node: "attachment",
      getAttrs: tok => {
        const title = tok.attrGet("title") || "";
        const isPdf = /(^|\s|\/)[^\s/]+\.pdf(\s|$)/i.test(title);
        return {
          href: tok.attrGet("href"),
          title,
          size: tok.attrGet("size"),
          contentType: isPdf ? "application/pdf" : null,
          preview: isPdf
        };
      }
    };
  }
}
exports.default = Attachment;
