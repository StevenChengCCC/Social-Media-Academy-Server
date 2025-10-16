import { createRemoteJWKSet, jwtVerify } from 'jose';

const region = process.env.COGNITO_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const audience = process.env.COGNITO_AUDIENCE;

if (!region || !userPoolId) {
  console.warn('COGNITO_REGION / COGNITO_USER_POOL_ID not set; JWT verify will fail.');
}

const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
const jwksUri = new URL('/.well-known/jwks.json', issuer);
const JWKS = createRemoteJWKSet(jwksUri);

export async function verifyJwt(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });

    const { payload } = await jwtVerify(token, JWKS, { issuer, audience });
    req.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      groups: payload['cognito:groups'] || []
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token', detail: err.message });
  }
}