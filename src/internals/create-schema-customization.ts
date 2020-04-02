import path from "path";
import { existsSync } from "fs";
import {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  // @ts-ignore
} from "gatsby/graphql";
import { OutputFormat } from "aws-sdk/clients/polly";
import { fetchAudioFile, fetchSpeechMarks } from "./aws-polly";
import { pollyTypeName } from "./constants";

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
  const targetDirectoryAbsolute = path.join(
    process.cwd(),
    "public",
    "static",
    file.internal.contentDigest
  );
  const targetFilename = `${file.name}.${targetExtensionMap.get(
    fieldArgs.audioFileFormat
  )}`;
  const targetFilePath = path.join(targetDirectoryAbsolute, targetFilename);

  if (!existsSync(targetFilePath)) {
    reporter.info(
      `Generating AWS Polly audio file for SSML file: ${file.base}`
    );
    await fetchAudioFile(
      ssmlFileAbsolutePath,
      pluginOptions,
      fieldArgs,
      targetDirectoryAbsolute,
      targetFilePath
    );
  }

  return `/static/${file.internal.contentDigest}/${encodeURIComponent(
    targetFilename
  )}`;
};

const resolveSpeechMarks = async (
  file: any,
  polly: any,
  fieldArgs: any,
  reporter: any,
  cache: any,
  pluginOptions: any
) => {
  const cacheKey = `Polly-SpeechMarks-${file.internal.contentDigest}`;
  const cachedSpeechMarks = await cache.get(cacheKey);
  if (cachedSpeechMarks) {
    return cachedSpeechMarks;
  }

  const ssmlFileAbsolutePath = file.absolutePath;
  reporter.info(
    `Generating AWS Polly speech marks for SSML file: ${file.base}`
  );
  const fetchedSpeechMarks = await fetchSpeechMarks(
    ssmlFileAbsolutePath,
    pluginOptions,
    fieldArgs
  );
  await cache.set(cacheKey, fetchedSpeechMarks);
  return fetchedSpeechMarks;
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
