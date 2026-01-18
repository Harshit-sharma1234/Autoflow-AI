import { Request, Response } from 'express';
import { AuthService } from '../services/auth/auth.service';
import { buildSuccessResponse } from '../utils/errors';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    register = async (req: Request, res: Response): Promise<void> => {
        const { email, password, name } = req.body;
        const result = await this.authService.register(email, password, name);
        res.status(201).json(buildSuccessResponse(result));
    };

    login = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body;
        const result = await this.authService.login(email, password);
        res.json(buildSuccessResponse(result));
    };

    refresh = async (req: Request, res: Response): Promise<void> => {
        const { refreshToken } = req.body;
        const tokens = await this.authService.refresh(refreshToken);
        res.json(buildSuccessResponse({ tokens }));
    };

    logout = async (req: Request, res: Response): Promise<void> => {
        const { refreshToken } = req.body;
        await this.authService.logout(req.user!.id, refreshToken);
        res.json(buildSuccessResponse({ message: 'Logged out successfully' }));
    };

    me = async (req: Request, res: Response): Promise<void> => {
        const user = await this.authService.getUserById(req.user!.id);
        res.json(buildSuccessResponse({ user }));
    };
}
