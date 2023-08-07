const express = require("express");
const User = require("../../models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    jwt.sign(
      payload, // 변환할 데이터
      "accessCoin", // secret key 값
      { expiresIn: "15m" }, // token의 유효시간
      (err, accessToken) => {
        if (err) throw err;

        res.cookie("access_token", accessToken, {
          // httpOnly: true,
          domain: "localhost",
          sameSite: "none",
          secure: true,
          maxAge: 15 * 60 * 1000,
        });
      }
    );

    // const accessToken = jwt.sign(payload, "accessCoin", { expiresIn: "15m" });
    // const refreshToken = jwt.sign(payload, "refreshCoin", { expiresIn: "7d" });

    // res.json({ message: "로그인 완료", accessToken, refreshToken });
    res.json({ message: "로그인 완료" });
  } catch (err) {
    res.status(500).send("사용자 인증 실패");
  }
});

module.exports = router;
