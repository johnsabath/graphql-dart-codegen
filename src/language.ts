import CodeGenerator from "./CodeGenerator";
import {
  ObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  NameNode,
  UnionTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  SchemaDefinitionNode,
  EnumTypeDefinitionNode,
  TypeNode,
  NamedTypeNode,
  ArgumentNode,
  InputValueDefinitionNode,
  FieldDefinitionNode,
  DirectiveNode,
  ValueNode,
  DefinitionNode,
  ASTNode
} from "graphql";

export const generateInterfaceTypeDefinition = (
  generator: CodeGenerator,
  node: InterfaceTypeDefinitionNode
) => {
  generateNodeHeader(generator, node);
  generator.printOnNewline(`abstract class ${nodeName(node)}`);
  generateClassFieldDefinitions(generator, node);
  generator.printNewline();
};

export const generateEnumTypeDefinition = (
  generator: CodeGenerator,
  node: UnionTypeDefinitionNode | EnumTypeDefinitionNode
) => {
  generateNodeHeader(generator, node);
  generator.printOnNewline(`enum ${nodeName(node)}`);
  generator.withinBlock(() => {
    const nodes = node.kind == "EnumTypeDefinition" ? node.values : node.types;
    for (let node of nodes) {
      generator.printOnNewline(`${nodeName(node)},`);
    }
  });
  generator.printNewline();
};

export const generateSchemaDefinition = (
  generator: CodeGenerator,
  node: SchemaDefinitionNode
) => {
  generateNodeHeader(generator, node);
  generator.printOnNewline(`class Schema`);
  generator.withinBlock(() => {
    node.operationTypes.forEach(operation => {
      generator.printOnNewline(
        `${nodeType(operation)} ${operation.operation};`
      );
    });
  });
  generator.printNewline();
};

export const generateInputObjectTypeDefinition = (
  generator: CodeGenerator,
  node: InputObjectTypeDefinitionNode
) => {
  generateNodeHeader(generator, node);
  generator.printOnNewline(`abstract class ${nodeName(node)}`);
  generateClassFieldDefinitions(generator, node);
  generator.printNewline();
};

export const generateObjectTypeDefinition = (
  generator: CodeGenerator,
  node: ObjectTypeDefinitionNode,
  knownInterfaces: InterfaceTypeDefinitionNode[]
) => {
  const interfaces = commaSeperatedInterfaceNames(node);
  const fieldsExcludingInherited = objectFieldsExcludingInherited(
    node,
    knownInterfaces
  );

  generateNodeHeader(generator, node);
  generator.printOnNewline(`abstract class ${nodeName(node)}`);

  if (interfaces) {
    generator.print(` implements ${interfaces}`);
  }

  generateClassFieldDefinitions(generator, node);
  generator.printNewline();
};

const generateClassFieldDefinitions = (
  generator: CodeGenerator,
  node:
    | InterfaceTypeDefinitionNode
    | ObjectTypeDefinitionNode
    | InputObjectTypeDefinitionNode
) => {
  generator.withinBlock(() => {
    for (let field of node.fields) {
      const deprecated = deprecatedAnnotation(field);

      if (deprecated) {
        generator.printOnNewline(deprecated);
      }

      generator.printOnNewline(`${nodeType(field)} ${nodeName(field)}`);

      if (field.kind == "FieldDefinition") {
        const fieldArguments = commaSeperatedArguments(field);

        if (fieldArguments) {
          generator.print(`(${fieldArguments})`);
        }
      }

      generator.print(";");
    }
  });
};

/**
 * @return "Node, Assignable, Closable, Comment, Updatable, UpdatableComment, Labelable"
 */
const commaSeperatedInterfaceNames = (node: {
  interfaces?: NamedTypeNode[];
}): string | undefined =>
  node.interfaces && node.interfaces.length > 0
    ? node.interfaces.map(it => `${nodeName(it)}`).join(", ")
    : undefined;

