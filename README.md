![Logo](./img/gatsby-transformer-polly.svg)

> 🗣 Easy **text-to-speech** for your [Gatsby](https://www.gatsbyjs.org/) site, powered by [Amazon Polly](https://aws.amazon.com/de/polly/).

# gatsby-transformer-polly

⚠️ This project is under heavy development, so breaking changes may occur on our road to a stable v1.0.0. Any bug reports and [contributions](#contribute-) will be highly appreciated.

[![Pull requests are welcome!](https://img.shields.io/badge/PRs-welcome-brightgreen)](#contribute-)
[![npm](https://img.shields.io/npm/v/gatsby-transformer-polly)](https://www.npmjs.com/package/gatsby-transformer-polly)
[![GitHub license](https://img.shields.io/github/license/flogy/gatsby-transformer-polly)](https://github.com/flogy/gatsby-transformer-polly/blob/master/LICENSE)

## Installation

`npm install --save gatsby-transformer-polly`

## How to use

### Prerequisites

1. In order to use this plugin you need an [AWS account](https://portal.aws.amazon.com/billing/signup). You can use the text-to-speech service ([AWS Polly](https://aws.amazon.com/de/polly/)) for free for the first 12 months (up to a couple million words to be precise).

   **Attention:** If you exceed the limits or use it after your initial free tier, using this plugin will generate costs in your AWS account!

2. As this plugin is based on SSML files, the [gatsby-source-filesystem](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-filesystem) is required to be installed and configured as well.

### Mandatory configurations

#### gatsby-config.js

To include this plugin add it to your `gatsby-config.js` file as follows. Also, make sure you have included an entry for the necessary `gatsby-source-filesystem` plugin. Now link them together by setting gatsby-transformer-polly's `ssmlFilesSourceInstanceName` option to the same value as gatsby-source-filesystem's `name` option.

The other options shown in this example are also mandatory:

```javascript
// In your gatsby-config.js
plugins: [
  {
    resolve: `gatsby-source-filesystem`,
    options: {
      name: `ssml`,
      path: `${__dirname}/src/ssml/`,
    },
  },
  {
    resolve: `gatsby-transformer-polly`,
    options: {
      ssmlFilesSourceInstanceName: `ssml`,
      awsRegion: `us-east-1`,
    },
  },
],
```

#### AWS credentials

The plugin requires your AWS credentials in order to generate the text-to-speech data.

There are two ways to configure your AWS credentials:

1. _(recommended)_ The recommended way is to [create a shared credentials file](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/create-shared-credentials-file.html). You probably already have one if you used the AWS CLI before.
2. To override the credentials defined in a shared credentials file or to easily build on a CI environment you can optionally pass in the AWS credentials using plugin configuration options:

```javascript
// In your gatsby-config.js
{
  resolve: "gatsby-transformer-polly",
  options: {
    awsCredentials: {
      accessKeyId: process.env.GATSBY_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.GATSBY_AWS_SECRET_ACCESS_KEY,
    },
  },
},
```

**Attention:** If you choose to go with option 2 it is highly recommended to work with [environment variables](https://www.gatsbyjs.org/docs/environment-variables/) (as seen in the example above)! Do not directly paste your AWS credentials into your `gatsby-config.js` file and commit it to git as this would be a security issue!

### All configurations

| Option                        | Required | Example                                                                                                                |
| ----------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ssmlFilesSourceInstanceName` | Yes      | `"ssml"`                                                                                                               |
| `awsRegion`                   | Yes      | `"us-east-1"`                                                                                                          |
| `awsCredentials`              | No       | `{ "accessKeyId": process.env.GATSBY_AWS_ACCESS_KEY_ID, "secretAccessKey": process.env.GATSBY_AWS_SECRET_ACCESS_KEY }` |

### Create SSML files

As this plugin transforms SSML files into e.g. `*.mp3` files or speech mark data, you will have to create some SSML files first.

Create them in the directory defined in the `gatsby-source-filesystem` declaration inside your `gatsby-config.js`.

Make sure you only use the [SSML tags supported by AWS Polly](https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html).

Here is an example SSML file content:

```xml
<speak>
     Hello <break time="300ms"/> World.
</speak>
```

### Query speech output data

Now you can just query the required data using GraphQL:

```js
const data = useStaticQuery(graphql`
  query {
    file(relativePath: { eq: "ssml/hello-world.xml" }) {
      childPolly {
        # Specify the speech output attributes right in the query.
        polly(voiceId: "Justin", audioFileFormat: "mp3") {
          audioFileSrc
          speechMarks
        }
      }
    }
  }
`);
```

#### Query parameters

The following query parameters can be used to modify the generated speech output:

| Parameter         | Required | Example                | Valid values                                                                                                            |
| ----------------- | -------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `voiceId`         | Yes      | `"Justin"`             | See [Voices in Amazon Polly](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html)                                |
| `audioFileFormat` | Yes      | `"mp3"`                | `mp3 / ogg_vorbis / pcm`                                                                                                |
| `engine`          | No       | `"standard"`           | `standard / neural`                                                                                                     |
| `languageCode`    | No       | `"en-US"`              | See "LanguageCode" in [SynthesizeSpeech docs](https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html)    |
| `lexiconNames`    | No       | `["LexA", "LexB"]`     | See "LexiconNames" in [SynthesizeSpeech docs](https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html)    |
| `sampleRate`      | No       | `16000`                | See "SampleRate" in [SynthesizeSpeech docs](https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html)      |
| `speechMarkTypes` | No       | `["sentence", "word"]` | See "SpeechMarkTypes" in [SynthesizeSpeech docs](https://docs.aws.amazon.com/polly/latest/dg/API_SynthesizeSpeech.html) |

## Contribute 🦸

Contributions are more than welcome! I would love to see text-to-speech becoming a thing in the already very accessible Gatsby ecosystem. If you agree with this and would like to join me on this mission it would be awesome to get in touch! 😊

Please feel free to create, comment and of course solve some of the issues. To get started you can also go for the easier issues marked with the `good first issue` label if you like.

## License

The [MIT License](LICENSE)

## Credits

The _gatsby-transformer-polly_ library is maintained and sponsored by the Swiss web and mobile app development company [Florian Gyger Software](https://floriangyger.ch).
