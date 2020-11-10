const http = require('http');

let a = {
  "error": 0,
  "status": "success",
  "date": "2020-11-09",
  "results": [
    {
      "currentCity": "石家庄市",
      "pm25": "106",
      "index": [],
      "weather_data": [
        {
          "date": "周三 09月16日 (实时：25℃)",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "西北风3-4级",
          "temperature": "27 ~ 16℃"
        },
        {
          "date": "周四",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "北风3-4级",
          "temperature": "27 ~ 18℃"
        },
        {
          "date": "周五",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "北风3-4级",
          "temperature": "29 ~ 17℃"
        },
        {
          "date": "周六",
          "dayPictureUrl": "http://api.map.baidu.com/images/weather/day/qing.png",
          "nightPictureUrl": "http://api.map.baidu.com/images/weather/night/qing.png",
          "weather": "晴",
          "wind": "南风微风",
          "temperature": "30 ~ 18℃"
        }
      ]
    }
  ]
}

const server = http.createServer(async (req, res) => {
  console.log('接受到请求')
  console.log(req.headers, '请求')
  // res.setHeader('Content-Type', 'text/html');
  // res.setHeader('Content-Type', 'text/plain');
  // res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  // res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(
    // JSON.stringify(a)

    // `hello http 哈哈`

    // `{"error":0,"status":"success","date":"2020-11-09","results":[{"currentCity":"石家庄市","pm25":"106","index":[],"weather_data":[{"date":"周三 09月16日 (实时：25℃)","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"西北风3-4级","temperature":"27 ~ 16℃"},{"date":"周四","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"北风3-4级","temperature":"27 ~ 18℃"},{"date":"周五","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"北风3-4级","temperature":"29 ~ 17℃"},{"date":"周六","dayPictureUrl":"http://api.map.baidu.com/images/weather/day/qing.png","nightPictureUrl":"http://api.map.baidu.com/images/weather/night/qing.png","weather":"晴","wind":"南风微风","temperature":"30 ~ 18℃"}]}]}`

    `<html lang="en">
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
</html>`

  )
});
server.listen(8080, () => {
  console.log(`120.0.0.1:8080`)
})