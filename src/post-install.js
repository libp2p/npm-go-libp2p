/* eslint-disable no-console */

import { download } from './download.js'

download()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
