import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dtos';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(identifier: string, pass: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: any;
    }>;
    forgotPassword(identifier: string): Promise<{
        success: boolean;
        message: string;
        email: string;
        demoCode: string;
    }>;
    resetPassword(identifier: string, code: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
