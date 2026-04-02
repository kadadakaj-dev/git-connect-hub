import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  twoFaCode?: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class OAuthLoginDto {
  @IsString()
  provider!: "google" | "github" | "apple";

  @IsString()
  providerAccountId!: string;

  @IsEmail()
  email!: string;
}

export class Setup2faDto {
  @IsString()
  token!: string;
}

export class BiometricDto {
  @IsString()
  userId!: string;

  @IsString()
  credentialId!: string;
}
