// 📁 src/votes/votes.controller.ts
// ====================================================================
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { VotesService } from './votes.service';
import { VoteDto } from './dto/vote.dto';

@Controller('votes')
@UseGuards(JwtAuthGuard)
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('MESA_VOTACION', 'INSTRUCTOR', 'ADMIN')
  async vote(@Body() voteDto: VoteDto, @Req() req: Request) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    return this.votesService.processVote(voteDto, ipAddress, userAgent);
  }

  @Get('verify/:hash')
  async verifyVote(@Param('hash') hash: string) {
    return this.votesService.verifyVote(hash);
  }

  @Get('results/:electionId')
  async getResults(@Param('electionId') electionId: string) {
    return this.votesService.getElectionResults(+electionId);
  }
}