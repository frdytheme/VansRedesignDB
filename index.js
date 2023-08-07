//express 모듈 불러오기
const express = require("express");
const connectDB = require("./db");
const cors = require("cors");
const http = require("http");
const https = require("https");
const fs = require("fs");
//express 사용
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json({ extended: true }));
app.use("/api/register", require("./routes/api/register"));
app.use("/api/product", require("./routes/api/productRouter"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/login", require("./routes/api/login"));

app.get("/", (req, res) => {
  res.send("GET 요청을 수신했습니다.");
});
app.post("/", (req, res) => {
  res.send("POST 요청을 수신했습니다.");
});
app.patch("/", (req, res) => {
  res.send("PATCH 요청을 수신했습니다.");
});
app.delete("/", (req, res) => {
  res.send("DELETE 요청을 수신했습니다.");
});

connectDB();

const httpsOptions = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
};

const httpsPort = 443;

const httpServer = http.createServer(app);
const httpsServer = https.createServer(httpsOptions, app);

// app.listen(port, () => console.log(`Server started on port ${port}`));
httpServer.listen(port, () => console.log(`Server started on port ${port}`));
httpsServer.listen(httpsPort, () =>
  console.log(`Server started on port ${httpsPort}`)
);
