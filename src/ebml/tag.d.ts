import type { EBMLSchema } from './schema'

export declare interface TagMeta {
  data: Uint8Array
  dataSize: number
  discardable: boolean
  end: number
  id: number
  keyframe: boolean
  payload: Uint8Array
  start: number
  tagStr: string
  track: number
  value: number | string
}

export declare type Tag = EBMLSchema & TagMeta

export declare interface TagStackItem extends Tag {
  children: TagStackItem[]
}

export declare type TagStack = TagStackItem[]
