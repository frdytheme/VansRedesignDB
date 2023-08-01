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
    if (!user) return res.status(500).send({message:"아이디가 존재하지 않습니다."});

    // bcrypt를 사용해서 입력된 패스워드와 암호화 패스워드 검증.
    const isPasswordCheck = await bcrypt.compare(password, user.password);

    if (!isPasswordCheck) return res.status(500).send({message:"패스워드가 일치하지 않습니다."});

    // 패스워드와 아이디 모두 일치할 시 jwt토큰 발행

    // json web token 으로 변환할 데이터 정보
    const payload = {
      user: {
        id: user.id,
      },
    };

    // json web token 생성하여 send 해주기
    jwt.sign(
      payload, // 변환할 데이터
      "jwtSecret", // secret key 값
      { expiresIn: "1h" }, // token의 유효시간
      (err, token) => {
        if (err) throw err;
        res.send({ token }); // token 값 response 해주기
      }
    );
  } catch (err) {
    res.status(500).send("사용자 인증 실패");
  }
});

module.exports = router;
