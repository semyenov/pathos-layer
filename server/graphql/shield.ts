/* eslint-disable @typescript-eslint/no-namespace */
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
import type { YogaContext } from 'graphql-yoga';

type ShieldRule = IRule;

declare global {
  export namespace PothosSchemaTypes {
    export interface Plugins<Types extends SchemaTypes> {
      shield?: ShieldPlugin<Types>;
    }

    export interface ObjectTypeOptions<Types extends SchemaTypes = SchemaTypes, Shape = unknown>
      extends BaseTypeOptions<Types> {
      shield?: ShieldRule;
    }

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
      const ruleMap: Record<string, ShieldRule> = rule ? { '*': rule, } : {};

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

    return applyMiddleware(
      schema,
      shield<IRules, YogaContext>(rules, {
        debug: true,
        fallbackError: 'Unauthorized shield error',
        allowExternalErrors: true,
        fallbackRule: {
          name: 'unauthorized',
          equals: () => true,
          extractFragment: () => undefined,
          resolve: () => Promise.resolve(true),
        },
      }),
    );
  }
}

SchemaBuilder.registerPlugin(pluginName, ShieldPlugin);