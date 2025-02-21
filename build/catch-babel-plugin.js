module.exports = function ({ types: t }) {
  return {
    visitor: {
      // 处理 try-catch 块
      TryStatement(path) {
        const { handler } = path.node
        if (!handler) return

        const oldBody = handler.body.body
        const errorHandler = t.functionExpression(
          null,
          [handler.param],
          t.blockStatement([
            t.expressionStatement(
              t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('reject')), [handler.param]),
            ),
            ...oldBody,
          ]),
        )

        path.node.handler.body = errorHandler.body
      },

      // 处理 promise-catch 块
      CallExpression(path) {
        const { node } = path
        const { callee } = node

        if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.property, { name: 'catch' })) {
          return
        }

        const fnPath = path.get('arguments')[0]
        const hasErrorParam = fnPath.node.params.length > 0
        const errorParam = hasErrorParam ? fnPath.node.params[0] : path.scope.generateUidIdentifier('error')

        if (!hasErrorParam) {
          fnPath.node.params.push(errorParam)
        }

        fnPath
          .get('body')
          .pushContainer(
            'body',
            t.expressionStatement(
              t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('reject')), [errorParam]),
            ),
          )
      },
    },
  }
}
