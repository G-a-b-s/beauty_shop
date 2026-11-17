import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { firebaseConfig } from './firebase'

const SECONDARY_APP_NAME = 'secondary'

export function getSecondaryAuth(): Auth {
  const app = getApps().some((entry) => entry.name === SECONDARY_APP_NAME)
    ? getApp(SECONDARY_APP_NAME)
    : initializeApp(firebaseConfig, SECONDARY_APP_NAME)

  return getAuth(app)
}
