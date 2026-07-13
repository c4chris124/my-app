import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  /** OWASP: allow long passphrases; upper bound guards argon2 cost. */
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;
}
