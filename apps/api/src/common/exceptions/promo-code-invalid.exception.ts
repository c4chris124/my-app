import { BadRequestException } from '@nestjs/common';

export class PromoCodeInvalidException extends BadRequestException {
  constructor(reason: string) {
    super(reason);
  }
}
