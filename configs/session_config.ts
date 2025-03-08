import type {SessionOptions} from 'express-session'
import { SESSION_SECRET } from './env_config'

export const sessionOptions: SessionOptions = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  unset: 'keep' ,
  cookie: {

  }
}
