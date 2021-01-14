import { HttpException } from "@core/exceptions";
import { isEmptyObject } from "@core/utils";
import { TokenData } from "@modules/auth/interface";
import gravatar from "gravatar";
import bcrypt from "bcrypt";
import UserSchema from "./model";
import IUser from "./interface";
import jws from "jsonwebtoken";

export default class UserService {
  public userSchema = UserSchema;
  public async createUser(model: any): Promise<TokenData> {
    if (isEmptyObject(model)) {
      throw new HttpException(400, "Model is empty");
    } else {
      const user = this.userSchema.findOne({ email: model.email });
      if (user) {
        throw new HttpException(
          409,
          `Your email ${model.email} already exist.`
        );
      } else {
        const avatar = gravatar.url(model.email!, {
          size: "200",
          rating: "g",
          default: "mm",
        });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(model.password!, salt);
        const createdUser: IUser = await this.userSchema.create({
          ...model,
          password: hashedPassword,
          avatar: avatar,
          date: Date.now(),
        });

        return this.createToken(createdUser);
      }
    }
  }
  private createToken(user: IUser): TokenData {
    const dataInToken: { id: string } = { id: user._id };
    const secret: string = process.env.JWT_TOKEN_SECRET!;
    const expriresIn: number = 60;
    return {
      token: jws.sign(dataInToken, secret, { expiresIn: expriresIn }),
    };
  }
}
