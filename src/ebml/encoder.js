import { Transform } from 'node:stream'
import schema from './schema'
import tools from './tools'

function encodeTag(tagId, tagData, end) {
  const data = [new Uint8Array(Array.from(tagId.toString(16), 'hex').match(/.{1,2}/g).map(byte => Number.parseInt(byte, 16)))]
  if (end === -1) {
    data.push(new Uint8Array([0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]))
  }
  else {
    data.push(tools.writeVint(tagData.length))
  }

  // cast ArrayBuffer to Uint8Array
  if (!(tagData instanceof Uint8Array)) {
    tagData = new Uint8Array(tagData)
  }
  data.push(tagData)
  return tools.concatenate(...data)
}

/**
 * Encodes a raw EBML stream
 * @class EbmlEncoder
 * @extends Transform
 */
export default class EbmlEncoder extends Transform {
  constructor(options = {}) {
    super({ ...options, writableObjectMode: true })
    /**
     * @type {Uint8Array}
     * @property {Uint8Array} mBuffer The buffer containing the encoded EBML data
     * @private
     */
    this.mBuffer = null

    /**
     * @private
     * @property {boolean} mCorked Whether the stream is corked
     * @type {boolean}
     */
    this.mCorked = false

    /**
     * @private
     * @property {Array<Tag>} mStack The stack of tags to be encoded
     * @type {Array<Tag>}
     */
    this.mStack = []
  }

  get buffer() {
    return this.mBuffer
  }

  get corked() {
    return this.mCorked
  }

  get stack() {
    return this.mStack
  }

  set buffer(buffer) {
    this.mBuffer = buffer
  }

  set corked(corked) {
    this.mCorked = corked
  }

  set stack(stak) {
    this.mStack = stak
  }

  /**
   *
   * @param {[string, Tag]} chunk array of chunk data, starting with the tag
   * @param {string} enc the encoding type (not used)
   * @param {Function} done a callback method to call after the transformation
   */
  _transform(chunk, enc, done) {
    const [tag, { data, name, ...rest }] = chunk

    switch (tag) {
      case 'start':
        this.startTag(name, { ...rest })
        break
      case 'tag':
        this.writeTag(name, data)
        break
      case 'end':
        this.endTag()
        break
      default:
        break
    }

    return done()
  }

  /**
   * @private
   * @param {Function} done callback function
   */
  flush(done = () => {}) {
    if (!this.buffer || this.corked) {
      return done()
    }

    if (this.buffer.byteLength === 0) {
      return done()
    }

    const chunk = new Uint8Array(this.buffer)
    this.buffer = null
    this.push(chunk)
    return done()
  }

  /**
   * @private
   * @param {Uint8Array | Uint8Array[]} buffer
   */
  bufferAndFlush(buffer) {
    this.buffer = tools.concatenate(this.buffer, buffer)
    this.flush()
  }

  _flush(done = () => {}) {
    this.flush(done)
  }

  _bufferAndFlush(buffer) {
    this.bufferAndFlush(buffer)
  }

  /**
   * gets the ID of the type of tagName
   * @static
   * @param  {string} tagName to be looked up
   * @return {number}         A buffer containing the schema information
   */
  static getSchemaInfo(tagName) {
    const tagId = Array.from(schema.keys()).find(
      str => schema.get(str).name === tagName,
    )
    if (tagId) {
      return tagId
    }

    return null
  }

  cork() {
    this.corked = true
  }

  uncork() {
    this.corked = false
    this.flush()
  }

  writeTag(tagName, tagData) {
    const tagId = EbmlEncoder.getSchemaInfo(tagName)
    if (!tagId) {
      throw new Error(`No schema entry found for ${tagName}`)
    }
    if (tagData) {
      const data = encodeTag(tagId, tagData)
      if (this.stack.length > 0) {
        this.stack[this.stack.length - 1].children.push({ data })
      }
      else {
        this.bufferAndFlush(data)
      }
    }
  }

  /**
   *
   * @param {string} tagName The name of the tag to start
   * @param {{end: number}} info an information object with a `end` parameter
   */
  startTag(tagName, { end }) {
    const tagId = EbmlEncoder.getSchemaInfo(tagName)
    if (!tagId) {
      throw new Error(`No schema entry found for ${tagName}`)
    }

    const tag = {
      data: null,
      id: tagId,
      name: tagName,
      end,
      children: [],
    }

    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1].children.push(tag)
    }
    this.stack.push(tag)
  }

  endTag() {
    const tag = this.stack.pop() || {
      children: [],
      data: { buffer: new Uint8Array([]) },
    }
    const childTagDataBuffers = tag.children.map(child => child.data)
    tag.data = encodeTag(tag.id, tools.concatenate(...childTagDataBuffers), tag.end)
    if (this.stack.length < 1) {
      this.bufferAndFlush(tag.data)
    }
  }
}
