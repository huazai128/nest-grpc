// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               v5.27.1
// source: common/chart_item.proto

/* eslint-disable */

export const protobufPackage = "";

export interface ChartItem {
  count: string;
  /** 开始时间 如果是使用Timestamp，将 Date 对象转换为 Timestamp 对象才能传输，为了减少不必要的操作，使用string。 */
  startTime: string;
  /** 总数量 */
  totalCount: string;
}
