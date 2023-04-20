### Changelog

## 1.0.0

### Breaking Changes

- Plugin option `awsCredentials` was removed. Use `awsProfile` or environment variables instead (see [README](https://github.com/flogy/gatsby-transformer-polly#aws-credentials) for details).

### Major Changes

- a5e1c39: Added support for Gatsby 5.

#### 0.0.1

> 2 April 2020

- added README, initialized NPM, installed some basic dev dependencies [`b0c0a91`](https://github.com/flogy/gatsby-transformer-polly/commit/b0c0a91d3c9375bcf26713d3ec0b1d50ae0a349a)
- implemented audio file and speech mark generation without caching yet [`8ada090`](https://github.com/flogy/gatsby-transformer-polly/commit/8ada09025b1b85ce353bc683873f234f2e65697d)
- create child nodes for ssml file nodes, faked out resolvers [`1c8ae70`](https://github.com/flogy/gatsby-transformer-polly/commit/1c8ae709859c0b05ed55747efadd2e420da79654)
