// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.2.3
//   protoc               v5.28.2
// source: common/pagination.proto

/* eslint-disable */

export const protobufPackage = "";

export interface Pagination {
  /** 文档总数 */
  totalDocs: number;
  /** 每页限制 */
  limit: number;
  /** 总页数 */
  totalPages: number;
  /** 当前页 */
  page: number;
  /** 分页计数器 */
  pagingCounter: number;
  /** 是否有上一页 */
  hasPrevPage: boolean;
  /** 是否有下一页 */
  hasNextPage: boolean;
  /** 上一页编号 */
  prevPage: number;
  /** 下一页编号 */
  nextPage: number;
  nextCursor: string;
}
