//express 모듈 불러오기
const express = require("express");
const connectDB = require("./db");
//express 사용
const app = express();
const port = 5000;

app.use(express.json({ extended: true }));
app.use("/api/register", require("./routes/api/register"));

app.get("/", (req, res) => {
  res.send("API running...");
});

connectDB();

/**
 * @path {GET} http://localhost:5000/
 * @description index.js 로컬 경로
 */

app.listen(port, () => console.log(`Server started on port ${port}`));