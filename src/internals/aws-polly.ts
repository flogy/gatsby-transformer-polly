import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import {
  PollyClient,
  SynthesizeSpeechCommand,
  OutputFormat,
} from "@aws-sdk/client-polly";

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const initializeAwsPolly = (pluginOptions: any) => {
  return new PollyClient({
    apiVersion: "2016-06-10",
    region: pluginOptions.awsRegion,
    credentials: defaultProvider({
      profile: pluginOptions.awsProfile,
      mfaCodeProvider: async (mfaSerial) => {
        return new Promise((resolve) => {
          readline.question(
            `Enter MFA token for AWS account: ${mfaSerial}\n`,
            (mfaToken) => {
              readline.close();
              resolve(mfaToken);
            }
          );
        });
      },
    }),
  });
};

const synthesizeSpeech = async (
  text: string,
  pluginOptions: any,
  fieldArgs: any,
  outputFormat: OutputFormat
) => {
  const client = initializeAwsPolly(pluginOptions);
  return await client.send(
    new SynthesizeSpeechCommand({
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
    })
  );
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

export const fetchAudioFile = async (
  ssmlFileAbsolutePath: string,
  pluginOptions: any,
  fieldArgs: any,
  targetDirectoryAbsolute: string,
  targetFilePath: string
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

  mkdirSync(targetDirectoryAbsolute, { recursive: true });
  writeFileSync(targetFilePath, await audioData.transformToByteArray());
};
