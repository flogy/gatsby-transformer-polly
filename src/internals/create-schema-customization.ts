import {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  // @ts-ignore
} from "gatsby/graphql";
import { pollyTypeName } from "./constants";

const resolveAudioFileSrc = (fieldArgs: any, cache: any, reporter: any) => {
  return "Fake AudioFileSrc";
};

const resolveSpeechMarks = (fieldArgs: any, cache: any, reporter: any) => {
  return "Fake SpeechMarks";
};

const createFields = ({
  pathPrefix,
  getNodeAndSavePathDependency,
  reporter,
  cache,
}: any) => {
  return {
    polly: {
      type: new GraphQLObjectType({
        name: `${pollyTypeName}Data`,
        fields: {
          audioFileSrc: {
            type: GraphQLString,
            resolve: ({ fieldArgs }: any) =>
              resolveAudioFileSrc(fieldArgs, cache, reporter),
          },
          speechMarks: {
            type: GraphQLString,
            resolve: ({ fieldArgs }: any) =>
              resolveSpeechMarks(fieldArgs, cache, reporter),
          },
        },
      }),
      args: {
        voiceId: {
          type: GraphQLString,
        },
        audioFileFormat: {
          type: GraphQLString,
        },
        engine: {
          type: GraphQLString,
        },
        languageCode: {
          type: GraphQLString,
        },
        lexiconNames: {
          type: new GraphQLList(GraphQLString),
        },
        sampleRate: {
          type: GraphQLInt,
        },
        speechMarkTypes: {
          type: new GraphQLList(GraphQLString),
        },
      },
      resolve: (polly: any, fieldArgs: any, context: any) => {
        const file = getNodeAndSavePathDependency(polly.parent, context.path);
        const args = { ...fieldArgs, pathPrefix };
        return {
          fieldArgs: args,
          polly,
          file,
        };
      },
    },
  };
};

export const createSchemaCustomization = ({
  actions: { createTypes },
  pathPrefix,
  getNodeAndSavePathDependency,
  reporter,
  cache,
  schema,
}: any) => {
  const pollyType = schema.buildObjectType({
    name: pollyTypeName,
    fields: createFields({
      pathPrefix,
      getNodeAndSavePathDependency,
      reporter,
      cache,
    }),
    interfaces: [`Node`],
    extensions: {
      infer: true,
      childOf: {
        types: [`File`],
      },
    },
  });

  if (createTypes) {
    createTypes([pollyType]);
  }
};
