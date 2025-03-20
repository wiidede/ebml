import { beforeAll, beforeEach, describe, it } from '@jest/globals'
import unexpected from 'unexpected'
import unexpectedDate from 'unexpected-date'
import { Encoder } from './index'

const expect = unexpected.clone().use(unexpectedDate)

describe('EBML', () => {
  describe('Encoder', () => {
    function createEncoder(expected, done) {
      const encoder = new Encoder()

      // Use the readable stream's reader instead of 'on' event
      const reader = encoder.stream.readable.getReader()

      reader.read().then(({ value }) => {
        expect(
          Array.from(value).map(b => b.toString(16).padStart(2, '0')).join(''),
          'to be',
          Array.from(expected).map(b => b.toString(16).padStart(2, '0')).join(''),
        )

        reader.cancel().then(() => done())
      }).catch((err) => {
        console.error('Error in test:', err)
        done(err)
      })

      return encoder
    }

    it('should write a single tag', (done) => {
      const encoder = createEncoder(new Uint8Array([0x42, 0x86, 0x81, 0x01]), done)
      encoder.write([
        'tag',
        {
          name: 'EBMLVersion',
          data: new Uint8Array([0x01]),
        },
      ])
      encoder.end()
    })

    it('should write a tag with a single child', (done) => {
      const encoder = createEncoder(
        new Uint8Array([0x1A, 0x45, 0xDF, 0xA3, 0x84, 0x42, 0x86, 0x81, 0x00]),
        done,
      )
      encoder.write(['start', { name: 'EBML' }])
      encoder.write([
        'tag',
        {
          name: 'EBMLVersion',
          data: new Uint8Array([0x00]),
        },
      ])
      encoder.write(['end', { name: 'EBML' }])
    })

    describe('#cork and #uncork', () => {
      let encoder
      beforeEach(() => {
        encoder = new Encoder()
      })

      it('should not emit data while corked', (done) => {
        const reader = encoder.stream.readable.getReader()
        let receivedData = false

        setTimeout(() => {
          expect(receivedData, 'to be', false)
          reader.cancel().then(() => done())
        }, 100)

        reader.read().then(({ done: readerDone, value: _value }) => {
          if (!readerDone) {
            receivedData = true
          }
        })

        encoder.write(['start', { name: 'EBML' }])
        encoder.write([
          'tag',
          {
            name: 'EBMLVersion',
            data: new Uint8Array([0x00]),
          },
        ])

        encoder.cork()

        encoder.write(['end', { name: 'EBML' }])
      })

      it('should emit data after uncorking', (done) => {
        const reader = encoder.stream.readable.getReader()

        reader.read().then(({ value }) => {
          expect(value, 'to be a', Uint8Array)
          expect(value.length, 'to be greater than', 0)
          reader.cancel().then(() => done())
        })

        encoder.write(['start', { name: 'EBML' }])
        encoder.write([
          'tag',
          {
            name: 'EBMLVersion',
            data: new Uint8Array([0x00]),
          },
        ])

        encoder.cork()

        encoder.write(['end', { name: 'EBML' }])

        setTimeout(() => {
          encoder.uncork()
        }, 50)
      })
    })

    describe('::getSchemaInfo', () => {
      it('should return a valid number when a tag is found', () => {
        expect(Encoder.getSchemaInfo('EBMLVersion'), 'not to be null')
      })

      it('should return null when not found', () => {
        expect(Encoder.getSchemaInfo('404NotFound'), 'to be null')
      })
    })

    describe('#writeTag', () => {
      let encoder
      beforeAll(() => {
        encoder = new Encoder()
      })

      it('does nothing with invalid tag data', () => {
        encoder.writeTag('EBMLVersion', null)
        expect(encoder.stack.length, 'to equal', 0)
      })

      it('throws with an invalid tag name', () => {
        expect(
          () => {
            encoder.writeTag('404NotFound')
          },
          'to throw',
          /No schema entry found/,
        )
      })
    })

    describe('#startTag', () => {
      let encoder
      beforeAll(() => {
        encoder = new Encoder()
      })

      it('throws with an invalid tag name', () => {
        expect(
          () => {
            encoder.startTag('404NotFound', { end: -1 })
          },
          'to throw',
          /No schema entry found/,
        )
      })

      it('creates a valid tag when presented', () => {
        encoder.startTag('ChapterTrackNumber', { end: -1 })
        expect(encoder.stack, 'not to be empty')
          .and('to have length', 1)
          .and('to satisfy', [
            {
              data: expect.it('to be null'),
              id: expect.it('to equal', 0x89),
              name: expect.it('to equal', 'ChapterTrackNumber'),
              children: expect.it('to be an array').and('to be empty'),
            },
          ])
      })

      it('creates a valid tag when presented with a stack already present', () => {
        encoder.stack = [
          {
            data: 1,
            id: 0x89,
            name: 'ChapterTrackNumber',
            children: [],
          },
        ]
        encoder.startTag('ChapterTimeStart', { end: 0x80 })
        expect(encoder.stack[0].children, 'not to be empty').and(
          'to have length',
          1,
        )
      })
    })

    describe('#_transform', () => {
      it('should do nothing on an invalid tag', () => {
        const encoder = new Encoder()
        encoder.write(['404NotFound', { name: 'EBML' }])
        expect(encoder.buffer, 'to be null')
      })
    })

    describe('#bufferAndFlush', () => {
      let encoder
      beforeEach(() => {
        encoder = new Encoder()
      })

      it('should create a new buffer with an empty buffer', (done) => {
        expect(encoder.buffer, 'to be null')

        const reader = encoder.stream.readable.getReader()
        reader.read().then(({ value }) => {
          expect(value, 'to be a', Uint8Array)
          expect(Array.from(value), 'to equal', [0x42, 0x86, 0x81, 0x01])
          reader.cancel().then(() => done())
        })

        encoder.bufferAndFlush(new Uint8Array([0x42, 0x86, 0x81, 0x01]))
      })

      it('should append to the buffer with an existing buffer', (done) => {
        encoder.buffer = new Uint8Array([0x42, 0x86, 0x81, 0x01])
        expect(encoder.buffer, 'to be a', Uint8Array)

        const reader = encoder.stream.readable.getReader()
        reader.read().then(({ value }) => {
          expect(value, 'to be a', Uint8Array)
          expect(Array.from(value), 'to equal', [0x42, 0x86, 0x81, 0x01, 0x42, 0x86, 0x81, 0x01])
          reader.cancel().then(() => done())
        })

        encoder.bufferAndFlush(new Uint8Array([0x42, 0x86, 0x81, 0x01]))
      })
    })
  })
})
