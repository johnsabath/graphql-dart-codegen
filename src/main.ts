import { parse, visit, BREAK } from "graphql";
import fs from "fs";

const schemaString = fs.readFileSync("./github.graphql", "utf8");
const schema = parse(schemaString);

fs.writeFileSync("./out/input.json", JSON.stringify(schema, undefined, 4));

const scalars: string[] = [];

visit(schema, {
  ScalarTypeDefinition(node) {
    scalars.push(node.name.value);
  }
});

const output = visit(schema, {
  Name: {
    leave: node => node.value
  },
  NamedType: {
    leave: node => {
      if (scalars.indexOf(node.name) != -1) return "dynamic";

      switch (node.name) {
        case "Int":
          return "int";

        case "Float":
          return "double";

        case "Boolean":
          return "bool";

        case "ID":
          return "String";

        default:
          return node.name;
      }
    }
  },
  NonNullType: {
    leave: node => node.type
  },
  ListType: {
    leave: node => `List<${node.type}>`
  },
  EnumValueDefinition: {
    leave: node => `${node.name}`
  },
  EnumTypeDefinition: {
    leave: node => `enum ${node.name} { ${node.values.join(", ")} }`
  },
  FieldDefinition: {
    leave: node => {
      if (node.arguments.length > 0) {
        return `${node.type} ${node.name}(${node.arguments.join(", ")})`;
      } else {
        return `${node.type} ${node.name}`;
      }
    }
  },
  SchemaDefinition: {
    leave(node) {
      const inner = node.operationTypes.map(it => `  ${it};\n`).join("");
      return `class Schema {\n${inner}}`;
    }
  },
  OperationTypeDefinition: {
    leave(node) {
      return `${node.type} ${node.operation}`;
    }
  },
  InputValueDefinition: {
    leave: node => `${node.type} ${node.name}`
  },
  ObjectTypeDefinition: {
    leave: node => {
      const inner = node.fields.map(it => `  ${it};\n`).join("");
      const interfaces = node.interfaces ? node.interfaces.join(", ") : "";

      return `abstract class ${node.name}${
        interfaces ? ` implements ${interfaces}` : ""
      } {\n${inner}}`;
    }
  },
  InterfaceTypeDefinition: {
    leave: node => {
      const inner = node.fields.map(it => `  ${it};\n`).join("");
      return `abstract class ${node.name} {\n${inner}}`;
    }
  },
  InputObjectTypeDefinition: {
    leave: node => {
      const inner = node.fields.map(it => `  ${it};\n`).join("");
      return `class ${node.name} {\n${inner}}`;
    }
  },
  UnionTypeDefinition: {
    leave: node => `enum ${node.name} { ${node.types.join(", ")} }`
  },
  Document: {
    leave: node => node.definitions.join("\n\n")
  },
  ScalarTypeDefinition() {
    return null;
  }
});

fs.writeFileSync("./out/output.dart", output);
