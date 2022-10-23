import { Request, Response, NextFunction } from 'express'
import { AppProperties } from '../core/AppProperties'
import * as jwt from 'jsonwebtoken'

/**
 * Middleware that will prevent the request from executing if the request
 * header does not contain a valid and current JWT token, decoded by the
 * provided secret
 * @param req The Request
 * @param res The Response
 * @param next The next function to execute
 * @returns 
 */
export async function validJWTNeeded (req: Request, res: Response, next: NextFunction) {
  // No token, no access
  if (!req.headers['authorization']) return res.status(401).send()

  // Decode the token. If there is no provided header or the token
  // doesn't match the secret, this will be null, and the process
  // should return a 401
  let token = decodeToken(req.headers['authorization'])

  // If we have a token, verify it however you feel like verifying it
  if (token) {
    // check if the token has expired
    if ((token.payload as jwt.JwtPayload).stamp < new Date().getTime()) {
      return res.status(401).send()
    }
    // Verification is done and the token isn't expired, so move to the 
    // next function
    return next()
  } else {
    return res.status(401).send()
  }
}

export function requiredScopes (scopes: Array<string>) {
  // Very weak role checking, but useful as an example
  // Determine the role on the token, and the role the endpoint
  // is requesting. If the user has the role, or they are "admin"
  // then we move on, otherwise we throw an error
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['authorization']) {
      const token = decodeToken(req.headers['authorization'])
      if (token) {
        let userScopes = (token.payload as jwt.JwtPayload).scope as Array<string>
        let hasScopes = true

        for (const scope of scopes) {
          hasScopes = userScopes.includes(scope)
          if (!hasScopes) break
        }

        if (hasScopes) {
          // We have a token, and the user has the required role, move to the
          // next function. It's expected that we've already validated the token.
          return next()
        }
      }
    }
    // If we dont have a token, or we do but the user isn't in the role return a 401
    return res.status(401).send()
  }
}

/**
 * Decoder for the token. If the token can be decoded
 * it will be returned to the caller
 * @param _ The request
 * @returns A JWT token, including Header, Payload and Signature, or NULL if the token is invalid
 */
function decodeToken (tokenString: string): jwt.Jwt | null {
  let token: jwt.Jwt | null = null
  let secret = AppProperties.get('oauth.secret')
  // If we don't have an authorization header, we're done here
  if (tokenString && secret) {
    try {
      const authorization = tokenString.startsWith('Bearer') ? tokenString.split(' ') : ['Bearer', tokenString]
      // If we have an auth header, but it's not a bearer token, we're done here
      if (authorization[0] === 'Bearer') {
        try {
          token = jwt.verify(authorization[1], secret as string, {complete: true})
        } catch (err) {
          console.error('JWT Token unverifified')
          token = jwt.decode(authorization[1], {complete: true})
        }
      }
    } catch (err) {
      console.error(err)
      token = null
    }
  }

  return token
}
