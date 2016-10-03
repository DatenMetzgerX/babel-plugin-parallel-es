import codeFrame = require("babel-code-frame");
import * as t from "babel-types";
import {NodePath} from "babel-traverse";

export function warn(path: NodePath<t.Node>, message: string) {
    message += "\n" + codeFrame(path.hub.file.code, path.node.loc.start.line, path.node.loc.start.column);
    path.hub.file.log.warn(message);
}
