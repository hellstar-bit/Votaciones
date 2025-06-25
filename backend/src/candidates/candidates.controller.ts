// 📁 src/candidates/candidates.controller.ts
// ====================================================================
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';

@Controller('candidates')
@UseGuards(JwtAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() createCandidateDto: CreateCandidateDto) {
    return this.candidatesService.create(createCandidateDto);
  }

  @Get('election/:electionId')
  async findByElection(@Param('electionId') electionId: string) {
    return this.candidatesService.findByElection(+electionId);
  }

  @Patch(':id/validate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async validate(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.candidatesService.validate(+id, userId);
  }
}