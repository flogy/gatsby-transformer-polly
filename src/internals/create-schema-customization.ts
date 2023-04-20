import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
} from "gatsby/graphql";
import {
  GatsbyNode,
  CreateSchemaCustomizationArgs,
  PluginOptions,
  Reporter,
  GatsbyCache,
} from "gatsby";
import { OutputFormat } from "@aws-sdk/client-polly";
import { fetchAudioFile, fetchSpeechMarks } from "./aws-polly";
import { pollyTypeName } from "./constants";

const targetExtensionMap = new Map<OutputFormat, string>();
targetExtensionMap.set("mp3", "mp3");
targetExtensionMap.set("ogg_vorbis", "ogg");
targetExtensionMap.set("pcm", "pcm");

const buildHash = (file: any, fieldArgs: any) => {
  const unhashedKey = `Polly-SpeechMarks-${
    file.internal.contentDigest
  }-${JSON.stringify(fieldArgs)}`;
  return crypto.createHash("md5").update(unhashedKey).digest("hex");
};

const resolveAudioFileSrc = async (
  file: any,
  fieldArgs: any,
  reporter: Reporter,
  pluginOptions: PluginOptions
) => {
  const ssmlFileAbsolutePath = file.absolutePath;
  const hash = buildHash(file, fieldArgs);
  const targetDirectoryAbsolute = path.join(
    process.cwd(),
    "public",
    "static",
    hash
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

  return `/static/${hash}/${encodeURIComponent(targetFilename)}`;
};

const resolveSpeechMarks = async (
  file: any,
  fieldArgs: any,
  reporter: Reporter,
  cache: GatsbyCache,
  pluginOptions: PluginOptions
) => {
  const cacheKey = buildHash(file, fieldArgs);
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

const createFields = async (
  {
    pathPrefix,
    getNodeAndSavePathDependency,
    reporter,
    cache,
  }: CreateSchemaCustomizationArgs,
  pluginOptions: PluginOptions
) => {
  return {
    polly: {
      type: new GraphQLObjectType({
        name: `${pollyTypeName}Data`,
        fields: {
          audioFileSrc: {
            type: GraphQLString,
            resolve: ({ file, fieldArgs }) =>
              resolveAudioFileSrc(file, fieldArgs, reporter, pluginOptions),
          },
          speechMarks: {
            type: GraphQLString,
            resolve: ({ file, fieldArgs }) =>
              resolveSpeechMarks(
                file,
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

export const createSchemaCustomization: GatsbyNode["createSchemaCustomization"] =
  async (args, pluginOptions) => {
    const {
      actions: { createTypes },
      schema,
    } = args;
    const pollyType = schema.buildObjectType({
      name: pollyTypeName,
      fields: await createFields(args, pluginOptions),
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
