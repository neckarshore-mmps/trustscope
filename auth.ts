import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * GitHub OAuth via Auth.js/NextAuth (work-order AP-1 seam #4 — a reusable, identity-capable
 * provider, not a hand-rolled token dance). ENV-GATED: with no client id/secret, no provider is
 * registered and the file-issue flow degrades to the credential-free fallbacks (Copy-Markdown /
 * pre-filled issue). `public_repo` scope is the minimum needed to open an issue as the user.
 */
export const oauthConfigured = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: oauthConfigured
    ? [
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          authorization: { params: { scope: "read:user public_repo" } },
        }),
      ]
    : [],
  callbacks: {
    // Persist the GitHub access token so the file-issue route can act AS the user.
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token;
      // Data minimization (Art. 5(1)(c) DSGVO): the ONLY thing TrustScope needs is the
      // access token (to open an issue as the user) plus the opaque subject id NextAuth
      // uses to key the session. No component consumes the GitHub profile, so we do NOT
      // persist name / email / avatar in the session JWT. Keep this stripping in lockstep
      // with the § 5 data-category text in app/datenschutz.
      delete token.name;
      delete token.email;
      delete token.picture;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
