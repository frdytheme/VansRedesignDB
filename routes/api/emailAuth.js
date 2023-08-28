const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const nodemailer = require("nodemailer");
require("dotenv").config();

let number;

router.post("/", async (req, res) => {
  const { email } = req.body;
  
  number = Math.floor(Math.random() * 900000 + 100000);

  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_OAUTH_USER,
      clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
      clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
    },
  });

  const mailOptions = {
    to: email,
    subject: "반스(VANS) 리디자인 홈페이지(by FRDY) 회원가입 이메일 인증",
    text: `인증번호는 \"${number}\" 입니다`,
  };

  try {
    await transporter.sendMail(mailOptions);
    setTimeout(() => {
      number = undefined;
    }, 120000);
    res.status(200).send("인증 메일 전송 성공");
  } catch (err) {
    res.status(401).send("서버 오류");
  }
});

router.post("/check", async (req, res) => {
  let userNum = req.body.authNum;

  try {
    if (number === userNum) {
      res.status(200).json({ auth: true });
    } else {
      res.status(200).json({ auth: false });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
