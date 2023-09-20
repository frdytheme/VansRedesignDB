const express = require("express");
const User = require("../../models/User");
const router = express.Router();
const auth = require("../../middleware/auth"); // middleware
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const EmailAuth = require("../../models/EmailAuth");

require("dotenv").config();

// 로그인 라우터
router.post("/login", async (req, res) => {
  const { name, password, cart } = req.body;
  try {
    // user_id가 존재하는 지 확인
    let user = await User.findOne({ name });
    // 일치하는 ID가 없으면 라우터 종료 => 에러 출력
    if (!user)
      return res.status(500).send({ message: "아이디가 존재하지 않습니다." });

    // bcrypt를 사용해서 입력된 패스워드와 암호화 패스워드 검증.
    const isPasswordCheck = await bcrypt.compare(password, user.password);

    if (!isPasswordCheck)
      return res.status(500).send({ message: "패스워드가 일치하지 않습니다." });

    // 패스워드와 아이디 모두 일치할 시 jwt토큰 발행

    // json web token 으로 변환할 데이터 정보
    const payload = {
      user: {
        id: user.id,
      },
    };

    // jwt토큰 생성
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      sameSite: "none",
      path: "/",
      secure: true,
      maxAge: 15 * 60 * 1000,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {
      expiresIn: "14d",
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      path: "/",
      secure: true,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    user.refresh = refreshToken;

    // 카트 정보 반영

    // 기존 유저 데이터에 카트가 비었으면 비로그인 상태 카트 데이터 업데이트
    if (!user.cart.total) {
      user.cart = { data: cart.data, total: cart.total };
    }

    await user.save();

    res.json({ message: "로그인 완료", cart: user.cart });
  } catch (err) {
    res.status(401).send("사용자 인증 실패");
  }
});

// 토큰 Auth 라우터
router.post("/auth", auth, async (req, res) => {
  try {
    // auth 미들웨어에서 생성해준 req.user를 사용하여 DB에서 user 탐색. 패스워드에 대한 내용은 제외합니다.
    const user = await User.findById(req.user.id).select(
      "-password -refresh -_id"
    );

    if (!user) {
      return res
        .status(404)
        .json({ msg: "해당 유저를 찾을 수 없습니다.", state: "expired" });
    }

    res.status(200).json({ user }); // 응답에 패스워드 정보를 제외한 사용자 정보 넣기
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ msg: "서버 오류 발생", state: "expired" });
  }
});

// 회원가입 라우터
router.post("/join", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // name을 비교해서 user가 이미 존재하는지 확인
    // 존재한다면 return해서 뒤의 코드를 실행하지 않음.
    let user = await User.findOne({ name });
    if (user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "동일한 아이디가 존재합니다." }] });
    }

    // 새로운 user에 대해서 DB에 추가
    user = new User({
      name,
      email,
      password,
    });

    // bcrypt 모듈을 이용해 salt값을 부여하며 password 암호화
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 암호화된 내용까지 포함해 DB에 user를 저장.
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// 아이디 중복 체크 라우터
router.post("/idCheck", async (req, res) => {
  const { name } = req.body;
  try {
    let user = await User.findOne({ name });
    if (!user) {
      res.status(200).send({ isOnly: true });
    } else {
      res.status(200).send({ isOnly: false });
    }
  } catch (err) {
    res.status(401).send("서버 오류");
  }
});

// 이메일 인증 라우터
router.post("/emailAuth", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
  if (user)
    return res.status(400).json({ message: "가입된 이메일이 있습니다." });

  let number = Math.floor(Math.random() * 900000 + 100000);

  const auth = jwt.sign(number, process.env.JWT_SECRET_AUTH);

  const payload = {
    email,
  };

  const emailToken = jwt.sign(payload, process.env.JWT_SECRET_EMAIL, {
    expiresIn: "2m",
  });

  res.cookie("email_token", emailToken, {
    httpOnly: true,
    sameSite: "none",
    path: "/",
    secure: true,
    maxAge: 2 * 60 * 1000,
  });

  await EmailAuth.deleteOne({ email });

  const newEmailAuth = new EmailAuth({
    data: auth,
    email,
  });

  await newEmailAuth.save();

  // nodemailer 이메일 전송 코드
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
    res.status(200).send("인증 메일 전송 성공");
  } catch (err) {
    res.status(401).send(err);
  }
});

// 인증 번호 확인 라우터
router.post("/emailAuth/check", async (req, res) => {
  let userNum = req.body.authNum;

  const token = req.cookies.email_token;

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET_EMAIL);

  const authData = await EmailAuth.findOne({ email: decodedToken.email });

  try {
    if (!token)
      return res
        .status(200)
        .json({ auth: false, message: "유효 시간이 지났습니다." });

    const authNum = jwt.verify(authData.data, process.env.JWT_SECRET_AUTH);

    if (authNum === userNum) {
      await EmailAuth.deleteOne({ email: decodedToken.email });
      res.status(200).json({ auth: true, message: "인증되었습니다." });
    } else {
      res.status(200).json({ auth: false, message: "인증번호가 틀렸습니다." });
    }
  } catch (err) {
    console.error(err);
  }
});

