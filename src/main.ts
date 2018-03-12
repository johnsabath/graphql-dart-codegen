import {
  parse,
  visit,
  buildASTSchema,
  print,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  EnumTypeDefinitionNode,
  InterfaceTypeDefinitionNode
} from "graphql";
import * as graphql from "graphql";
import fs from "fs";

import CodeGenerator from "./CodeGenerator";
import * as language from "./language";

const schemaString = fs.readFileSync("./github.graphql", "utf8");
const schema = parse(schemaString);
const generator = new CodeGenerator();

fs.writeFileSync("./out/input.json", JSON.stringify(schema, undefined, 4));

const allKnownScalarNames: string[] = [];
const allKnownInterfaces: InterfaceTypeDefinitionNode[] = [];

visit(schema, {
  InterfaceTypeDefinition(node: any) {
    allKnownInterfaces.push(node);
  },
  ScalarTypeDefinition(node: any) {
    allKnownScalarNames.push(node.name.value);
  }
});

visit(schema, {
  EnumTypeDefinition: {
    leave: (node: any) => language.generateEnumTypeDefinition(generator, node)
  },
  SchemaDefinition: {
    leave: (node: any) => language.generateSchemaDefinition(generator, node)
  },
  ObjectTypeDefinition: {
    leave: (node: any) =>
      language.generateObjectTypeDefinition(generator, node, allKnownInterfaces)
  },
  InterfaceTypeDefinition: {
    leave: (node: any) =>
      language.generateInterfaceTypeDefinition(generator, node)
  },
  InputObjectTypeDefinition: {
    leave: (node: any) =>
      language.generateInputObjectTypeDefinition(generator, node)
  },
  UnionTypeDefinition: {
    leave: (node: any) => language.generateEnumTypeDefinition(generator, node)
  },
  Name: (node: any) => language.transformNameNode(node, allKnownScalarNames)
});

fs.writeFileSync("./out/output.dart", generator.output);
