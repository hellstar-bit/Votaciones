// 📁 src/votes/votes.service.ts
// ====================================================================
import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Voto } from './entities/voto.entity';
import { VotanteHabilitado } from './entities/votante-habilitado.entity';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { Persona } from '../users/entities/persona.entity';
import { VoteDto } from './dto/vote.dto';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

@Injectable()
export class VotesService {
  constructor(
    // ✅ Usar forwardRef para evitar dependencia circular
    @Inject(forwardRef(() => DashboardGateway))
    private dashboardGateway: DashboardGateway,
    @InjectRepository(Voto)
    private votoRepository: Repository<Voto>,
    @InjectRepository(VotanteHabilitado)
    private votanteHabilitadoRepository: Repository<VotanteHabilitado>,
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
  ) {}

  async processVote(voteDto: VoteDto, ipAddress: string, userAgent: string) {
    const { id_eleccion, id_candidato, qr_code } = voteDto;

    // 1. Verificar que la elección existe y está activa
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion, estado: 'activa' },
      relations: ['tipoEleccion'],
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada o no está activa');
    }

    // 2. Verificar que la elección está en horario
    const ahora = new Date();
    if (ahora < eleccion.fecha_inicio || ahora > eleccion.fecha_fin) {
      throw new BadRequestException('La elección no está en horario de votación');
    }

    // 3. Decodificar y verificar QR
    const personaData = await this.decodeQRCode(qr_code);
    
    // 4. Buscar la persona
    const persona = await this.personaRepository.findOne({
      where: { numero_documento: personaData.numero_documento, estado: 'activo' },
      relations: ['centro', 'sede', 'ficha'],
    });

    if (!persona) {
      throw new BadRequestException('Persona no encontrada o inactiva');
    }

    // 5. Verificar que la persona está habilitada para votar en esta elección
    const votanteHabilitado = await this.votanteHabilitadoRepository.findOne({
      where: { id_eleccion, id_persona: persona.id_persona },
    });

    if (!votanteHabilitado) {
      throw new ForbiddenException('No está habilitado para votar en esta elección');
    }

    if (votanteHabilitado.ha_votado) {
      throw new BadRequestException('Ya ha votado en esta elección');
    }

    // 6. Verificar candidato si no es voto en blanco
    let candidato = null;
    if (id_candidato) {
      candidato = await this.candidatoRepository.findOne({
        where: { 
          id_candidato, 
          id_eleccion, 
          estado: 'validado',
          validado: true,
        },
      });

      if (!candidato) {
        throw new BadRequestException('Candidato no válido para esta elección');
      }
    } else {
      // Verificar que se permite voto en blanco
      if (!eleccion.permite_voto_blanco) {
        throw new BadRequestException('No se permite voto en blanco en esta elección');
      }
    }

    // 7. Generar hash de verificación único
    const hashData = `${id_eleccion}-${persona.id_persona}-${Date.now()}-${Math.random()}`;
    const hash_verificacion = crypto.createHash('sha256').update(hashData).digest('hex');

    // 8. Registrar el voto
    const voto = this.votoRepository.create({
      id_eleccion,
      id_candidato: id_candidato || null,
      hash_verificacion,
    });

    await this.votoRepository.save(voto);

    // 9. Marcar votante como que ya votó
    await this.votanteHabilitadoRepository.update(votanteHabilitado.id_votante_habilitado, {
      ha_votado: true,
      fecha_voto: new Date(),
      ip_voto: ipAddress,
      dispositivo_voto: userAgent,
    });

    // ✅ Notificar solo si dashboardGateway está disponible
    try {
      await this.dashboardGateway?.notifyNewVote(id_eleccion);
    } catch (error) {
      console.warn('No se pudo notificar nuevo voto al dashboard:', error.message);
    }

    return {
      message: 'Voto registrado exitosamente',
      hash_verificacion,
      timestamp: new Date(),
    };
  }

  private async decodeQRCode(qrCode: string): Promise<{ numero_documento: string }> {
    try {
      // El QR debe contener al menos el número de documento
      // Formato esperado: JSON con numero_documento u otros datos
      const decoded = JSON.parse(qrCode);
      
      if (!decoded.numero_documento) {
        throw new Error('QR inválido: falta número de documento');
      }

      return decoded;
    } catch (error) {
      throw new BadRequestException('Código QR inválido');
    }
  }

  async verifyVote(hash_verificacion: string) {
    const voto = await this.votoRepository.findOne({
      where: { hash_verificacion },
      relations: ['eleccion', 'candidato', 'candidato.persona'],
    });

    if (!voto) {
      throw new NotFoundException('Voto no encontrado');
    }

    return {
      eleccion: voto.eleccion.titulo,
      candidato: voto.candidato ? 
        voto.candidato.persona.nombreCompleto : 'VOTO EN BLANCO',
      timestamp: voto.timestamp_voto,
      verificado: true,
    };
  }

  async getElectionResults(id_eleccion: number) {
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion },
      relations: ['candidatos', 'candidatos.persona'],
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada');
    }

    const totalVotos = await this.votoRepository.count({
      where: { id_eleccion },
    });

    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion, id_candidato: null },
    });

    const resultados = await Promise.all(
      eleccion.candidatos.map(async (candidato) => {
        const votos = await this.votoRepository.count({
          where: { id_eleccion, id_candidato: candidato.id_candidato },
        });

        return {
          candidato: {
            id: candidato.id_candidato,
            nombre: candidato.persona.nombreCompleto,
            numero_lista: candidato.numero_lista,
          },
          votos,
          porcentaje: totalVotos > 0 ? Math.round((votos / totalVotos) * 10000) / 100 : 0,
        };
      })
    );

    return {
      eleccion: {
        id: eleccion.id_eleccion,
        titulo: eleccion.titulo,
        estado: eleccion.estado,
      },
      total_votos: totalVotos,
      votos_blanco: votosBlanco,
      porcentaje_blanco: totalVotos > 0 ? Math.round((votosBlanco / totalVotos) * 10000) / 100 : 0,
      candidatos: resultados.sort((a, b) => b.votos - a.votos),
    };
  }
}