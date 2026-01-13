import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { loginWithGoogle: jest.Mock };

  beforeEach(async () => {
    authService = {
      loginWithGoogle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate googleLogin to AuthService', async () => {
    const token = 'google-oauth-token';
    const expectedResult = {
      accessToken: 'jwt-token',
      user: { id: 'user-id' },
    };

    authService.loginWithGoogle.mockResolvedValue(expectedResult);

    const result = await controller.googleLogin(token);

    expect(authService.loginWithGoogle).toHaveBeenCalledWith(token);
    expect(result).toEqual(expectedResult);
  });
});
