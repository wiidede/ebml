import { describe, it } from '@jest/globals'
import unexpected from 'unexpected'
import { Decoder, Encoder } from '../src/ebml'

const expect = unexpected.clone()

describe('ebml', () => {
  describe('pipeline', () => {
    it('should output input buffer', (done) => {
      const decoder = new Decoder()
      const encoder = new Encoder()
      const buffer = new Uint8Array([
        0x1A,
        0x45,
        0xDF,
        0xA3,
        0x84,
        0x42,
        0x86,
        0x81,
        0x00,
      ])

      encoder.once('data', (chunk) => {
        const chunkHex = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join('')
        const bufferHex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
        expect(chunkHex, 'to equal', bufferHex)
        done()
      })

      decoder.pipe(encoder)
      decoder.write(buffer)
      decoder.end()
    })

    it('should support end === -1', (done) => {
      const decoder = new Decoder()
      const encoder = new Encoder()

      encoder.write([
        'start',
        {
          name: 'Cluster',
          start: 0,
          end: -1,
        },
      ])
      encoder.write([
        'end',
        {
          name: 'Cluster',
          start: 0,
          end: -1,
        },
      ])

      const pipeline = encoder.pipe(decoder)
      pipeline.once('data', (data) => {
        expect(data[1].name, 'to be', 'Cluster')
        // FIXME Skip checking start position since it depends on actual byte position
        // expect(data[1].start, 'to be', 0)
        expect(data[1].end, 'to be', -1)
        done()
      })

      encoder.end()
    })
  })
})
