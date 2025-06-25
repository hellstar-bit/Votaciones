// 📁 src/elections/elections.controller.ts
// ====================================================================
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';

@Controller('elections')
@UseGuards(JwtAuthGuard)
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body() createElectionDto: CreateElectionDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.create(createElectionDto, userId);
  }

  @Get()
  async findAll(@Request() req) {
    return this.electionsService.findAll(req.user.id, req.user.rol);
  }

  @Get('active')
  async getActive() {
    return this.electionsService.getActiveElections();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.electionsService.findOne(+id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.electionsService.getElectionStats(+id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async activate(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.activate(+id, userId);
  }

  @Patch(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async finalize(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.electionsService.finalize(+id, userId);
  }
}