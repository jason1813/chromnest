import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthBodyDto } from './auth_dto';
// import bcrypt from 'bcrypt';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  
  async signup(body: AuthBodyDto) {
    const hashedPassword = await bcrypt.hash(body.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          username: body.username,
          password: hashedPassword
        }
      });

      delete user.password;

      return user;
    } catch(error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken')
        }
      }
      throw error;
    }
  }

  async login(body: AuthBodyDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: body.username
      }
    })

    if (!user) {
      throw new ForbiddenException('Credentials incorrect')
    }

    const pwMatches = await bcrypt.compare (
      body.password, user.password
    )

    if (!pwMatches) {
      throw new ForbiddenException('Credentials incorrect')
    }

    delete user.password;
    return user;
  }
}
