import { Identifier } from "babel-types";

export interface IImports {
  [name: string]: IImport[];
}

export interface IImport {
  /**
   * The name of the imported resource (e.g. map in import {map} from "lodash").
   * The special qualifier '*' is used for a namespace import.
   * The special qualifier 'default' is used for the default import
   */
  imported: string;

  /**
   * The local name of the imported resource. (e.g. lodashMap in import {map as lodashMap} from "lodash")
   */
  local: string;

  /**
   * Identifier referencing this import
   */
  references: Identifier[];
}

/**
 * The registry manages the imports of a module and ensures each import is only registered once
 */
export class ImportsRegistry {
  private registeredImports = new Map<string, Map<string, IImport>>();

  /**
   * Registers a new import
   * @param module the imported module (file)
   * @param imported the imported symbol
   * @param local the local name of the symbol
   * @param reference an identifier referencing the import
   */
  public addImport(module: string, imported: string, local: string, reference?: Identifier): void {
    const moduleImports = this.getModuleImports(module);

    const key = `${imported}:${local}`;
    let importSpecifier = moduleImports.get(key);

    if (!importSpecifier) {
      importSpecifier = { imported, local, references: [] };
      moduleImports.set(key, importSpecifier);
    }

    if (reference) {
      importSpecifier.references.push(reference);
    }
  }

  /**
   * Adds a default import for the given module
   * @param module the module / file
   * @param local the local name of the default import
   * @param reference an identifier referencing the import
   */
  public addDefaultImport(module: string, local: string, reference?: Identifier) {
    this.addImport(module, "default", local, reference);
  }

  /**
   * Adds a namespace import for the given module
   * @param module the module / file
   * @param local the local name to which the namespace is bound
   * @param reference an identifier referencing the import
   */
  public addNamespaceImport(module: string, local: string, reference?: Identifier) {
    this.addImport(module, "*", local, reference);
  }

  /**
   * Returns all imports across all modules
   * @returns {IImports} the imports
   */
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
