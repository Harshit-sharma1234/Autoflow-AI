import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
    env: string;
    port: number;
    mongodb: {
        uri: string;
    };
    redis: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    ai: {
        openai: {
            apiKey: string;
        };
        gemini: {
            apiKey: string;
        };
        groq: {
            apiKey: string;
        };
    };
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        s3Bucket: string;
        region: string;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    logging: {
        level: string;
    };
    corsOrigin: string;
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),

    mongodb: {
        uri: process.env.MONGODB_URI || (process.env.NODE_ENV === 'development' ? '' : 'mongodb://localhost:27017/autoflow'),
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-me',
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    },

    ai: {
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
        },
        gemini: {
            apiKey: process.env.GEMINI_API_KEY || '',
        },
        groq: {
            apiKey: process.env.GROQ_API_KEY || '',
        },
    },

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        s3Bucket: process.env.AWS_S3_BUCKET || '',
        region: process.env.AWS_REGION || 'us-east-1',
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },

    email: {
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.EMAIL_FROM || 'noreply@autoflow.ai',
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
    corsOrigin: process.env.CORS_ORIGIN || '*',
};

// Validate required config in production
if (config.env === 'production') {
    const required = [
        { key: 'JWT_SECRET', value: config.jwt.secret, default: 'default-secret-change-me' },
        { key: 'REFRESH_TOKEN_SECRET', value: config.jwt.refreshSecret, default: 'default-refresh-secret-change-me' },
        { key: 'MONGODB_URI', value: config.mongodb.uri },
    ];

    for (const { key, value, default: defaultValue } of required) {
        if (!value || value === defaultValue) {
            throw new Error(`Missing or default value for required config: ${key}`);
        }
    }
}

export default config;
