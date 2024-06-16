import session from 'express-session'

export const environment = process.env.NODE_ENV
// 运行环境
export const isDevEnv = Object.is(environment, 'dev')
export const isProdEnv = Object.is(environment, 'prod')
export const isTestEnv = Object.is(environment, 'test')

export const APP = {
  PORT: 5001,
  DEFAULT_CACHE_TTL: 60 * 60 * 24,
}

export const CROSS_DOMAIN = {
  // 可以做redis 缓存
  // 允许访问的域名
  allowedOrigins: [''],
  allowedReferer: '',
}

// export const REDIS = {
//   host: config.redisConf.host,
//   port: config.redisConf.port,
//   username: config.redisConf.username,
//   password: config.redisConf.password,
// }

export const COOKIE_KEY = '@get-cookie-1212-dffas'

// session 配置
export const SESSION: session.SessionOptions = {
  secret: 'sup3rs3cr3t',
  name: 'sid',
  saveUninitialized: false,
  resave: false,
  cookie: {
    sameSite: true,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 设置session 过期时间
  },
  rolling: true,
}

export const AUTH = {
  jwtTokenSecret: '',
  expiresIn: 3600 * 24 * 7, // TOKEN过期时间， 目前还没有处理实时更新token
}
