import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import AWS from "aws-sdk";
import { AudioStream, OutputFormat } from "aws-sdk/clients/polly";
const AwsConfig = AWS.config;

const initializeAwsPolly = (pluginOptions: any) => {
  AwsConfig.update({
    region: pluginOptions.awsRegion,
    ...(pluginOptions.awsCredentials && {
      credentials: {
        accessKeyId: pluginOptions.awsCredentials.accessKeyId,
        secretAccessKey: pluginOptions.awsCredentials.secretAccessKey,
      },
    }),
  });
  return new AWS.Polly({ apiVersion: "2016-06-10" });
};

const synthesizeSpeech = async (
  text: string,
  pluginOptions: any,
  fieldArgs: any,
  outputFormat: OutputFormat
) => {
  const Polly = initializeAwsPolly(pluginOptions);

  return await Polly.synthesizeSpeech({
    Engine: fieldArgs.engine,
    LanguageCode: fieldArgs.languageCode,
    LexiconNames: fieldArgs.lexiconNames,
    OutputFormat: outputFormat,
    SampleRate: fieldArgs.sampleRate,
    ...(outputFormat === "json" && {
      SpeechMarkTypes: fieldArgs.speechMarkTypes,
    }),
    Text: text,
    TextType: "ssml",
    VoiceId: fieldArgs.voiceId,
  }).promise();
};

export const fetchSpeechMarks = async (
  ssmlFileAbsolutePath: string,
  pluginOptions: any,
  fieldArgs: any
) => {
  const ssmlText = readFileSync(ssmlFileAbsolutePath, "utf-8");
  const data = await synthesizeSpeech(
    ssmlText,
    pluginOptions,
    fieldArgs,
    "json"
  );
  const speechMarks = data.AudioStream?.toString();
  return speechMarks || null;
};

const publicPath = "./public/polly/";

const saveAudioData = (
  audioData: AudioStream,
  targetFilename: string
): string => {
  mkdirSync(publicPath, { recursive: true });
  const targetPath = path.join(publicPath, targetFilename);
  writeFileSync(targetPath, audioData);
  return targetPath;
};

export const fetchAudioFile = async (
  ssmlFileAbsolutePath: string,
  pluginOptions: any,
  fieldArgs: any,
  targetFilename: string
) => {
  const ssmlText = readFileSync(ssmlFileAbsolutePath, "utf-8");
  const data = await synthesizeSpeech(
    ssmlText,
    pluginOptions,
    fieldArgs,
    fieldArgs.audioFileFormat
  );
  const audioData = data.AudioStream;
  if (!audioData) {
    throw new Error("No audio stream returned from AWS Polly request.");
  }
  const absolutePath = saveAudioData(audioData, targetFilename);
  return absolutePath;
};
