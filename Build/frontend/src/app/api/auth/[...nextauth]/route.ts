import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch("http://127.0.0.1:8000/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email, password: credentials.password })
          });
          const data = await res.json();
          if (res.ok && data.user) {
            return { id: data.user.id.toString(), email: data.user.email, name: data.user.name };
          }
          return null;
        } catch (e) {
          console.error("Login error:", e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      // For Google login, if a user exists with the same email, NextAuth automatically links them 
      // because of how we store users, but we should make sure the backend knows about the Google user.
      // Since the backend 'requireAuth' already creates missing Google users, we just need to ensure the token has the email.
      return true;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      // We no longer need to pass Google id_token because the backend will verify our custom JWT instead.
      return token;
    },
    async session({ session, token }: any) {
      // Generate a standard JWT and expose it as id_token so the client can send it to the backend
      const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev";
      (session as any).id_token = jwt.sign(token, secret, { algorithm: "HS256" });
      return session;
    },
  },
  jwt: {
    encode: async ({ secret, token }) => {
      return jwt.sign(token!, secret, { algorithm: "HS256" });
    },
    decode: async ({ secret, token }) => {
      if (!token) return null;
      try {
        return jwt.verify(token, secret, { algorithms: ["HS256"] }) as any;
      } catch (e) {
        return null;
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
