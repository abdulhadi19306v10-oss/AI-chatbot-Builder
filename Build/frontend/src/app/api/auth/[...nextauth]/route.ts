import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account }: any) {
      // Pass the Google id_token so we can send it to FastAPI
      if (account) {
        token.id_token = account.id_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Send properties to the client
      (session as any).id_token = token.id_token;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