// 로그아웃 라우터
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_REFRESH);
    await User.updateOne({ _id: decoded.user.id }, { $unset: { refresh: 1 } });
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(200).send("로그아웃 성공");
  } catch (err) {
    res.status(500).send("로그아웃 실패");
  }
});

// 카트 업데이트 라우터
router.patch("/cartUpdate", async (req, res) => {
  const { list } = req.body;
  const refresh = req.cookies.refresh_token;
  const decoded = jwt.verify(refresh, process.env.JWT_SECRET_REFRESH);
  const user = await User.findOne({ _id: decoded.user.id });
  user.cart = { data: list.data, total: list.total };
  await user.save();
  try {
    res.status(200).json("Cart Data Update Success");
  } catch (err) {
    res.status(401).json(err);
  }
});

// id찾기 이메일 전송 라우터
router.post("/findId", async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "가입된 이메일이 없습니다." });

  let number = Math.floor(Math.random() * 900000 + 100000);

  const auth = jwt.sign(number, process.env.JWT_SECRET_AUTH);

  const payload = {
    email,
  };

  const emailToken = jwt.sign(payload, process.env.JWT_SECRET_EMAIL, {
    expiresIn: "2m",
  });

  res.cookie("email_token", emailToken, {
    httpOnly: true,
    sameSite: "none",
    path: "/",
    secure: true,
    maxAge: 2 * 60 * 1000,
  });

  await EmailAuth.deleteOne({ email });

  const newEmailAuth = new EmailAuth({
    data: auth,
    email,
  });

  await newEmailAuth.save();

  // nodemailer 이메일 전송 코드
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
    subject: "반스(VANS) 리디자인 홈페이지(by FRDY) 아이디찾기 인증번호",
    text: `인증번호는 \"${number}\" 입니다`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("인증 메일 전송 성공");
  } catch (err) {
    res.status(401).send(err);
  }
});

// id찾기 라우터
router.post("/findId/confirm", async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    res.status(200).send(user.name);
  } catch (err) {
    res.status(401).send(err);
  }
});

// pw찾기 이메일 전송 라우터
router.post("/findPw", async (req, res) => {
  const { email, name } = req.body;

  let user = await User.findOne({ email, name });
  if (!user)
    return res.status(400).json({ message: "유저 정보를 찾을 수 없습니다." });

  let number = Math.floor(Math.random() * 900000 + 100000);

  const auth = jwt.sign(number, process.env.JWT_SECRET_AUTH);

  const payload = {
    email,
  };

  const emailToken = jwt.sign(payload, process.env.JWT_SECRET_EMAIL, {
    expiresIn: "2m",
  });

  res.cookie("email_token", emailToken, {
    httpOnly: true,
    sameSite: "none",
    path: "/",
    secure: true,
    maxAge: 2 * 60 * 1000,
  });

  await EmailAuth.deleteOne({ email });

  const newEmailAuth = new EmailAuth({
    data: auth,
    email,
  });

  await newEmailAuth.save();

  // nodemailer 이메일 전송 코드
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
    subject: "반스(VANS) 리디자인 홈페이지(by FRDY) 아이디찾기 인증번호",
    text: `${user.name}님의 인증번호는 \"${number}\" 입니다`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send("인증 메일 전송 성공");
  } catch (err) {
    res.status(401).send(err);
  }
});

// pw찾기 라우터
router.patch("/findPw/changePw", async (req, res) => {
  const { name, email, pw } = req.body;
  try {
    let user = await User.findOne({ name, email });

    const nowPw = await bcrypt.compare(pw, user.password);

    if (nowPw)
      return res.status(200).send({
        message:
          "비밀번호가 현재와 동일합니다 \n새로운 비밀번호를 입력해주세요.",
        isOk: false,
      });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(pw, salt);
    await user.save();

    res.status(200).send({ message: "비밀번호 변경 완료", isOk: true });
  } catch (err) {
    res.status(401).send(err);
  }
});

// 회원탈퇴 라우터
router.post("/deleteUser", async (req, res) => {
  const { password, name } = req.body;
  try {
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ message: "아이디를 찾을 수 없습니다." });
    }

    const compare = await bcrypt.compare(password, user.password);
    if (compare) {
      await user.deleteOne();
      res.status(200).json({ message: `${name}정보가 DB에서 삭제됐습니다.` });
    } else {
      res.status(404).json({ message: "비밀번호가 틀렸습니다." });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

module.exports = router;
