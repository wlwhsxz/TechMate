import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { userModel } from '../db/index.js';

export class UserService {
  constructor(userModel) {
    this.userModel = userModel;
  }

  // CRUD 순서

  // 회원가입 기능
  async signup(userInfo) {
    try {
      const { username, email, password, mobileNumber, address, role } =
        userInfo;

      // 계정 중복 검사
      const checkEmailDuplication = await userModel.findOneByEmail(email);
      if (checkEmailDuplication) {
        console.log('이미 등록된 이메일입니다.');
        throw new Error('이미 등록된 이메일입니다.');
      }

      // 비밀번호 해싱
      const hashedPassword = crypto
        .createHmac('sha256', process.env.SECRET_KEY)
        .update(password)
        .digest('hex');

      // 유저 생성
      const addUser = await this.userModel.create({
        username,
        email,
        password: hashedPassword,
        mobileNumber,
        address,
        role,
      });

      return addUser;
    } catch (err) {
      throw new Error(err);
    }
  }

  // 로그인 기능
  async signin(signInInfo) {
    const { email, password } = signInInfo;
    const user = await userModel.findOneByEmail(email);
    if (!user) {
      console.log('이메일 혹은 패스워드가 일치하지 않습니다.');
      throw new Error('이메일 혹은 패스워드가 일치하지 않습니다.');
    }

    // 입력 비밀번호 해시화
    const inputPassword = crypto
      .createHmac('sha256', process.env.SECRET_KEY)
      .update(password)
      .digest('hex');

    // DB 비밀번호
    const savedPassword = user.password;

    if (inputPassword !== savedPassword) {
      console.log('비밀번호가 일치하지 않습니다.');
      throw new Error('이메일 혹은 패스워드가 일치하지 않습니다.');
    }
    console.log('로그인 성공');

    // 로그인 성공 -> JWT 웹 토큰 생성
    const secretKey = process.env.JWT_SECRET_KEY || 'secret-key';
    // 사용자의 ID와 권한 정보를 토큰에 포함시켜 생성, 유효 시간 1시간
    const token = jwt.sign({ userId: user._id, role: user.role }, secretKey, {
      expiresIn: '1h',
    });

    const isAdmin = user.role === 'admin';

    return { token, isAdmin };
  }

  // 모든 user 조회
  async getUsers() {
    const users = await this.userModel.findAll();
    return users;
  }

  // 유저정보 수정, 현재 비밀번호가 있어야 수정 가능함.
  async setUser(userInfoRequired, toUpdate) {
    // 객체 destructuring
    const { userId, inputPassword } = userInfoRequired;

    // 우선 해당 id의 유저가 db에 있는지 확인
    let user = await this.userModel.findById(userId);

    // db에서 찾지 못한 경우, 에러 메시지 반환
    if (!user) {
      throw new Error('가입 내역이 없습니다. 다시 한 번 확인해 주세요.');
    }

    // 비밀번호 일치 여부 확인
    const savedPassword = user.password;
    let isPasswordCorrect = false;
    if (inputPassword === savedPassword) isPasswordCorrect = true;

    if (!isPasswordCorrect) {
      throw new Error(
        '현재 비밀번호가 일치하지 않습니다. 다시 한 번 확인해 주세요.'
      );
    }

    // 업데이트 시작
    // 비밀번호도 변경하는 경우에는 해쉬화 해주어야 함.
    const { password } = toUpdate;

    if (password) {
      const newPasswordHash = password
        .createHmac('sha256', process.env.SECRET_KEY)
        .update(password)
        .digest('hex');
      toUpdate.password = newPasswordHash;
    }

    // 업데이트 진행
    user = await this.userModel.update({
      userId,
      update: toUpdate,
    });

    return user;
  }

  // 위 setUser과 달리, 현재 비밀번호 없이도, 권한을 수정할 수 있음.
  async setRole(userId, role) {
    const updatedUser = await this.userModel.update({
      userId,
      update: { role },
    });

    return updatedUser;
  }

  // 위 setUser과 달리, 현재 비밀번호 없이도, 주소 혹은 번호를 수정할 수 있음.
  async saveDeliveryInfo(userId, deliveryInfo) {
    const updatedUser = await this.userModel.update({
      userId,
      update: deliveryInfo,
    });

    return updatedUser;
  }

  async getUserData(userId) {
    const user = await this.userModel.findById(userId);

    // db에서 찾지 못한 경우, 에러 메시지 반환
    if (!user) {
      throw new Error('가입 내역이 없습니다. 다시 한 번 확인해 주세요.');
    }

    return user;
  }

  async deleteUserData(userId) {
    const { deletedCount } = await this.userModel.deleteById(userId);

    // 삭제에 실패한 경우, 에러 메시지 반환
    if (deletedCount === 0) {
      throw new Error(`${userId} 사용자 데이터의 삭제에 실패하였습니다.`);
    }

    return { result: 'success' };
  }
}

const userService = new UserService(userModel);
export { userService };
