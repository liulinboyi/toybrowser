const TrunkedBodyParser = require('./TrunkedBodyParser.js')

let statusLine = ""; // 把statusLine 存起来
let headers = {}
let headerName = "";
let headerValue = "";
let bodyParser = null;
let bodyParserOutput = {}

const EOF = Symbol('EOF'); // end of file


// function start(c) {
//     if (c === '\r') {
//         return WAITING_STATUS_LINE_END
//     } else {
//         statusLine += c
//     }
// }


function WAITING_STATUS_LINE(c) {
    if (c === '\r') {
        return WAITING_STATUS_LINE_END; // status_line 结束 改变状态
    } else {
        statusLine += c // 收集拼接字符串
        return WAITING_STATUS_LINE
    }
}

function WAITING_STATUS_LINE_END(c) {
    if (c === '\n') {
        return WAITING_HEADER_NAME
    }
}

function WAITING_HEADER_NAME(c) {
    if (c === ':') {
        return WAITING_HEADER_SPACE; // 冒号后面空格
    } else if (c === "\r") { // 如果headername 第一个字符遇到了\r，此时没有header部分
        if (headers['Transfer-Encoding'] === 'chunked' || headers['transfer-encoding'] === 'chunked') {
            // console.log("Transfer-Encoding => chunked")
            // bodyParser = new TrunkedBodyParser
            bodyParser = TrunkedBodyParser
        }
        return WAITING_HEADER_BLOCK_END // 吃掉一个回车\n
    } else {
        headerName += c // 收集拼接字符串
        return WAITING_HEADER_NAME
    }
}

function WAITING_HEADER_VALUE(c) {
    if (c === '\r') {
        headers[headerName] = headerValue;
        return WAITING_HEADER_LINE_END; // 
    } else {
        headerValue += c // 收集拼接字符串
        return WAITING_HEADER_VALUE
    }
}

function WAITING_HEADER_SPACE(c) {
    if (c === ' ') {
        return WAITING_HEADER_VALUE;
    }
}

function WAITING_HEADER_LINE_END(c) {
    if (c === '\n') {
        headerName = ''; // 这一行header结束，要置空headerName
        headerValue = ''; // 这一行header结束，要置空headerValue
        return WAITING_HEADER_NAME;
    }
}

function WAITING_HEADER_BLOCK_END(c) {
    if (c === '\n') {
        return WAITING_BODY
    }
}

function WAITING_BODY(c) {
    // console.log(c, ' c')
    // bodyParser.receiveChar(c)
    bodyParserOutput = bodyParser(c)
    if (c === EOF) {
    }
    return WAITING_BODY
}

function ResponseParser(response) {
    let state = WAITING_STATUS_LINE;
    for (let c of response) {
        state = state(c)
    }
    // state = state(EOF)
    return {
        get isFinished() {
            // console.log(bodyParserOutput, bodyParserOutput.isFinished, 'bodyParserOutput.isFinished')
            return bodyParserOutput && bodyParserOutput.isFinished
        },
        get response() {
            statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/)
            return {
                statusCode: RegExp.$1,
                statusText: RegExp.$2,
                headers: headers,
                body: bodyParserOutput.content.join('')
            }
        }
    }
}

module.exports = ResponseParser
