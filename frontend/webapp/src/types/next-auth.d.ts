import { DefaultSession } from "next-auth";

type UserState = "Active" | "Locked";

interface BaseUserData {
  id: string;
  userName: string;
  email: string;
  phoneNumberCountryCode: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  lastLoggedInAt?: Date;
  roles?: string[];
  userState: UserState;
  createdAt: Date;
}

interface User extends BaseUserData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: User;
    error?: "RefreshTokenError";
  }

  interface User extends BaseUserData {
    accessToken: string;
    refreshToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: Session["user"];
    error?: "RefreshTokenError";
  }
}
