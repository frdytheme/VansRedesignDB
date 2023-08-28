//express 모듈 불러오기
const express = require("express");
const connectDB = require("./db");
const cors = require("cors");
const cookieParser = require("cookie-parser");

//express 사용
const app = express();
const port = 5000;

app.use(
  cors({
    origin: "http://localhost:3000", // 허용할 도메인 주소
    credentials: true, // 쿠키 전달을 허용
  })
);

app.use(cookieParser());

app.use(express.json({ extended: true }));
app.use("/api/register", require("./routes/api/register"));
app.use("/api/product", require("./routes/api/productRouter"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/login", require("./routes/api/login"));
app.use("/api/emailAuth", require("./routes/api/emailAuth"));

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

app.listen(port, () => console.log(`Server started on port ${port}`));
