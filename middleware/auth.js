// HTTP 요청 헤더에 JWT가 들어오면 검증 후 요청(req)에 사용자 정보를 할당합니다.
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get token from header
  // header에서 x-auth-token 은 token의 key 값
  // token에는 JWT가 들어갑니다.
  // cookieParser()(req, res, () => {});

  const token = req.cookies.access_token;

  // 토큰이 아니라면,
  if (!token) {
    return res.status(401).json({ msg: "토큰이 유효하지 않습니다.", token: req.cookies });
  }

  // 토큰에 대해 검증.

  try {
    // token 해독
    // token을 만들 때 설정한 secret key 값 : jwtSecret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req에 해독한 user 정보 생성
    req.user = decoded.user;
    // 미들웨어에서 많이 사용하는 메서드로 현재에서 판단하지 않고 라우터로 넘기겠다는 의미입니다.
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
