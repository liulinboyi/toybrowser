const css = require('css')
let rules = []

function addCssRoules(text) {
    var ast = css.parse(text)
    // console.log(JSON.stringify(ast, null, '     '));
    rules.push(...ast.stylesheet.rules)
    return rules
}

module.exports = addCssRoules
