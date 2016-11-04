import {Visitor, NodePath} from "babel-traverse";
import * as t from "babel-types";
import {createFunctionId} from "../util";
import {ModulesUsingParallelRegistry} from "../modules-using-parallel-registry";
import {IEntryFunctionRegistration} from "../function-registration";
import {WORKER_FUNCTORS_REGISTRATION_MARKER} from "../constants";
import {ModuleFunctionsRegistry} from "../module-functions-registry";

/**
 * Removes the worker slave marker from a leading or trailing comment
 * @param path the path from which the comment should be removed
 * @returns {boolean} true if the marker is in the leading comments.
 */
function removeAfterWorkerSlaveMarker(path: NodePath<t.Node>): boolean {
    function removeFrom(commentsName: string) {
        if (!(path.node as any)[commentsName]) {
            return false;
        }

        const comments = (path.get(commentsName) as any) as Array<NodePath<t.Comment>>;
        const marker = comments.find(comment => comment.node.value.includes(WORKER_FUNCTORS_REGISTRATION_MARKER));

        if (marker) {
            marker.remove();
            return true;
        }
        return false;
    }

    removeFrom("trailingComments");
    return removeFrom("leadingComments");
}

function addImports(module: ModuleFunctionsRegistry, path: NodePath<t.Node>) {
    const imports = module.imports.getImports();

    for (const referencedModule of Object.keys(imports)) {
        const moduleImports = imports[referencedModule];
        for (const imported of moduleImports) {
            const id = path.hub.file.addImport(referencedModule, imported.imported);
            for (const reference of imported.references) {
                reference.name = id.name;
            }
        }
    }
}

function registerEntryFunction(definition: IEntryFunctionRegistration): t.Statement {
    const id = createFunctionId(definition.functionId);

    const registerStaticFunctionMember = t.memberExpression(t.identifier("slaveFunctionLookupTable"), t.identifier("registerStaticFunction"));
    const registerCall = t.callExpression(registerStaticFunctionMember, [id, definition.identifier]);
    return t.expressionStatement(registerCall);
}

function getEnvironmentVariablesDeclaration(environmentVariables: string[]): t.Statement | undefined {
    if (environmentVariables.length === 0) {
        return undefined;
    }

    const declarations = environmentVariables.map(variable => t.variableDeclarator(t.identifier(variable)));

    return t.variableDeclaration("let", declarations);
}

export function createReWriterVisitor(registry: ModulesUsingParallelRegistry): Visitor {
    return {
        Statement(path: NodePath<t.Statement>) {
            if (!removeAfterWorkerSlaveMarker(path)) {
                return;
            }

            for (const module of registry.modules) {
                const environmentVariablesDeclaration = getEnvironmentVariablesDeclaration(module.environmentVariables);
                let body: t.Statement[] = module.functions.slice();

                if (environmentVariablesDeclaration) {
                    body.unshift(environmentVariablesDeclaration);
                }

                for (const definition of module.entryFunctions) {
                    body.push(registerEntryFunction(definition));
                }

                addImports(module, path);

                const wrapper = t.expressionStatement(t.callExpression(t.functionExpression(undefined, [], t.blockStatement(body)), []));
                const wrapperPath = (path.insertBefore(wrapper) as NodePath<t.Statement>[])[0];
                wrapperPath.addComment("leading", module.fileName, false);
            }
        }
    };
}
