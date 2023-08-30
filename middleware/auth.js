// HTTP 요청 헤더에 JWT가 들어오면 검증 후 요청(req)에 사용자 정보를 할당합니다.
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

module.exports = async function (req, res, next) {

  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  const { name } = req.body;

  try {
    // 액세스 토큰이 없으면, 유저 아이디를 db에 검색해 동일한 리프레시 토큰을 갖고 있는 지 확인.
    if (!accessToken) {
      const user = await User.findOne({ name: name });
      // 동일한 리프레시 토큰이라면, 액세스 토큰과 리프레시 토큰 모두 갱신.
      if (user.refresh === refreshToken) {
        const payload = {
          user: {
            id: user.id,
          },
        };

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

        user.refresh = refreshToken;
        await user.save();
        // 리프레시 토큰이 만료되었거나 기존 토큰과 다를 시 로그인 정보 만료, 유저db의 refresh 필드 삭제.
      } else {
        await User.updateOne({ name: name }, { $unset: { refresh: 1 } });
        return res.status(401).json({ msg: "로그인 정보가 만료되었습니다." });
      }
      return res.status(401).json({ msg: "액세스 토큰이 유효하지 않습니다." });
    }

    // 토큰에 대해 검증.

    // token 해독
    // token을 만들 때 설정한 secret key 값 : jwtSecret
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    // req에 해독한 user 정보 생성
    req.user = decoded.user;
    // 미들웨어에서 많이 사용하는 메서드로 현재에서 판단하지 않고 라우터로 넘기겠다는 의미.
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
