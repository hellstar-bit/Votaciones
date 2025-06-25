// 📁 src/auth/auth.service.ts
// ====================================================================
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../users/entities/usuario.entity';
import { Persona } from '../users/entities/persona.entity';
import { Rol } from '../users/entities/rol.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Buscar usuario con relaciones
    const usuario = await this.usuarioRepository.findOne({
      where: { username, estado: 'activo' },
      relations: ['persona', 'rol', 'persona.centro', 'persona.sede', 'persona.ficha'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está bloqueado
    if (usuario.estado === 'bloqueado' || 
        (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date())) {
      throw new UnauthorizedException('Usuario bloqueado');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);
    
    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      await this.incrementarIntentosFallidos(usuario);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Resetear intentos fallidos y actualizar último acceso
    await this.usuarioRepository.update(usuario.id_usuario, {
      intentos_fallidos: 0,
      bloqueado_hasta: null,
      ultimo_acceso: new Date(),
    });

    // Generar token JWT
    const payload = {
      sub: usuario.id_usuario,
      username: usuario.username,
      rol: usuario.rol.nombre_rol,
      persona_id: usuario.persona.id_persona,
      centro_id: usuario.persona.id_centro,
      sede_id: usuario.persona.id_sede,
      ficha_id: usuario.persona.id_ficha,
      jornada: usuario.persona.jornada,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: usuario.id_usuario,
        username: usuario.username,
        nombre_completo: usuario.persona.nombreCompleto,
        rol: usuario.rol.nombre_rol,
        centro: usuario.persona.centro?.nombre_centro,
        sede: usuario.persona.sede?.nombre_sede,
        ficha: usuario.persona.ficha?.numero_ficha,
        jornada: usuario.persona.jornada,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { numero_documento, username, password, rol, ...personaData } = registerDto;

    // Verificar si ya existe
    const existingPersona = await this.personaRepository.findOne({
      where: { numero_documento },
    });

    if (existingPersona) {
      throw new BadRequestException('Ya existe una persona con este documento');
    }

    const existingUser = await this.usuarioRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new BadRequestException('El username ya está en uso');
    }

    // Buscar rol
    const rolEntity = await this.rolRepository.findOne({
      where: { nombre_rol: rol, estado: 'activo' },
    });

    if (!rolEntity) {
      throw new BadRequestException('Rol inválido');
    }

    // Crear persona
    const persona = this.personaRepository.create({
      numero_documento,
      ...personaData,
    });
    const savedPersona = await this.personaRepository.save(persona);

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 12);
    const usuario = this.usuarioRepository.create({
      id_persona: savedPersona.id_persona,
      id_rol: rolEntity.id_rol,
      username,
      password_hash: hashedPassword,
    });

    await this.usuarioRepository.save(usuario);

    return { message: 'Usuario creado exitosamente' };
  }

  private async incrementarIntentosFallidos(usuario: Usuario) {
    const intentos = usuario.intentos_fallidos + 1;
    const updateData: any = { intentos_fallidos: intentos };

    // Bloquear después de 5 intentos por 30 minutos
    if (intentos >= 5) {
      updateData.bloqueado_hasta = new Date(Date.now() + 30 * 60 * 1000);
      updateData.estado = 'bloqueado';
    }

    await this.usuarioRepository.update(usuario.id_usuario, updateData);
  }

  async validateUser(payload: any) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: payload.sub, estado: 'activo' },
      relations: ['persona', 'rol'],
    });

    if (!usuario) {
      throw new UnauthorizedException();
    }

    return {
      id: usuario.id_usuario,
      username: usuario.username,
      rol: usuario.rol.nombre_rol,
      persona: usuario.persona,
    };
  }
}