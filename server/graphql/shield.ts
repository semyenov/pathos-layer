/* eslint-disable @typescript-eslint/no-unused-vars */
import SchemaBuilder, {
  BasePlugin,
  type FieldNullability,
  type InputFieldMap,
  type SchemaTypes,
  type TypeParam,
} from '@pothos/core';
import { type GraphQLSchema, isObjectType } from 'graphql';
import { applyMiddleware } from 'graphql-middleware';

import { type IRules, shield, type IRule } from 'graphql-shield';

// Define ShieldRule type
type ShieldRule = IRule;

// Using namespace here is necessary for the plugin type augmentation
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PothosSchemaTypes {
    // We need to match the original interface parameters
    export interface Plugins<Types extends SchemaTypes> {
      shield?: ShieldPlugin<Types>;
    }

    // We need to match the original interface parameters
    export interface ObjectTypeOptions<Types extends SchemaTypes = SchemaTypes, Shape = unknown>
      extends BaseTypeOptions<Types> {
      shield?: ShieldRule;
    }

    // We need to match the original interface parameters
    export interface FieldOptions<
      Types extends SchemaTypes = SchemaTypes,
      ParentShape = unknown,
      Type extends TypeParam<Types> = TypeParam<Types>,
      Nullable extends FieldNullability<Type> = FieldNullability<Type>,
      Args extends InputFieldMap = InputFieldMap,
      ResolveShape = unknown,
      ResolveReturnShape = unknown,
    > {
      shield?: ShieldRule;
    }

    // We need to match the original interface parameters
    export interface QueryFieldOptions<
      Types extends SchemaTypes,
      Type extends TypeParam<Types>,
      Nullable extends FieldNullability<Type>,
      Args extends InputFieldMap,
      ResolveReturnShape,
    > extends FieldOptions<
      Types,
      Types['Root'],
      Type,
      Nullable,
      Args,
      Types['Root'],
      ResolveReturnShape
    > {
      shield?: ShieldRule;
    }

    // We need to match the original interface parameters
    export interface MutationFieldOptions<
      Types extends SchemaTypes,
      Type extends TypeParam<Types>,
      Nullable extends FieldNullability<Type>,
      Args extends InputFieldMap,
      ResolveReturnShape,
    > extends FieldOptions<
      Types,
      Types['Root'],
      Type,
      Nullable,
      Args,
      Types['Root'],
      ResolveReturnShape
    > {
      shield?: ShieldRule;
    }
  }
}

const pluginName = 'shield' as const;

export default pluginName;

export class ShieldPlugin<Types extends SchemaTypes> extends BasePlugin<Types> {
  override afterBuild(schema: GraphQLSchema): GraphQLSchema {
    const rules: IRules = {};

    const types = schema.getTypeMap();
    for (const typeName of Object.keys(types)) {
      const type = types[typeName];
      if (!isObjectType(type)) {
        continue;
      }

      const rule = ((type.extensions?.pothosOptions ?? {}) as { shield?: ShieldRule }).shield;
      const ruleMap: Record<string, ShieldRule> = rule
        ? { '*': rule, }
        : {};

      rules[typeName] = ruleMap;
      const fields = type.getFields();

      for (const fieldName of Object.keys(fields)) {
        const field = fields[fieldName];
        const { shield: fieldRule } = (field.extensions?.pothosOptions ?? {}) as {
          shield?: ShieldRule;
        };

        if (fieldRule) {
          ruleMap[fieldName] = fieldRule;
        }
      }
    }

    return applyMiddleware(schema, shield(rules));
  }
}

SchemaBuilder.registerPlugin(pluginName, ShieldPlugin);