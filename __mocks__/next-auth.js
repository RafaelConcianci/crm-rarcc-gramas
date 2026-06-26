const NextAuth = () => ({
  handlers: { GET: () => {}, POST: () => {} },
  auth: () => null,
  signIn: () => {},
  signOut: () => {},
})

module.exports = NextAuth
module.exports.default = NextAuth
