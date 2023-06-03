# go-libp2p <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/npm-go-libp2p.svg?style=flat-square)](https://codecov.io/gh/libp2p/npm-go-libp2p)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/npm-go-libp2p/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/libp2p/npm-go-libp2p/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> Install the latest go-libp2p binary

## Table of contents <!-- omit in toc -->

- [Install](#install)
- [Publishing new versions](#publishing-new-versions)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i go-libp2p
```

```sh
# Install globally
> npm install -g go-libp2p
> libp2p version
libp2p version v0.7.0

# Install locally
> npm install go-libp2p
> ./node_modules/.bin/libp2p
libp2p version v0.7.0
```

## Publishing new versions

0. Install go 1.20 or later
1. Create a w3storage account
2. Generate an API token and store it in `./scripts/.config.js`
    ```js
    export const API_TOKEN = '... token here ...'
3. Run makefile
    ```console
    $ make all
    ```
4. Upload new versions
    ```console
    $ node scripts/upload.js
    ```
5. Open a PR with the `src/versions.json` changes

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
