// HTTP 요청 헤더에 JWT가 들어오면 검증 후 요청(req)에 사용자 정보를 할당합니다.
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

module.exports = async function (req, res, next) {
  try {
    let accessToken = req.cookies.access_token;
    let refreshToken = req.cookies.refresh_token;
    const { name, password } = req.body;

    const user = await User.findOne({ name: name });

    const checkPw = await bcrypt.compare(password, user.password);

    if (!checkPw) return res.status(401).json({err: "비밀번호가 틀렸습니다.", state: "wrong"});

    // 리프레시 토큰이 없으면 로그인 만료 리턴.
    if (!refreshToken) {
      await User.updateOne({ name: name }, { $unset: { refresh: 1 } });
      res.clearCookie("access_token");
      return res.json({ err: "로그인 정보 만료", state: "expired" });
    }
    // 액세스 토큰이 없으면, 유저가 db에 리프레시 토큰을 갖고 있는 지 확인.
    if (!accessToken) {
      // 리프레시 토큰이 유효한 토큰인지 확인
      if (user) {
        // 토큰이 유효하고, 유저가 현재 클라이언트와 동일하면 토큰 모두 재발급.
        if (user.refresh === refreshToken) {
          const payload = {
            user: {
              id: user.id,
            },
          };

          accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
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

          refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH, {
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
        } else {
          res.clearCookie("refresh_token");
          res
            .status(401)
            .json({ msg: "해당 토큰은 만료되었습니다.", state: "expired" });
        }
      }
    }

    // 토큰 검증.
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    // req에 해독한 user 정보 생성
    req.user = decoded.user;
    // 미들웨어에서 많이 사용하는 메서드로 현재에서 판단하지 않고 라우터로 넘기겠다는 의미.
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
