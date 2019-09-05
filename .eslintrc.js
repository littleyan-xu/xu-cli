module.exports = {
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    // 指定 js 的解析器
     parser: 'babel-eslint',
    // js 的类型
    sourceType: 'module',
    // ECMAScript 版本
    ecmaVersion: 2018
  },
  "parser": "babel-eslint",
  "rules": {
  }
}
