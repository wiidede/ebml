import schema from './schema'
import tools from './tools'

const STATE_TAG = 1
const STATE_SIZE = 2
const STATE_CONTENT = 3

export default class EbmlDecoder {
  /**
   * @constructor
   */
  constructor() {
    /**
     * @property {Uint8Array} mBuffer The buffer containing the decoded EBML data
     * @private
     * @type {Uint8Array}
     */
    this.mBuffer = null

    /**
     * @private
     * @property {Array} mTagStack The stack of tags
     * @readonly
     */
    this.mTagStack = []

    /**
     * @property {number} mState The current state of the decoder
     * @private
     * @type {number}
     */
    this.mState = STATE_TAG

    /**
     * @property {number} mCursor The current cursor position in the buffer
     * @private
     * @type {number}
     */
    this.mCursor = 0

    /**
     * @property {number} mTotal The total length of the decoded EBML data
     * @private
     * @type {number}
     */
    this.mTotal = 0

    /**
     * @private
     * @property {Function} mController The TransformStream controller
     */
    this.mController = null

    /**
     * @private
     * @property {WritableStreamDefaultWriter} mWriter The stream writer
     */
    this.mWriter = null

    /**
     * @private
     * @property {boolean} mStreamEnded Whether the stream has been ended
     */
    this.mStreamEnded = false

    // Create the actual TransformStream
    this.stream = new TransformStream({
      start: (controller) => {
        this.mController = controller
      },
      transform: (chunk) => {
        this._transform(chunk)
      },
      flush: () => {
        this._flush()
      },
    })

    // Get the writer once at initialization
    this.mWriter = this.stream.writable.getWriter()
  }

  get buffer() {
    return this.mBuffer
  }

  get cursor() {
    return this.mCursor
  }

  get state() {
    return this.mState
  }

  get tagStack() {
    return this.mTagStack
  }

  get total() {
    return this.mTotal
  }

  set buffer(buffer) {
    this.mBuffer = buffer
  }

  /**
   * @param {number} cursor
   */
  set cursor(cursor) {
    this.mCursor = cursor
  }

  set state(state) {
    this.mState = state
  }

  set total(total) {
    this.mTotal = total
  }

  /**
   * Push data to the stream controller
   * @param {any} data The data to push
   */
  push(data) {
    if (this.mController) {
      this.mController.enqueue(data)
    }
  }

  /**
   * Pipe method to maintain compatibility with Node.js Stream API
   * @param {WritableStream} destination The destination stream
   * @returns {ReadableStream} The readable part of the transform stream
   */
  pipe(destination) {
    // If destination is a Node.js stream with a writable property
    if (destination && typeof destination.write === 'function') {
      // Create a reader from our readable stream
      const reader = this.stream.readable.getReader()

      // Read function that will be called recursively
      const read = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            // Call end if the destination supports it (Node.js stream)
            if (typeof destination.end === 'function') {
              destination.end()
            }
            return
          }

          // Write to the destination
          destination.write(value)

          // Continue reading
          read()
        }).catch((err) => {
          // If destination has an error method (Node.js stream)
          if (typeof destination.emit === 'function') {
            destination.emit('error', err)
          }
        })
      }

      // Start reading
      read()
    }
    else {
      // For Web Streams, just return the readable part so it can be piped again
      this.stream.readable.pipeTo(destination).catch((err) => {
        console.error('Error piping stream:', err)
      })
    }

    return destination
  }

  /**
   * Write data to the stream
   * @param {Uint8Array|Buffer} chunk The data to write
   */
  write(chunk) {
    if (this.mStreamEnded) {
      throw new Error('Cannot write after end')
    }

    // Process the chunk directly to avoid stream locking issues
    this._transform(chunk)
  }

  /**
   * End the stream
   */
  end() {
    if (this.mStreamEnded) {
      return
    }

    // Make sure any pending data is flushed
    this._flush()

    this.mStreamEnded = true

    // Only close the writer once at the end
    this.mWriter.close().catch((err) => {
      console.error('Error closing stream:', err)
    })
  }

  /**
   * Transform method that processes chunks of data
   * @private
   * @param {Uint8Array|Buffer} chunk The chunk to process
   */
  _transform(chunk) {
    if (!this.buffer) {
      this.buffer = new Uint8Array(chunk)
    }
    else {
      this.buffer = tools.concatenate(this.buffer, new Uint8Array(chunk))
    }

    while (this.cursor < this.buffer.length) {
      if (this.state === STATE_TAG && !this.readTag()) {
        break
      }
      if (this.state === STATE_SIZE && !this.readSize()) {
        break
      }
      if (this.state === STATE_CONTENT && !this.readContent()) {
        break
      }
    }
  }

  /**
   * Flush any remaining data
   * @private
   */
  _flush() {
    // Nothing to do here for now
  }

  static getSchemaInfo(tag) {
    if (Number.isInteger(tag) && schema.has(tag)) {
      return schema.get(tag)
    }
    return {
      type: null,
      name: 'unknown',
      description: '',
      level: -1,
      minver: -1,
      multiple: false,
      webm: false,
    }
  }

  readTag() {
    if (this.cursor >= this.buffer.length) {
      return false
    }

    const start = this.total
    const tag = tools.readVint(this.buffer, this.cursor)

    if (tag == null) {
      return false
    }

    const tagStr = tools.readHexString(
      this.buffer,
      this.cursor,
      this.cursor + tag.length,
    )
    const tagNum = Number.parseInt(tagStr, 16)
    this.cursor += tag.length
    this.total += tag.length
    this.state = STATE_SIZE

    const tagObj = {
      tag: tag.value,
      tagStr,
      type: EbmlDecoder.getSchemaInfo(tagNum).type,
      name: EbmlDecoder.getSchemaInfo(tagNum).name,
      start,
      end: start + tag.length,
    }

    this.tagStack.push(tagObj)
    return true
  }

  readSize() {
    const tagObj = this.tagStack[this.tagStack.length - 1]

    if (this.cursor >= this.buffer.length) {
      return false
    }

    const size = tools.readVint(this.buffer, this.cursor)

    if (size == null) {
      return false
    }

    this.cursor += size.length
    this.total += size.length
    this.state = STATE_CONTENT
    tagObj.dataSize = size.value

    // unknown size
    if (size.value === -1) {
      tagObj.end = -1
    }
    else {
      tagObj.end += size.value + size.length
    }

    return true
  }

  readContent() {
    const { tagStr, type, dataSize, ...rest } = this.tagStack[
      this.tagStack.length - 1
    ]

    if (type === 'm') {
      this.push(['start', { tagStr, type, dataSize, ...rest }])
      this.state = STATE_TAG

      return true
    }

    if (this.buffer.length < this.cursor + dataSize) {
      return false
    }

    const data = this.buffer.subarray(this.cursor, this.cursor + dataSize)
    this.total += dataSize
    this.state = STATE_TAG
    this.buffer = this.buffer.subarray(this.cursor + dataSize)
    this.cursor = 0

    this.tagStack.pop() // remove the object from the stack

    this.push([
      'tag',
      tools.readDataFromTag(
        { tagStr, type, dataSize, ...rest },
        new Uint8Array(data),
      ),
    ])

    while (this.tagStack.length > 0) {
      const topEle = this.tagStack[this.tagStack.length - 1]
      if (this.total < topEle.end) {
        break
      }
      this.push(['end', topEle])
      this.tagStack.pop()
    }

    return true
  }
}
