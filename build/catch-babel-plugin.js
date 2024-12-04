module.exports = function ({ types: t }) {
  return {
    visitor: {
      // 处理 try-catch 块
      TryStatement(path) {
        const { block, handler } = path.node
        if (handler) {
          const oldBody = handler.body.body
          const errorHandler = t.functionExpression(
            null,
            [handler.param],
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('reject')), [
                  handler.param,
                ]),
              ),
              ...oldBody,
            ]),
          )

          path.node.handler.body = errorHandler.body
        }
      },
      // 处理 promise-catch 块
      CallExpression(path) {
        // if (
        //     t.isMemberExpression(path.node.callee) &&
        //     t.isIdentifier(path.node.callee.property, {
        //         name: 'catch',
        //     })
        // ) {
        //     const fnPath = path.get('arguments')[0];

        //     fnPath.get('body').pushContainer('body', t.expressionStatement(
        //         t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('reject')), [
        //             fnPath.node.params[0],
        //         ]),
        //     ));
        // }
        if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.property, {
            name: 'catch',
          })
        ) {
          const fnPath = path.get('arguments')[0]

          const hasErrorParam = fnPath.node.params.length > 0

          const errorIdentifier = path.scope.generateUidIdentifier('error')

          fnPath
            .get('body')
            .pushContainer(
              'body',
              t.expressionStatement(
                t.callExpression(t.memberExpression(t.identifier('Promise'), t.identifier('reject')), [
                  hasErrorParam ? fnPath.node.params[0] : errorIdentifier,
                ]),
              ),
            )
          if (!hasErrorParam) {
            fnPath.node.params.push(errorIdentifier)
          }
        }
      },
    },
  }
}
