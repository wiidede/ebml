import Buffer from 'node:buffer'
import { describe, it } from 'jest'
import unexpected from 'unexpected'
import { Decoder, Encoder } from '../src/ebml'

const expect = unexpected.clone()

describe('ebml', () => {
  describe('pipeline', () => {
    it('should output input buffer', (done) => {
      const decoder = new Decoder()
      const encoder = new Encoder()
      const buffer = Buffer.from([
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

      encoder.on('data', (chunk) => {
        expect(chunk.toString('hex'), 'to equal', buffer.toString('hex'))
        encoder.on('finish', done)
        done()
      })
      encoder.on('finish', done)
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

      encoder.pipe(decoder).on('data', (data) => {
        expect(data[1].name, 'to be', 'Cluster')
        expect(data[1].start, 'to be', 0)
        expect(data[1].end, 'to be', -1)
        done()
      })
      encoder.pipe(decoder).on('finish', done)
      encoder.end()
    })
  })
})
