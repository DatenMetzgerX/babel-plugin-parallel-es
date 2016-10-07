import {NodePath} from "babel-traverse";
import * as t from "babel-types";

export interface IImports {
    [name: string]: IImport[];
}

export interface IImport {
    imported: string;
    local: string;
    references: NodePath<t.Node>[];
}

export class ImportsRegistry {
    private registeredImports = new Map<string, Map<string, IImport>>();

    public addImport(module: string, imported: string, local: string, referencedIn: NodePath<t.Node>): void {
        const moduleImports = this.getModuleImports(module);

        const key = `${imported}:${local}`;
        const importSpecifier = moduleImports.get(key);

        if (importSpecifier) {
            importSpecifier.references.push(referencedIn);
        } else {
            moduleImports.set(key, { imported, local, references: [referencedIn] });
        }
    }

    public addDefaultImport(module: string, local: string, referencedIn: NodePath<t.Node>) {
        this.addImport(module, "default", local, referencedIn);
    }

    public addNamespaceImport(module: string, local: string, referencedIn: NodePath<t.Node>) {
        this.addImport(module, "*", local, referencedIn);
    }

    public getImports(): IImports {
        const imports: IImports = {};
        for (const module of Array.from(this.registeredImports.keys())) {
            imports[module] = Array.from(this.getModuleImports(module).values());
        }

        return imports;
    }

    private getModuleImports(module: string): Map<string, IImport> {
        let moduleImports = this.registeredImports.get(module);

        if (!moduleImports) {
            moduleImports = new Map<string, IImport>();
            this.registeredImports.set(module, moduleImports);
        }
        return moduleImports;
    }
}
