<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
  
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

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
$ yarn run start:dev
$ yarn run dev


# production
$ yarn run build  // 可以用于调试
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
