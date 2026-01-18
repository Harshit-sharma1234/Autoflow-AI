import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IAuthTokens, ITokenPayload, IUser, UserRole } from '@autoflow/shared';
import { User, IUserDocument } from '../../models/user.model';
import { redis } from '../../config/redis';
import config from '../../config';
import {
    AuthenticationError,
    ConflictError,
    NotFoundError,
    ValidationError
} from '../../utils/errors';
import { createLogger } from '../../utils/logger';

const logger = createLogger('AuthService');

export class AuthService {
    // Register a new user
    async register(email: string, password: string, name: string): Promise<{ user: IUser; tokens: IAuthTokens }> {
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            name,
            role: UserRole.USER,
        });

        logger.info({ userId: user._id }, 'User registered');

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: this.formatUser(user),
            tokens,
        };
    }

    // Login user
    async login(email: string, password: string): Promise<{ user: IUser; tokens: IAuthTokens }> {
        // Find user with password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            throw new AuthenticationError('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            throw new AuthenticationError('Invalid email or password');
        }

        logger.info({ userId: user._id }, 'User logged in');

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: this.formatUser(user),
            tokens,
        };
    }

    // Refresh tokens
    async refresh(refreshToken: string): Promise<IAuthTokens> {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as ITokenPayload & { jti: string };

            // Check if token is in Redis (not revoked)
            const isValid = await redis.get(`refresh:${decoded.jti}`);
            if (!isValid) {
                throw new AuthenticationError('Invalid refresh token');
            }

            // Get user
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new AuthenticationError('User not found');
            }

            // Revoke old refresh token
            await redis.del(`refresh:${decoded.jti}`);

            // Generate new tokens
            return this.generateTokens(user);
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError('Invalid refresh token');
            }
            throw error;
        }
    }

    // Logout user
    async logout(userId: string, refreshToken?: string): Promise<void> {
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { jti: string };
                await redis.del(`refresh:${decoded.jti}`);
            } catch {
                // Ignore invalid token errors during logout
            }
        }

        logger.info({ userId }, 'User logged out');
    }

    // Get user by ID
    async getUserById(userId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }
        return this.formatUser(user);
    }

    // Generate access and refresh tokens
    private async generateTokens(user: IUserDocument): Promise<IAuthTokens> {
        const payload: ITokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        // Generate access token
        const accessToken = jwt.sign(payload, config.jwt.secret as any, {
            expiresIn: config.jwt.expiresIn as any,
        });

        // Generate refresh token with unique ID
        const jti = uuidv4();
        const refreshToken = jwt.sign(
            { ...payload, jti },
            config.jwt.refreshSecret as any,
            { expiresIn: config.jwt.refreshExpiresIn as any }
        );

        // Store refresh token JTI in Redis
        const refreshExpirySeconds = this.parseExpiryToSeconds(config.jwt.refreshExpiresIn);
        await redis.setex(`refresh:${jti}`, refreshExpirySeconds, user._id.toString());

        return { accessToken, refreshToken };
    }

    // Format user for response
    private formatUser(user: IUserDocument): IUser {
        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    // Parse expiry string to seconds
    private parseExpiryToSeconds(expiry: string): number {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return 3600; // Default 1 hour

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 24 * 60 * 60;
            default: return 3600;
        }
    }
}
