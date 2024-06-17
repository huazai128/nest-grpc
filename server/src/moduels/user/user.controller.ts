import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller('user')
export class UserController {

    @MessagePattern({ cmd: 'getUser' })
    async getUsers() {
      const user = [{ id: 1, name: 'user name' }];
      return user;
    }
  
    @MessagePattern({ cmd: 'getUserFromService' })
    async getUserFromService() {
      return { id: 10, name: 'test' };
    }
}
