import fs from 'node:fs'
import { describe, it } from '@jest/globals'
import unexpected from 'unexpected'
import { Decoder } from '../src/ebml'

process.setMaxListeners(Infinity)

const expect = unexpected.clone()

// Helper function to load test files using node:fs instead of fetch
function loadTestFile(filename) {
  return new Uint8Array(fs.readFileSync(`media/${filename}`))
}

describe('eBML', () => {
  describe('values in tags', () => {
    describe('aVC1', () => {
      // This test will now be async to load the file
      it('should get a correct PixelWidth value from a file (2-byte unsigned int)', (done) => {
        const data = loadTestFile('video-webm-codecs-avc1-42E01E.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'PixelWidth') {
              expect(tagValue, 'to equal', 352)
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct EBMLVersion value from a file (one-byte unsigned int)', (done) => {
        const data = loadTestFile('video-webm-codecs-avc1-42E01E.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'EBMLVersion') {
              expect(tagValue, 'to equal', 1)
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct TimeCodeScale value from a file (3-byte unsigned int)', (done) => {
        const data = loadTestFile('video-webm-codecs-avc1-42E01E.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'TimecodeScale') {
              expect(tagValue, 'to equal', 1000000)
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct TrackUID value from a file (56-bit integer in hex)', (done) => {
        const data = loadTestFile('video-webm-codecs-avc1-42E01E.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'TrackUID') {
              expect(tagValue, 'to be', '1c63824e507a46')
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct DocType value from a file (ASCII text)', (done) => {
        const data = loadTestFile('video-webm-codecs-avc1-42E01E.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'DocType') {
              expect(tagValue, 'to be', 'matroska')
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct MuxingApp value from a file (utf8 text)', (done) => {
        const data = loadTestFile('video-webm-codecs-avc1-42E01E.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, ...rest }] = value
            if (tag === 'tag' && name === 'MuxingApp') {
              expect(rest.value, 'to be', 'Chrome')
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct SimpleBlock time payload from a file (binary)', (done) => {
        const data = loadTestFile('video-webm-codecs-avc1-42E01E.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue, payload, track }] = value
            if (tag === 'tag' && name === 'SimpleBlock') {
              if (tagValue > 0 && tagValue < 200) {
                /* look at second simpleBlock */
                expect(track, 'to equal', 1)
                expect(tagValue, 'to equal', 191)
                expect(payload.byteLength, 'to equal', 169)
                reader.cancel().then(() => done())
              }
              else {
                processChunks()
              }
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })
    })

    describe('vP8', () => {
      it('should get a correct PixelWidth value from a video/webm; codecs="vp8" file (2-byte unsigned int)', (done) => {
        const data = loadTestFile('video-webm-codecs-vp8.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'PixelWidth') {
              expect(tagValue, 'to equal', 352)
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct EBMLVersion value from a video/webm; codecs="vp8" file (one-byte unsigned int)', (done) => {
        const data = loadTestFile('video-webm-codecs-vp8.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'EBMLVersion') {
              expect(tagValue, 'to equal', 1)
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct TimeCodeScale value from a video/webm; codecs="vp8" file (3-byte unsigned int)', (done) => {
        const data = loadTestFile('video-webm-codecs-vp8.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'TimecodeScale') {
              expect(tagValue, 'to equal', 1000000)
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct TrackUID value from a video/webm; codecs="vp8" file (56-bit integer in hex)', (done) => {
        const data = loadTestFile('video-webm-codecs-vp8.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'TrackUID') {
              expect(tagValue, 'to be', '306d02aaa74d06')
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct DocType value from a video/webm; codecs="vp8" file (ASCII text)', (done) => {
        const data = loadTestFile('video-webm-codecs-vp8.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'DocType') {
              expect(tagValue, 'to be', 'webm')
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct MuxingApp value from a video/webm; codecs="vp8" file (utf8 text)', (done) => {
        const data = loadTestFile('video-webm-codecs-vp8.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, value: tagValue }] = value
            if (tag === 'tag' && name === 'MuxingApp') {
              expect(tagValue, 'to be', 'Chrome')
              reader.cancel().then(() => done())
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })

      it('should get a correct SimpleBlock time payload from a file (binary)', (done) => {
        const data = loadTestFile('video-webm-codecs-vp8.webm')

        const decoder = new Decoder()
        const reader = decoder.stream.readable.getReader()

        function processChunks() {
          reader.read().then(({ done: readerDone, value }) => {
            if (readerDone) {
              reader.cancel().then(() => {
                done(new Error('hit end of file without finding tag'))
              })
              return
            }

            const [tag, { name, payload, value: tagValue, track, discardable }] = value
            if (tag === 'tag' && name === 'SimpleBlock') {
              if (tagValue > 0 && tagValue < 100) {
                expect(track, 'to equal', 1)
                expect(tagValue, 'to equal', 96)
                /* look at second simpleBlock */
                expect(payload.byteLength, 'to equal', 43)
                expect(discardable, 'to be false')
                reader.cancel().then(() => done())
              }
              else {
                processChunks()
              }
            }
            else {
              processChunks()
            }
          }).catch((err) => {
            reader.cancel().then(() => done(err))
          })
        }

        processChunks()
        decoder.write(data)
        decoder.end()
      })
    })
  })
})
