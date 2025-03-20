# @wiidede/ebml

forked from [embl](https://github.com/node-ebml/node-ebml)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

## Changes

- esm only
- remove debug
- remove buffer using Uint8Array
- Web Streams API instead of Node.js streams
- Web-first API design

---

# EBML

[EBML][ebml] stands for Extensible Binary Meta-Language and is somewhat of a
binary version of XML. It's used for container formats like [WebM][webm] or
[MKV][mkv].

## Note

This version completely modernizes the original library, using Web Streams API and ESM.

---

# Install

```bash
pnpm add @wiidede/ebml
```

# Usage

The `Decoder()` class is implemented using the [Web Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API).
As input it takes EBML. As output it emits a sequence of chunks: two-element
arrays looking like this example.

```js
[
  'tag',
  {
    name: 'TimecodeScale',
    type: 'u',
    value: 1000000,
  },
]
```

The first element of the array is a short text string. For tags containing
values, like this example, the string is `'tag'`. ebml also has nesting tags.
The opening of those tags has the string `'start'` and the closing has the
string `'end'`. Integers stored in 6 bytes or less are represented as numbers,
and longer integers are represented as hexadecimal text strings.

The second element of the array is an object with these members, among others:

- `name` is the [Matroska][mkv] Element Name.
- `type` is the data type.
  - `u`: unsigned integer. Some of these are UIDs, coded as 128-bit numbers.
  - `i`: signed integer.
  - `f`: IEEE-754 floating point number.
  - `s`: printable ASCII text string.
  - `8`: printable utf-8 Unicode text string.
  - `d`: a 64-bit signed timestamp, in nanoseconds after (or before) `2001-01-01T00:00UTC`.
  - `b` binary data, otherwise uninterpreted.
- `value` is the value of the data in the element, represented as a number or a string.
- `data` is the binary data of the entire element stored in a [`Uint8Array`][mdn-uint8array].

Elements with the [`Block`][mkv-block] and [`SimpleBlock`][mkv-sblock] types
get special treatment. They have these additional members:

- `payload` is the coded information in the element, stored in a [`Uint8Array`][mdn-uint8array].
- `track` is an unsigned integer indicating the payload's track.
- `keyframe` is a Boolean value set to true if the payload starts an I frame (`SimpleBlocks` only).
- `discardable` is a Boolean value showing the value of the element's Discardable flag. (`SimpleBlocks` only).

And the `value` member shows the block's Timecode value.

# Examples

This example reads a media file using the Fetch API and decodes it. The `decoder`
processes the chunks as they arrive.

```js
import { Decoder } from '@wiidede/ebml'

const decoder = new Decoder()

// Using the readable stream's reader
const reader = decoder.stream.readable.getReader()

reader.read().then(function processChunk({ done, value }) {
  if (done)
    return

  console.log(value)

  // Continue reading
  reader.read().then(processChunk)
})

// Fetch the file and pipe to decoder
fetch('media/test.webm')
  .then((response) => {
    if (!response.ok)
      throw new Error(`HTTP error! Status: ${response.status}`)

    // Get a reader for the response body stream
    const reader = response.body.getReader()

    // Read the data
    reader.read().then(function processData({ done, value }) {
      if (done) {
        decoder.end()
        return
      }

      // Feed chunk to decoder
      decoder.write(value)

      // Continue reading
      return reader.read().then(processData)
    })
  })
  .catch(error => console.error('Fetch error:', error))
```

This example counts tag occurrences using Web Streams API:

```js
import { Decoder } from '@wiidede/ebml'

const ebmlDecoder = new Decoder()
const counts = {}

// Fetch the file
fetch('media/test.webm')
  .then((response) => {
    if (!response.ok)
      throw new Error(`HTTP error! Status: ${response.status}`)

    // Create a reader for the decoder output
    const reader = ebmlDecoder.stream.readable.getReader()

    // Process decoded chunks
    reader.read().then(function processOutput({ done, value }) {
      if (done) {
        console.log(counts)
        return
      }

      const { name } = value[1]
      if (!counts[name]) {
        counts[name] = 0
      }
      counts[name] += 1

      // Continue reading
      return reader.read().then(processOutput)
    })

    // Pipe response body to decoder
    const responseReader = response.body.getReader()

    responseReader.read().then(function processInput({ done, value }) {
      if (done) {
        ebmlDecoder.end()
        return
      }

      ebmlDecoder.write(value)
      return responseReader.read().then(processInput)
    })
  })
  .catch(error => console.error('Fetch error:', error))
```

# Thanks

- [embl](https://github.com/node-ebml/node-ebml)
- Claude & cursor

[ebml]: http://ebml.sourceforge.net/
[mdn-uint8array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
[mkv]: http://www.matroska.org/technical/specs/index.html
[mkv-block]: https://www.matroska.org/technical/specs/index.html#block_structure
[mkv-sblock]: https://www.matroska.org/technical/specs/index.html#simpleblock_structure
[webm]: https://www.webmproject.org/
[npm-version-src]: https://img.shields.io/npm/v/@wiidede/ebml?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@wiidede/e'bm'l
[npm-downloads-src]: https://img.shields.io/npm/dm/@wiidede/ebml?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@wiidede/ebml
