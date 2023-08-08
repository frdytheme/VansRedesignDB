const express = require("express");
const User = require("../../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// 로그인 라우터
router.post("/", async (req, res) => {
  const { name, password } = req.body;

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
      domain: "localhost",
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
      domain: "localhost",
      path: "/",
      secure: true,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    // const accessToken = jwt.sign(payload, "accessCoin", { expiresIn: "15m" });
    // const refreshToken = jwt.sign(payload, "refreshCoin", { expiresIn: "7d" });

    // res.json({ message: "로그인 완료", accessToken, refreshToken });
    res.json({ message: "로그인 완료" });
  } catch (err) {
    res.status(401).send("사용자 인증 실패");
  }
});

module.exports = router;



/*

  1. 사용자 최초 로그인 시 access token과 refresh token 발급
  2. access token은 만료 기간이 짧다 (15분). 즉 탈취당해도 15분의 짧은 시간만 유효하기 때문에 피해를 줄일 수 있음.
  3. refresh token은 만료 기간이 길며 (예, 14일) 쿠키 혹은 DB에 저장한다.
  4. access token이 만료되면 사용자는 15분마다 로그인을 할 필요 없이, 발급받았던 refresh token을 사용해 access token을 갱신한다.

  즉 access token은 휘발성 정보로 15분마다 새롭게 갱신되고 refresh token은 유효한 access token을 재발급해주므로 보안성이 중요.

*/