import {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  // @ts-ignore
} from "gatsby/graphql";
import { pollyTypeName } from "./constants";
import { OutputFormat } from "aws-sdk/clients/polly";
import { fetchAudioFile, fetchSpeechMarks } from "./aws-polly";

const targetExtensionMap = new Map<OutputFormat, string>();
targetExtensionMap.set("mp3", "mp3");
targetExtensionMap.set("ogg_vorbis", "ogg");
targetExtensionMap.set("pcm", "pcm");

const resolveAudioFileSrc = async (
  file: any,
  polly: any,
  fieldArgs: any,
  reporter: any,
  cache: any,
  pluginOptions: any
) => {
  const ssmlFileAbsolutePath = file.absolutePath;
  const targetFilename = `${file.name}.${targetExtensionMap.get(
    fieldArgs.audioFileFormat
  )}`;

  return await fetchAudioFile(
    ssmlFileAbsolutePath,
    pluginOptions,
    fieldArgs,
    targetFilename
  );
};

const resolveSpeechMarks = async (
  file: any,
  polly: any,
  fieldArgs: any,
  cache: any,
  reporter: any,
  pluginOptions: any
) => {
  const ssmlFileAbsolutePath = file.absolutePath;
  return await fetchSpeechMarks(ssmlFileAbsolutePath, pluginOptions, fieldArgs);
};

const createFields = (
  { pathPrefix, getNodeAndSavePathDependency, reporter, cache }: any,
  pluginOptions: any
) => {
  return {
    polly: {
      type: new GraphQLObjectType({
        name: `${pollyTypeName}Data`,
        fields: {
          audioFileSrc: {
            type: GraphQLString,
            resolve: ({ file, polly, fieldArgs }: any) =>
              resolveAudioFileSrc(
                file,
                polly,
                fieldArgs,
                reporter,
                cache,
                pluginOptions
              ),
          },
          speechMarks: {
            type: GraphQLString,
            resolve: ({ file, polly, fieldArgs }: any) =>
              resolveSpeechMarks(
                file,
                polly,
                fieldArgs,
                reporter,
                cache,
                pluginOptions
              ),
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

export const createSchemaCustomization = (
  {
    actions: { createTypes },
    pathPrefix,
    getNodeAndSavePathDependency,
    reporter,
    cache,
    schema,
  }: any,
  pluginOptions: any
) => {
  const pollyType = schema.buildObjectType({
    name: pollyTypeName,
    fields: createFields(
      {
        pathPrefix,
        getNodeAndSavePathDependency,
        reporter,
        cache,
      },
      pluginOptions
    ),
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
