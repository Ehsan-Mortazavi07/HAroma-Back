export declare class LoginDto {
    identifier: string;
    password: string;
}
export declare class RegisterDto {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}
export declare class ForgotPasswordDto {
    identifier: string;
}
export declare class ResetPasswordDto {
    identifier: string;
    code: string;
    newPassword: string;
}
