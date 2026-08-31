import {jwtDecode} from 'jwt-decode'

const authKey = 'auth'
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlLZXlzIjpbImFwaUtleTEiLCJhcGlLZXkyIl0sImV4cCI6MTc3MDcwNzA3MDB9.jXmTjIytSu7QWRAk1f3TtIs9QPLJVVPak--fqiTEpso'

export function getAuth() {
    const token = getJwt()
    if (!token)
        return null
    const parsed = parseJwt(token)
    if (!checkJwt(parsed)) {
        logout()
        return null
    }
    return {
        apiKeys: parsed.apiKeys,
        selectedApiKey: localStorage.getItem('selectedApiKey') || parsed.apiKeys[0],
    }
}

export function logout() {
    localStorage.removeItem(authKey)
}

export function authenticate(token = testToken) {
    if (!checkJwt(token))
        return false
    localStorage.setItem(authKey, token)
    return true
}

function checkJwt(token) {
    if (typeof token === 'string') {
        token = parseJwt(token)
    }
    return token.exp > new Date().getTime() / 1000
}

export function parseJwt(token) {
    return jwtDecode(token)
}

export function getJwt() {
    return localStorage.getItem(authKey)
}