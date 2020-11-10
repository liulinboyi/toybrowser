// 完成一部分状态
const EOF = Symbol('EOF'); // end of file

let currentToken = null

function emit(token) {
    console.log(token)
    // if (token.type !== 'text') {
    //     console.log(token)
    // }
}

function data(c) { // 第一个状态
    if (c === '<') {
        return tagOpen
    } else if (c === EOF) {
        emit({
            type: 'EOF'
        })
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
    } else if (c.match(/^[a-zA-Z]$/)) {
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
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    } else if (c === '/') {
        return selfClosingStartTag
    } else if (c.match(/^[a-zA-Z]$/)) {
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
    } else if (c === '>') {
        return data
    } else if (c === '=') {
        return beforeAttributeName
    } else {
        return beforeAttributeName
    }
}

function selfClosingStartTag() {
    if (c === '>') {
        currentToken.isSelfClosing = true
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
}
module.exports.parseHtml = parseHtml