/**
 * @return "int first, String after, int last, String before"
 */
const commaSeperatedArguments = (node: {
  arguments?: InputValueDefinitionNode[];
}): string | undefined => {
  if (node.arguments && node.arguments.length > 0) {
    return node.arguments
      .map(it => `${nodeType(it)} ${nodeName(it)}`)
      .join(", ");
  } else {
    return undefined;
  }
};

const objectFieldsExcludingInherited = (
  node: ObjectTypeDefinitionNode,
  knownInterfaces: InterfaceTypeDefinitionNode[]
): FieldDefinitionNode[] => {
  if (node.interfaces && node.interfaces.length > 0) {
    const nodeInterfaceNames = node.interfaces.map(nodeName);
    const nodeInterfaceFieldNames = knownInterfaces
      .filter(it => nodeInterfaceNames.indexOf(nodeName(it)) !== -1)
      .map(it => it.fields)
      .reduce((last, flat) => [...last, ...flat], [])
      .map(nodeName);

    return node.fields.filter(
      it => nodeInterfaceFieldNames.indexOf(nodeName(it)) === -1
    );
  }

  return node.fields;
};

export const transformNameNode = (
  node: NameNode,
  knownScalars: string[]
): NameNode => {
  if (knownScalars.indexOf(node.value) != -1)
    return { ...node, value: "dynamic" };

  switch (node.value) {
    case "Int":
      return { ...node, value: "int" };

    case "Float":
      return { ...node, value: "double" };

    case "Boolean":
      return { ...node, value: "bool" };

    case "ID":
      return { ...node, value: "String" };
  }

  return node;
};

const nodeType = (node: { type: TypeNode } | TypeNode): string => {
  if ("kind" in node) {
    switch (node.kind) {
      case "NamedType":
        return nodeName(node);

      case "ListType":
        return `List<${nodeType(node.type)}>`;

      case "NonNullType":
        return nodeType(node.type);
    }
  }

  return nodeType(node.type);
};

const nodeName = (node: { name: NameNode } | NameNode): string => {
  if ("name" in node) {
    return node.name.value;
  } else {
    return node.value;
  }
};

type NodeValue = string | null | boolean | NodeValueObject | NodeValueList;

interface NodeValueObject {
  [x: string]: NodeValue;
}

interface NodeValueList extends Array<NodeValue> {}

const nodeValue = (
  node: ValueNode | ASTNode & { value: ValueNode }
): NodeValue => {
  switch (node.kind) {
    case "Variable":
      return nodeName(node);

    case "IntValue":
    case "FloatValue":
    case "StringValue":
    case "BooleanValue":
    case "EnumValue":
      return node.value;

    case "NullValue":
      return null;

    case "ListValue":
      return node.values.map(nodeValue);

    case "ObjectValue":
      return node.fields.reduce((obj: NodeValueObject, last) => {
        obj[nodeName(last)] = nodeValue(last.value);
        return obj;
      }, {});

    default:
      return nodeValue(node.value);
  }
};

const deprecatedAnnotation = (node: {
  directives?: DirectiveNode[];
}): string | undefined => {
  if (node.directives && node.directives.length) {
    const deprecated = node.directives.find(
      it => it.name.value === "deprecated"
    );

    if (deprecated) {
      if (deprecated.arguments && deprecated.arguments.length > 0) {
        const annotationArguments = deprecated.arguments
          .filter(it => it.value.kind === "StringValue")
          .map(it => `"${nodeValue(it)}"`);

        return `@Deprecated(${annotationArguments.join(", ")})`;
      } else {
        return "@deprecated";
      }
    }
  } else {
    return undefined;
  }
};

const generateNodeHeader = (generator: CodeGenerator, node: ASTNode) => {
  generator.printOnNewline(`// Kind: ${node.kind}`);
  if (node.loc) {
    generator.printOnNewline(
      `// Schema Lines: ${node.loc.startToken.line} - ${node.loc.endToken.line}`
    );
  }
};
