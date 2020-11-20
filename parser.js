const fs = require('fs')
const stringify = require('./util.js')
const addCssRoules = require('./css.js')
const computeCss = require('./computeCss.js')
const layout = require('./layout.js')

// 完成一部分状态
const EOF = Symbol('EOF'); // end of file

let currentToken = null
let currentAttribute = null
let currentTextNode = null
let rules = []

let stack = [{ type: 'document', children: [] }]

// 从标签构建DOM树的基本技巧是使用栈
// 开始标签入栈 结束标签出栈
// 自封闭节点视为 入栈后立即出栈
// 任何元素的父元素是它入栈前的栈顶

function emit(token) {
    // console.log(token)
    // if (token.type !== 'text') {
    //     console.log(token)
    // }
    // 栈顶
    let top = stack[stack.length - 1]
    if (token.type === 'startTag') {
        let element = {
            type: 'element',
            children: [],
            attributes: []
        }
        element.tagName = token.tagName
        for (let p in token) {
            // 属性
            if (p !== 'type' && p !== 'tagName') {
                element.attributes.push({
                    name: p,
                    value: token[p]
                })
            }
        }
        // 有一个元素创建的过程就存在csscomputing
        // 创建元素后，立即计算CSS
        // 当分析一个元素时，所有CSS规则已经收集完毕
        // 这里CSS规则只允许在head中
        // 真是浏览器中，可能遇到写在body的style的标签，需要重新计算，这里忽略

        let elements = stack.slice().reverse()
        // 先收集CSS规则，再进行DOM计算
        computeCss(elements, rules, element)
        // 添加子元素
        top.children.push(element)
        // * 当前元素的父元素为栈顶
        // 加上这句话 会造成循环引用
        // element.parent = top

        // 不是自闭合标签
        if (!token.isSelfClosing) {
            stack.push(element)
        }

        currentTextNode = null
    } else if (token.type === 'endTag') {
        if (top.tagName !== token.tagName) {
            throw new Error("Tag start end doesn't match!")
        } else {
            if (top.tagName === 'style') {
                rules = addCssRoules(top.children[0].content)
                // console.log(rules, 'rules')
            }
            // endTag 部分进行laylou 排版
            stack.pop()
        }
        layout(top)
        currentTextNode = null
    } else if (token.type === 'text') {
        if (currentTextNode === null) {
            currentTextNode = {
                type: 'text',
                content: ''
            }
            top.children.push(currentTextNode)
        }
        currentTextNode.content += token.content
    }
}

function data(c) { // 第一个状态
    if (c === '<') {
        return tagOpen
    } else if (c === EOF) {
        emit({
            type: 'EOF'
        })
        // console.log(stack)
        return
    } else {
        emit({
            type: 'text',
            content: c
        })
        return data
    }
}

function tagOpen(c) {
    if (c === '/') {
        return endTagOpen
    } else if (c.match(/^[a-zA-Z]$/)) { // 标签名
        currentToken = {
            type: 'startTag',
            tagName: ''
        }
        return tagName(c) // reconsume
    } else {
        return
    }
}


function endTagOpen(c) {
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: 'endTag',
            tagName: ''
        }
        return tagName(c)
    } else if (c === '>') {

    } else if (c === EOF) {

    } else {

    }
}

function tagName(c) {
    // 标签名
    if (c.match(/^[\t\n\f ]$/)) { // 空格
        return beforeAttributeName
    } else if (c === '/') {
        // console.log('tagName selfClosingStartTag')
        return selfClosingStartTag
    } else if (c.match(/^[a-zA-Z]$/)) { // 字母
        currentToken.tagName += c
        return tagName
    } else if (c === '>') {
        emit(currentToken)
        return data
    } else {
        return tagName
    }
}

function beforeAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    } else if (c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c)
    }
    //  else if (c === '/') {
    //     // console.log('tagName selfClosingStartTag')
    //     return selfClosingStartTag
    // }
    else if (c === '>') {
        return data
    } else if (c === '=') {
        // return beforeAttributeName
    } else {
        // return beforeAttributeName
        currentAttribute = {
            name: '',
            value: ''
        }
        return attributeName(c) // reconsume 同样的字符被消费了两次
    }
}

function attributeName(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c)
    } else if (c === '=') {
        return beforeAttributeValue
    } else if (c === '\u0000') {

    } else if (c === '\"' || c === "'" || c === '<') {

    } else {
        currentAttribute.name += c;
        return attributeName
    }
}

function afterAttributeName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return afterAttributeName
    } else if (c == '/') {
        return selfClosingStartTag
    } else if (c == '=') {
        return beforeAttributeValue
    } else if (c == '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    } else if (c == EOF) {
    } else {
        currentToken[currentAttribute.name] = currentAttribute.value
        currentAttribute = {
            name: '',
            value: '',
        }
    }
    return attributeName(c)
}

function doubleQuotedAttributeValue(c) {
    if (c === '"') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    } else if (c === '\u0000') {
    } else if (c === EOF) {
    } else {
        currentAttribute.value += c
        return doubleQuotedAttributeValue
    }
}

function singleQuotedAttributeValue(c) {
    if (c === "'") {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    } else if (c === '\u0000') {
    } else if (c === EOF) {
    } else {
        currentAttribute.value += c
        return doubleQuotedAttributeValue
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    } else if (c === '/') {
        return selfClosingStartTag
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    } else if (c === EOF) {
    } else {
        currentAttribute.value += c
        return doubleQuotedAttributeValue
    }
}

function unQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value
        return beforeAttributeName
    } else if (c === '/') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return selfClosingStartTag
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    } else if (c === '\u0000') {

    } else if (c === '\"' || c === '\'' || c === '=' || c === '`' || c === '<') {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return unQuotedAttributeValue
    }
}

function beforeAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
        return beforeAttributeValue
    } else if (c === '\"') {
        return doubleQuotedAttributeValue
    } else if (c === '\'') {
        return singleQuotedAttributeValue
    } else if (c === '>') {

    } else {
        return unQuotedAttributeValue(c)
    }
}

function selfClosingStartTag(c) {
    if (c === '>') {
        currentToken.isSelfClosing = true
        // console.log(currentToken, 'selfClosingStartTag currentToken')
        emit(currentToken)
        delete currentToken.isSelfClosing
        return data
    } else if (c === EOF) {

    } else {

    }
}



function parseHtml(html) {
    let state = data;
    for (let c of html) {
        state = state(c)
    }
    state = state(EOF)
    // console.log(stack[0])
    fs.writeFileSync('./html.json', stringify(stack[0]))
    return stack[0]
}
module.exports.parseHtml = parseHtml
