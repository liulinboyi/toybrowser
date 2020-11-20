// const EOF = Symbol('EOF')
let length = 0
let content = []
let isFinished = false
// let current = WAITING_LENGTH
let state = WAITING_LENGTH


/**
 * 所占字节数
 *
 * UTF-8 一种可变长度的Unicode编码格式，使用一至四个字节为每个字符编码（Unicode在范围 D800-DFFF 中不存在任何字符）
 * 000000 - 00007F(128个代码)      0zzzzzzz(00-7F)                             一个字节
 * 000080 - 0007FF(1920个代码)     110yyyyy(C0-DF) 10zzzzzz(80-BF)             两个字节
 * 000800 - 00D7FF
 * 00E000 - 00FFFF(61440个代码)    1110xxxx(E0-EF) 10yyyyyy 10zzzzzz           三个字节
 * 010000 - 10FFFF(1048576个代码)  11110www(F0-F7) 10xxxxxx 10yyyyyy 10zzzzzz  四个字节
 * {@link https://zh.wikipedia.org/wiki/UTF-8}
 *
 * UTF-16 编码65535以内使用两个字节编码，超出65535的使用四个字节（JS内部，字符储存格式是：UCS-2——UTF-16的子级）
 * 000000 - 00FFFF  两个字节
 * 010000 - 10FFFF  四个字节
 * {@link https://zh.wikipedia.org/wiki/UTF-16}
 *
 * GBK(ASCII的中文扩展) 除了0~126编号是1个字节之外，其他都2个字节（超过65535会由2个字显示）
 * {@link https://zh.wikipedia.org/wiki/汉字内码扩展规范}
 *
 * @param  {String} str
 * @param  {String} [charset= 'gbk'] utf-8, utf-16
 * @return {Number}
 */
function sizeofByte(str, charset = 'utf-8') {
    let total = 0
    let charCode

    charset = charset.toLowerCase()

    if (charset === 'utf-8' || charset === 'utf8') {
        for (let i = 0, len = str.length; i < len; i++) {
            charCode = str.codePointAt(i)

            if (charCode <= 0x007f) {
                total += 1
            } else if (charCode <= 0x07ff) {
                total += 2
            } else if (charCode <= 0xffff) {
                total += 3
            } else {
                total += 4
                i++
            }
        }
    } else if (charset === 'utf-16' || charset === 'utf16') {
        for (let i = 0, len = str.length; i < len; i++) {
            charCode = str.codePointAt(i)

            if (charCode <= 0xffff) {
                total += 2
            } else {
                total += 4
                i++
            }
        }
    } else {
        total = str.replace(/[^\x00-\xff]/g, 'aa').length
    }

    return total
}

function WAITING_LENGTH(c) {
    if (c === '\r') {
        /* 
        遇到 \r
        241 -> 这里隐藏\r\n 进入chunked部分，此时current为WAITING_LENGTH，遇到\r改变状态为WAITING_LENGTH_LINE_END
        <html lang="en">
        <head>
        ...
        */
        if (length === 0) {
            isFinished = true
        }
        return WAITING_LENGTH_LINE_END
    } else {
        /* 
        没有遇到 \r
        241 -> 这里隐藏\r\n 进入chunked部分，此时current为WAITING_LENGTH，没有遇到\r表示在处理数字部分，此部分为16进制,需要特殊处理
        <html lang="en">
        <head>
        ...
        */
        length *= 16 // length = length * 16 // 如果是十进制则为this.length = length * 10
        length += parseInt(c, 16) // 转换为10进制
        // console.log(length, ' length')
        return WAITING_LENGTH
        // 241 => (2 * 16 + 4) * 16 + 1
    }
}

function WAITING_LENGTH_LINE_END(c) {
    if (c === '\n') {
        return READING_TRUNK
    } else {
        return WAITING_LENGTH_LINE_END
    }
}

function READING_TRUNK(c) {
    if (length === 0) {
        return WAITING_NEW_LINE
    } else {
        content.push(c)
        let count = sizeofByte(c)
        // console.log(count, 'count')
        length = length - count
        // console.log(this.length, '剩余长度')
        return READING_TRUNK
    }
}

function WAITING_NEW_LINE(c) {
    if (c === '\r') {
        return WAITING_NEW_LINE_END
    } else {
        return WAITING_NEW_LINE
    }
}

function WAITING_NEW_LINE_END(c) {
    if (c === '\n') {
        return WAITING_LENGTH
    } else {
        return WAITING_NEW_LINE_END
    }
}

function TrunkedBodyParser(c) {
    // console.log(c, ' c')
    state = state(c)
    // for (let c of body) {
    //     state = state(c)
    // }
    // state = state(EOF)
    let output = {
        content,
        isFinished
    }
    // console.log(output, 'output')
    return output
}

module.exports = TrunkedBodyParser

