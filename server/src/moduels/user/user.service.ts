import { InjectModel } from '@app/transformers/model.transform';
import { Injectable } from '@nestjs/common';
import { User } from './user.model';
import { MongooseModel } from '@app/interfaces/mongoose.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: MongooseModel<User>,
  ) {}

  async getUserInfo(id) {
    await this.userModel.findById({ id: id }).exec();
  }
}
