# Project Name

基于 Nest.js 和 React 的全栈开发项目，采用 TypeScript 开发，支持服务端渲染（SSR）。

## 技术栈

- 后端：Nest.js
- 前端：React
- 样式：SCSS
- 构建工具：Webpack
- 开发语言：TypeScript

## 项目特点

- 支持服务端渲染（SSR）
- 使用 SCSS 模块化样式管理
- TypeScript 保证代码类型安全
- 支持热更新开发
- 生产环境优化构建

## 快速开始

### 安装依赖

```bash
yarn install
```

### 开发环境

```bash
# 启动后端服务
yarn run start:dev

# 启动前端开发服务
yarn run dev
```

访问 `http://localhost:端口号` 即可看到页面

### 生产环境构建

```bash
# 方式1：用于调试
yarn run build

# 方式2：生产环境优化构建（推荐）
yarn run build:webpack
```

## 项目结构

## Description

Nest.js和emp.js都是基于Node.js的服务器端渲染(SSR)框架。下面简单描述一下两者的主要特征:

Nest.js:

- Nest.js是一个完整的Node.js框架,不仅支持SSR还支持RESTful API开发。
- 使用Typescript编写,强类型检查。
- 使用基于类和 decorator 的架构实现了模块化、面向对象的设计。
- 内置WebSocket支持,可以快速构建实时应用。
- 提供了大量的中间件机制扩展能力。
- 有完善的文档和社区支持。

EMP是一款开源的微前端解决方案,它突破了传统微前端的限制,为前端微服务提供了全新的架构和实现模式。

- 模块化:每个应用独立开发、运行和部署;
- 轻量级:每个应用只关心自身业务无需承载整体职责;
- 解耦:应用间完全解耦只通过消息进行沟通;
- 聚合:主应用提供整体布局承载和路由;
- 扩展性:支持任意第三方消息总线;
- 生态丰富:提供大量应用基础设施支持;

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development 访问node服务地址即可看到页面
$ yarn run proto
$ yarn run start:dev
$ yarn run dev

# production
$ yarn run prod  // 可以用于调试
or
$ yarn run build:webpack // 可以正常运行，体积小。
$ yarn run emp:build


```

### Actions

- Any PR open → `CI:Build test`
- New tag `v*` → `CI:Create release`
- Release created → `CI:Deploy` → `CI:Execute server deploy script`

### Changelog

Detailed changes for each release are documented in the [release notes](/CHANGELOG.md).

### License

Licensed under the [MIT](/LICENSE) License.
