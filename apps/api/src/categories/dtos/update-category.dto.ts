import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto.js';

export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['parentId'] as const),
) {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nullable: true,
    description:
      'New parent category id; explicit null detaches the category to top-level',
  })
  @IsOptional()
  @ValidateIf((dto: UpdateCategoryDto) => dto.parentId !== null)
  @IsUUID()
  parentId?: string | null;
}
