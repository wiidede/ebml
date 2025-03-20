import { describe, it } from '@jest/globals'
import forEach from 'lodash.foreach'
import range from 'lodash.range'
import unexpected from 'unexpected'
import unexpectedDate from 'unexpected-date'
import tools from './tools'

const expect = unexpected.clone().use(unexpectedDate)

describe('EBML', () => {
  describe('tools', () => {
    describe('#readVint()', () => {
      function readVint(buffer, expected) {
        const vint = tools.readVint(buffer, 0)
        expect(expected, 'to be', vint.value)
        expect(buffer.length, 'to be', vint.length)
      }

      it('should read the correct value for all 1 byte integers', () => {
        forEach(range(0x80), i => readVint(new Uint8Array([i | 0x80]), i))
      })
      it('should read the correct value for 1 byte int with non-zero start', () => {
        const b = new Uint8Array([0x00, 0x81])
        const vint = tools.readVint(b, 1)
        expect(vint.value, 'to be', 1)
        expect(vint.length, 'to be', 1)
      })
      it('should read the correct value for all 2 byte integers', () => {
        forEach(range(0x40), i =>
          forEach(range(0xFF), (j) => {
            readVint(new Uint8Array([i | 0x40, j]), (i << 8) + j)
          }))
      })
      it('should read the correct value for all 3 byte integers', () => {
        forEach(range(0, 0x20, 1), i =>
          forEach(range(0, 0xFF, 2), j =>
            forEach(range(0, 0xFF, 3), (k) => {
              readVint(new Uint8Array([i | 0x20, j, k]), (i << 16) + (j << 8) + k)
            })))
      })
      it('should read the correct value for 4 byte int min/max values', () => {
        readVint(new Uint8Array([0x10, 0x20, 0x00, 0x00]), 2 ** 21)
        readVint(new Uint8Array([0x1F, 0xFF, 0xFF, 0xFF]), 2 ** 28 - 1)
      })
      it('should read the correct value for 5 byte int min/max values', () => {
        readVint(new Uint8Array([0x08, 0x10, 0x00, 0x00, 0x00]), 2 ** 28)
        readVint(new Uint8Array([0x0F, 0xFF, 0xFF, 0xFF, 0xFF]), 2 ** 35 - 1)
      })
      it('should read the correct value for 6 byte int min/max values', () => {
        readVint(new Uint8Array([0x04, 0x08, 0x00, 0x00, 0x00, 0x00]), 2 ** 35)
        readVint(
          new Uint8Array([0x07, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
          2 ** 42 - 1,
        )
      })
      it('should read the correct value for 7 byte int min/max values', () => {
        readVint(
          new Uint8Array([0x02, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00]),
          2 ** 42,
        )
        readVint(
          new Uint8Array([0x03, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
          2 ** 49 - 1,
        )
      })
      it('should read the correct value for 8 byte int min value', () => {
        readVint(
          new Uint8Array([0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
          2 ** 49,
        )
      })
      it('should read the correct value for the max representable JS number (2^53)', () => {
        readVint(
          new Uint8Array([0x01, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
          2 ** 53,
        )
      })
      it('should return value -1 for more than max representable JS number (2^53 + 1)', () => {
        readVint(
          new Uint8Array([0x01, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
          -1,
        )
      })
      it('should return value -1 for more than max representable JS number (8 byte int max value)', () => {
        readVint(
          new Uint8Array([0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
          -1,
        )
      })
      it('should throw for 9+ byte int values', () => {
        expect(
          () => {
            tools.readVint(
              new Uint8Array([
                0x00,
                0x80,
                0x00,
                0x00,
                0x00,
                0x00,
                0x00,
                0xFF,
                0xFF,
              ]),
            )
          },
          'to throw',
          /Unrepresentable length/,
        )
      })
    })
    describe('#writeVint()', () => {
      function writeVint(value, expected) {
        const actual = tools.writeVint(value)
        expect(Array.from(expected).map(b => b.toString(16).padStart(2, '0')).join(''), 'to be', Array.from(actual).map(b => b.toString(16).padStart(2, '0')).join(''))
      }

      it('should throw when writing -1', () => {
        expect(
          () => {
            tools.writeVint(-1)
          },
          'to throw',
          /Unrepresentable value/,
        )
      })
      it('should write all 1 byte integers', () => {
        forEach(range(0, 0x80 - 1), i => writeVint(i, new Uint8Array([i | 0x80])))
      })
      it('should write 2 byte int min/max values', () => {
        writeVint(2 ** 7 - 1, new Uint8Array([0x40, 0x7F]))
        writeVint(2 ** 14 - 2, new Uint8Array([0x7F, 0xFE]))
      })
      it('should write 3 byte int min/max values', () => {
        writeVint(2 ** 14 - 1, new Uint8Array([0x20, 0x3F, 0xFF]))
        writeVint(2 ** 21 - 2, new Uint8Array([0x3F, 0xFF, 0xFE]))
      })
      it('should write 4 byte int min/max values', () => {
        writeVint(2 ** 21 - 1, new Uint8Array([0x10, 0x1F, 0xFF, 0xFF]))
        writeVint(2 ** 28 - 2, new Uint8Array([0x1F, 0xFF, 0xFF, 0xFE]))
      })
      it('should write 5 byte int min/max value', () => {
        writeVint(2 ** 28 - 1, new Uint8Array([0x08, 0x0F, 0xFF, 0xFF, 0xFF]))
        writeVint(2 ** 35 - 2, new Uint8Array([0x0F, 0xFF, 0xFF, 0xFF, 0xFE]))
      })
      it('should write 6 byte int min/max value', () => {
        writeVint(
          2 ** 35 - 1,
          new Uint8Array([0x04, 0x07, 0xFF, 0xFF, 0xFF, 0xFF]),
        )
        writeVint(
          2 ** 42 - 2,
          new Uint8Array([0x07, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE]),
        )
      })
      it('should write 7 byte int min/max value', () => {
        writeVint(
          2 ** 42 - 1,
          new Uint8Array([0x02, 0x03, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
        )
        writeVint(
          2 ** 49 - 2,
          new Uint8Array([0x03, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE]),
        )
      })
      it('should write the correct value for 8 byte int min value', () => {
        writeVint(
          2 ** 49 - 1,
          new Uint8Array([0x01, 0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
        )
      })
      it('should write the correct value for the max representable JS number (2^53)', () => {
        writeVint(
          2 ** 53,
          new Uint8Array([0x01, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        )
      })
      it('should throw for more than max representable JS number (8 byte int max value)', () => {
        expect(
          () => {
            tools.writeVint(2 ** 56 + 1)
          },
          'to throw',
          /Unrepresentable value/,
        )
      })
      it('should throw for 9+ byte int values', () => {
        expect(
          () => {
            tools.writeVint(2 ** 56 + 1)
          },
          'to throw',
          /Unrepresentable value/,
        )
      })
    })
    describe('#concatenate', () => {
      it('returns the 2nd buffer if the first is invalid', () => {
        expect(
          tools.concatenate(null, new Uint8Array([0x01])),
          'to equal',
          new Uint8Array([0x01]),
        )
      })
      it('returns the 1st buffer if the second is invalid', () => {
        expect(
          tools.concatenate(new Uint8Array([0x01]), null),
          'to equal',
          new Uint8Array([0x01]),
        )
      })
      it('returns the two buffers joined if both are valid', () => {
        expect(
          tools.concatenate(new Uint8Array([0x01]), new Uint8Array([0x01])),
          'to equal',
          new Uint8Array([0x01, 0x01]),
        )
      })
    })
    describe('#readFloat', () => {
      it('can read 32-bit floats', () => {
        expect(
          tools.readFloat(new Uint8Array([0x40, 0x20, 0x00, 0x00])),
          'to equal',
          2.5,
        )
      })
      it('can read 64-bit floats', () => {
        expect(
          tools.readFloat(
            new Uint8Array([0x40, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
          ),
          'to equal',
          2.5,
        )
      })
      it('returns NaN with invalid sized arrays', () => {
        expect(tools.readFloat(new Uint8Array([0x40, 0x20, 0x00])), 'to be NaN')
      })
    })
    describe('#readUnsigned', () => {
      it('handles 8-bit integers', () => {
        expect(tools.readUnsigned(new Uint8Array([0x07])), 'to equal', 7)
      })
      it('handles 16-bit integers', () => {
        expect(tools.readUnsigned(new Uint8Array([0x07, 0x07])), 'to equal', 1799)
      })
      it('handles 32-bit integers', () => {
        expect(
          tools.readUnsigned(new Uint8Array([0x07, 0x07, 0x07, 0x07])),
          'to equal',
          117901063,
        )
      })
      it('handles integers smaller than 49 bits as numbers', () => {
        expect(
          tools.readUnsigned(new Uint8Array([0x07, 0x07, 0x07, 0x07, 0x07])),
          'to equal',
          30182672135,
        )
        expect(
          tools.readUnsigned(new Uint8Array([0x07, 0x07, 0x07, 0x07, 0x07, 0x07])),
          'to equal',
          7726764066567,
        )
      })
      it('returns integers 49 bits or larger as strings', () => {
        expect(
          tools.readUnsigned(
            new Uint8Array([0x1, 0x07, 0x07, 0x07, 0x07, 0x07, 0x07]),
          ),
          'to be a string',
        ).and('to equal', '01070707070707')
      })
    })
    describe('#readUtf8', () => {
      it('handles 8-bit strings', () => {
        expect(tools.readUtf8(new Uint8Array([0x45])), 'to be a string').and(
          'to equal',
          'E',
        )
      })
      it('handles 16-bit strings', () => {
        expect(tools.readUtf8(new Uint8Array([0x45, 0x42])), 'to be a string').and(
          'to equal',
          'EB',
        )
      })
      it('handles 24-bit strings', () => {
        expect(
          tools.readUtf8(new Uint8Array([0x45, 0x42, 0x4D])),
          'to be a string',
        ).and('to equal', 'EBM')
      })
      it('handles 32-bit strings', () => {
        expect(
          tools.readUtf8(new Uint8Array([0x45, 0x42, 0x4D, 0x4C])),
          'to be a string',
        ).and('to equal', 'EBML')
      })
      it('handles complex strings', () => {
        expect(
          tools.readUtf8(
            new Uint8Array([
              0x41,
              0x20,
              0x6E,
              0x65,
              0x77,
              0x20,
              0x64,
              0x72,
              0x61,
              0x66,
              0x74,
              0x20,
              0x6F,
              0x66,
              0x20,
              0x74,
              0x68,
              0x65,
              0x20,
              0x73,
              0x70,
              0x65,
              0x63,
              0x69,
              0x66,
              0x69,
              0x63,
              0x61,
              0x74,
              0x69,
              0x6F,
              0x6E,
              0x20,
              0x66,
              0x6F,
              0x72,
              0x20,
              0x45,
              0x42,
              0x4D,
              0x4C,
              0x2C,
              0x20,
              0x45,
              0x78,
              0x74,
              0x65,
              0x6E,
              0x73,
              0x69,
              0x62,
              0x6C,
              0x65,
              0x20,
              0x42,
              0x69,
              0x6E,
              0x61,
              0x72,
              0x79,
              0x20,
              0x4D,
              0x65,
              0x74,
              0x61,
              0x20,
              0x4C,
              0x61,
              0x6E,
              0x67,
              0x75,
              0x61,
              0x67,
              0x65,
              0x2C,
              0x20,
              0x69,
              0x73,
              0x20,
              0x72,
              0x65,
              0x61,
              0x64,
              0x79,
              0x20,
              0x66,
              0x6F,
              0x72,
              0x20,
              0x72,
              0x65,
              0x76,
              0x69,
              0x65,
              0x77,
              0x2E,
              0x20,
              0x45,
              0x42,
              0x4D,
              0x4C,
              0x20,
              0x69,
              0x73,
              0x20,
              0x61,
              0x20,
              0x62,
              0x69,
              0x6E,
              0x61,
              0x72,
              0x79,
              0x20,
              0x58,
              0x4D,
              0x4C,
              0x2D,
              0x6C,
              0x69,
              0x6B,
              0x65,
              0x20,
              0x66,
              0x6F,
              0x72,
              0x6D,
              0x61,
              0x74,
              0x20,
              0x66,
              0x6F,
              0x72,
              0x20,
              0x65,
              0x6E,
              0x63,
              0x61,
              0x70,
              0x73,
              0x75,
              0x6C,
              0x61,
              0x74,
              0x69,
              0x6E,
              0x67,
              0x20,
              0x64,
              0x61,
              0x74,
              0x61,
              0x20,
              0x61,
              0x6E,
              0x64,
              0x20,
              0x69,
              0x73,
              0x20,
              0x74,
              0x68,
              0x65,
              0x20,
              0x75,
              0x6E,
              0x64,
              0x65,
              0x72,
              0x6C,
              0x79,
              0x69,
              0x6E,
              0x67,
              0x20,
              0x66,
              0x6F,
              0x72,
              0x6D,
              0x61,
              0x74,
              0x20,
              0x6F,
              0x66,
              0x20,
              0x23,
              0x4D,
              0x61,
              0x74,
              0x72,
              0x6F,
              0x73,
              0x6B,
              0x61,
              0x20,
              0x26,
              0x20,
              0x23,
              0x77,
              0x65,
              0x62,
              0x6D,
              0x2E,
              0x20,
              0x68,
              0x74,
              0x74,
              0x70,
              0x73,
              0x3A,
              0x2F,
              0x2F,
              0x74,
              0x6F,
              0x6F,
              0x6C,
              0x73,
              0x2E,
              0x69,
              0x65,
              0x74,
              0x66,
              0x2E,
              0x6F,
              0x72,
              0x67,
              0x2F,
              0x68,
              0x74,
              0x6D,
              0x6C,
              0x2F,
              0x64,
              0x72,
              0x61,
              0x66,
              0x74,
              0x2D,
              0x69,
              0x65,
              0x74,
              0x66,
              0x2D,
              0x63,
              0x65,
              0x6C,
              0x6C,
              0x61,
              0x72,
              0x2D,
              0x65,
              0x62,
              0x6D,
              0x6C,
              0x2D,
              0x30,
              0x36,
              0x20,
              0x68,
              0x74,
              0x74,
              0x70,
              0x73,
              0x3A,
              0x2F,
              0x2F,
              0x70,
              0x69,
              0x63,
              0x2E,
              0x74,
              0x77,
              0x69,
              0x74,
              0x74,
              0x65,
              0x72,
              0x2E,
              0x63,
              0x6F,
              0x6D,
              0x2F,
              0x35,
              0x47,
              0x54,
              0x4C,
              0x41,
              0x57,
              0x64,
              0x73,
              0x65,
              0x76,
            ]),
          ),
          'to be a string',
        ).and(
          'to be',
          'A new draft of the specification for EBML, Extensible Binary Meta Language, is ready for review. EBML is a binary XML-like format for encapsulating data and is the underlying format of #Matroska & #webm. https://tools.ietf.org/html/draft-ietf-cellar-ebml-06 https://pic.twitter.com/5GTLAWdsev',
        )
      })
    })
    describe('#readSigned', () => {
      it('handles 8-bit integers', () => {
        expect(tools.readSigned(new Uint8Array([0x07])), 'to equal', 7)
      })
      it('handles 16-bit integers', () => {
        expect(tools.readSigned(new Uint8Array([0x07, 0x07])), 'to equal', 1799)
      })
      it('handles 32-bit integers', () => {
        expect(
          tools.readSigned(new Uint8Array([0x07, 0x07, 0x07, 0x07])),
          'to equal',
          117901063,
        )
      })
      it('returns NaN with invalid sized arrays', () => {
        expect(tools.readSigned(new Uint8Array([0x40, 0x20, 0x00])), 'to be NaN')
      })
    })
    describe('#readDataFromTag', () => {
      it('can read a string from a tag', () => {
        const tagData = { type: 's', name: 'DocType' }
        const buf = new Uint8Array([
          0x6D,
          0x61,
          0x74,
          0x72,
          0x6F,
          0x73,
          0x6B,
          0x61,
        ])
        expect(tools.readDataFromTag(tagData, buf), 'to satisfy', {
          type: 's',
          name: 'DocType',
          data: expect
            .it('to be a', Uint8Array)
            .and(
              'to equal',
              new Uint8Array([0x6D, 0x61, 0x74, 0x72, 0x6F, 0x73, 0x6B, 0x61]),
            ),
          value: 'matroska',
        })
      })
      it('can read an unsigned integer from a tag', () => {
        const tagData = {
          type: 'u',
          name: 'TrackType',
        }
        const buf = new Uint8Array([0x77])
        expect(tools.readDataFromTag(tagData, buf), 'to satisfy', {
          type: 'u',
          name: 'TrackType',
          data: expect
            .it('to be a', Uint8Array)
            .and('to equal', new Uint8Array([0x77])),
          value: 119,
        })
      })
      it('can read a signed integer from a tag', () => {
        const tagData = {
          type: 'i',
          name: 'TrackOffset',
        }
        const buf = new Uint8Array([0xA7])
        expect(tools.readDataFromTag(tagData, buf), 'to satisfy', {
          type: 'i',
          name: 'TrackOffset',
          data: expect
            .it('to be a', Uint8Array)
            .and('to equal', new Uint8Array([0xA7])),
          value: -89,
        })
      })
      it('can read a float from a tag', () => {
        const tagData = {
          type: 'f',
          name: 'Duration',
        }
        const buf = new Uint8Array([0x40, 0x00, 0x00, 0x77])
        expect(tools.readDataFromTag(tagData, buf), 'to satisfy', {
          type: 'f',
          name: 'Duration',
          data: expect
            .it('to be a', Uint8Array)
            .and('to equal', new Uint8Array([0x40, 0x00, 0x00, 0x77])),
          value: expect.it('to be close to', 2.00003, 1e-5),
        })
      })
    })
    describe('#readDate', () => {
      it('handles 8-bit integers', () => {
        expect(tools.readDate(new Uint8Array([0x07])), 'to equal', new Date(7))
      })
      it('handles 16-bit integers', () => {
        expect(
          tools.readDate(new Uint8Array([0x07, 0x07])),
          'to equal',
          new Date(1799),
        )
      })
      it('handles 32-bit integers', () => {
        expect(
          tools.readDate(new Uint8Array([0x07, 0x07, 0x07, 0x07])),
          'to equal',
          new Date(117901063),
        )
      })
      it('returns now with invalid sized arrays', () => {
        expect(
          tools.readDate(new Uint8Array([0x40, 0x20, 0x00])),
          'to be close to',
          new Date(0),
          2000,
        )
      })
    })
  })
})
