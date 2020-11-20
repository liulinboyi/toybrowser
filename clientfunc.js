const fs = require('fs');
const net = require('net');
const parser = require('./parser.js')
const render = require('./render.js')
const images = require('images')

const ResponseParser = require('./ResponseParser')


/**
 * 
解析如下字符串

241
<html lang="en">
<head>
    <style>
        #container {
            width: 500px;
            height: 300px;
            display: flex;
            background-color: rgb(255, 255, 255);
        }

        #container #myid {
            width: 200px;
            height: 100px;
            background-color: rgb(255, 0, 0);
        }

        #container .c1 {
            flex: 1;
            background-color: rgb(0, 255, 0);
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="myid"></div>
        <div class="c1"></div>
    </div>
</body>
</html>
0


 */

class TrunkedBodyParser {
    constructor() {
        this.WAITING_LENGTH = 0
        this.WAITING_LENGTH_LINE_END = 1
        this.READING_TRUNK = 2
        this.WAITING_NEW_LINE = 3
        this.WAITING_NEW_LINE_END = 4

        this.length = 0
        this.content = []
        this.isFinished = false
        this.current = this.WAITING_LENGTH
    }

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
    sizeofByte(str, charset = 'utf-8') {
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

    receiveChar(char) {
        if (this.current === this.WAITING_LENGTH) {// 进入chununked部分
            if (char === '\r') {
                /* 
                遇到 \r
                241 -> 这里隐藏\r\n 进入chunked部分，此时current为WAITING_LENGTH，遇到\r改变状态为WAITING_LENGTH_LINE_END
                <html lang="en">
                <head>
                ...
                */
                if (this.length === 0) {
                    this.isFinished = true
                }
                this.current = this.WAITING_LENGTH_LINE_END
            } else {
                /* 
                没有遇到 \r
                241 -> 这里隐藏\r\n 进入chunked部分，此时current为WAITING_LENGTH，没有遇到\r表示在处理数字部分，此部分为16进制,需要特殊处理
                <html lang="en">
                <head>
                ...
                */
                this.length *= 16 // this.length = this.length * 16 // 如果是十进制则为this.length = this.length * 10
                this.length += parseInt(char, 16) // 转换为10进制
                // 241 => (2 * 16 + 4) * 16 + 1
                // console.log(this.length)
            }
        } else if (this.current === this.WAITING_LENGTH_LINE_END) {
            if (char === '\n') {
                this.current = this.READING_TRUNK
            }
        } else if (this.current === this.READING_TRUNK) {
            if (this.length === 0) {
                this.current = this.WAITING_NEW_LINE
            } else {
                this.content.push(char)
                let count = this.sizeofByte(char)
                // console.log(count, 'count')
                this.length = this.length - count
                // console.log(this.length, '剩余长度')
            }

        } else if (this.current === this.WAITING_NEW_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_NEW_LINE_END
            }
        } else if (this.current === this.WAITING_NEW_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_LENGTH
            }
        }
    }
}




class Request {
    constructor(options) {
        this.methods = options.methods || 'GET';
        this.host = options.host;
        this.port = options.port || 80;
        this.path = options.path || '/';
        this.headers = options.headers || {};
        this.body = options.body || {};

        if (!this.headers["Content-Type"]) {
            this.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        if (this.headers["Content-Type"] === "application/json") {
            this.bodyText = JSON.stringify(this.body);
        } else if (this.headers["Content-Type"] === "application/x-www-form-urlencoded") {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        }
        this.headers["Content-Length"] = this.bodyText.length;
    }
    send(connection) {
        return new Promise((resolve, reject) => {
            // const parser = new ResponseParser;
            let request = `${this.methods} ${this.path} HTTP/1.1\r
${Object.keys(this.headers)
                    .map(item => `${item}: ${this.headers[item]}`)
                    .join("\r\n")}
\r
${this.bodyText}\r\n`
            // console.log(request, 'Request')
            if (!connection) {
                connection = net.createConnection(
                    {
                        host: this.host,
                        port: this.port,
                    },
                    () => {
                        connection.write(request)
                    }
                )
            } else {
                connection.write(request)
            }
            connection.on('data', (data) => {
                // console.log(data.toString(), 'Response');
                // parser.receive(data.toString())
                const parser = ResponseParser(data.toString())

                // fs.writeFileSync('./output.json', JSON.stringify(parser.headers))

                if (parser.isFinished) {
                    resolve(parser.response)
                }
                connection.end();
            });
            connection.on('error', (error) => {
                console.log(error)
                reject(error)
                connection.end();
            })
        })
    }
}

void async function () {
    let req = new Request({

        methods: 'GET',
        host: "127.0.0.1",
        port: 8080,
        path: "/",

        // methods: 'GET',
        // host: "api.jirengu.com",
        // port: 80,
        // path: "/getWeather.php",

        headers: {
            // ['X-Foo2']: 'customed',
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Accept-Encoding": "deflate",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
            "Connection": "keep-alive",
            "Host": "api.jirengu.com",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "none",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36 Edg/86.0.622.63"
        },
        // body: `<div>哈哈</div>`
        // {
        //     name: 1,
        //     data: {
        //         id: 1,
        //         title: "测试HTTP",
        //         content: "测试HTTP是否连通!",
        //     }
        // },
    })
    let result = await req.send()
    if (result.headers['Content-Type'] === 'application/json') {
        result.body = JSON.parse(result.body)
    }
    // console.log(result, 'result')
    fs.writeFileSync('./Response.json', JSON.stringify(result))
    let dom = parser.parseHtml(result.body)
    // console.log(dom)
    // console.log(JSON.stringify(dom, null, '    '))
    let viewport = images(800, 600)
    render(viewport, dom)
    viewport.save('viewport.jpg')

}()
