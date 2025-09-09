# go-libp2p

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/npm-go-libp2p.svg?style=flat-square)](https://codecov.io/gh/libp2p/npm-go-libp2p)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/npm-go-libp2p/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/libp2p/npm-go-libp2p/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> Install the latest go-libp2p binary

# Install

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

The makefile in this repo will build `go-libp2p-daemon` for every supported platform, compress the binaries and update `src/versions.json`.

The compressed binaries must be added to the relevant `go-libp2p-daemon` [release page](https://github.com/libp2p/go-libp2p-daemon/releases) on GitHub.

### Prequisites

- Install a version of go that's capable of building the target `go-libp2p-daemon` version.

### Instructions

1. Run makefile
   ```console
   $ make all
   ```
2. Upload new versions to the GitHub release page
3. Open a PR to this repo with changes made to `src/versions.json`

If anything goes wrong:

```console
$ make clean
```

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/libp2p/npm-go-libp2p/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/libp2p/npm-go-libp2p/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
