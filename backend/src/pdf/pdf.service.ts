// 📁 backend/src/pdf/pdf.service.ts - SERVICIO COMPLETO UNIFICADO
// ====================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { Voto } from '../votes/entities/voto.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';
import * as fs from 'fs';
import * as path from 'path';

// Usar las mismas importaciones que funcionan
const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Eleccion)
    private eleccionRepository: Repository<Eleccion>,
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
    @InjectRepository(Voto)
    private votoRepository: Repository<Voto>,
    @InjectRepository(VotanteHabilitado)
    private votanteHabilitadoRepository: Repository<VotanteHabilitado>,
  ) {}

  private getDefaultSenaLogo(): string {
    const defaultSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
      <rect width="100" height="60" fill="white" stroke="black" stroke-width="2"/>
      <circle cx="50" cy="20" r="8" fill="black"/>
      <text x="50" y="35" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold">SENA</text>
    </svg>`;
    
    return Buffer.from(defaultSvg).toString('base64');
  }

  private async getSenaLogoBase64(): Promise<string> {
    try {
      const svgPath = path.join(process.cwd(), 'public', 'sena.svg');
      
      if (!fs.existsSync(svgPath)) {
        console.warn('No se encontró el archivo sena.svg en public/, usando logo por defecto');
        return this.getDefaultSenaLogo();
      }
      
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const base64 = Buffer.from(svgContent).toString('base64');
      
      console.log('Logo SENA cargado desde public/sena.svg');
      return base64;
      
    } catch (error) {
      console.error('Error cargando logo SENA:', error);
      return this.getDefaultSenaLogo();
    }
  }

  // Usar el mismo método getBrowser que funciona
  private async getBrowser() {
    console.log('Iniciando browser con Chromium remoto...');
    
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (isProduction) {
        console.log('Modo producción: usando Chromium remoto');
        
        return puppeteer.launch({
          args: [
            ...chromium.args,
            '--hide-scrollbars',
            '--disable-web-security',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--memory-pressure-off',
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar'
          ),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
      } else {
        console.log('Modo desarrollo: usando Puppeteer local');
        const puppeteerLocal = require('puppeteer');
        
        return puppeteerLocal.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        });
      }
    } catch (error) {
      console.error('Error lanzando browser:', error);
      throw new Error(`Error iniciando browser: ${error.message}`);
    }
  }

  // MÉTODO PRINCIPAL - DETECTA EL TIPO DE ELECCIÓN Y GENERA EL ACTA CORRESPONDIENTE
  async generateActaEleccion(electionId: number, instructorName: string): Promise<Buffer> {
    console.log('=== GENERANDO ACTA DE ELECCIÓN ===');
    console.log('Election ID:', electionId);
    console.log('Instructor:', instructorName);

    // 1. Obtener datos de la elección
    const eleccion = await this.eleccionRepository.findOne({
      where: { id_eleccion: electionId },
      relations: ['tipoEleccion', 'centro', 'sede', 'ficha', 'candidatos', 'candidatos.persona'],
    });

    if (!eleccion) {
      throw new NotFoundException('Elección no encontrada');
    }

    if (eleccion.estado !== 'finalizada') {
      throw new NotFoundException('Solo se pueden generar actas de elecciones finalizadas');
    }

    console.log('Tipo de elección:', eleccion.tipoEleccion?.nombre_tipo);

    // 2. Obtener estadísticas mejoradas (incluye segundo lugar para representantes)
    const stats = await this.getElectionStatsForActa(electionId);

    // 3. Generar HTML según el tipo de elección
    let htmlContent: string;
    
    if (eleccion.tipoEleccion?.nombre_tipo === 'REPRESENTANTE_CENTRO') {
      console.log('Generando acta para REPRESENTANTE DE CENTRO');
      htmlContent = await this.generateActaRepresentanteCentroHTML(eleccion, stats, instructorName);
    } else {
      console.log('Generando acta para VOCERO DE FICHA (formato original)');
      htmlContent = await this.generateActaVoceroFichaHTML(eleccion, stats, instructorName);
    }

    // 4. Convertir HTML a PDF usando el método que funciona
    const pdfBuffer = await this.convertHtmlToPdf(htmlContent);

    return pdfBuffer;
  }

  // ESTADÍSTICAS MEJORADAS - INCLUYE SEGUNDO LUGAR
  private async getElectionStatsForActa(electionId: number) {
    const totalVotantes = await this.votanteHabilitadoRepository.count({
      where: { id_eleccion: electionId },
    });

    const totalVotos = await this.votoRepository.count({
      where: { id_eleccion: electionId },
    });

    const votosBlanco = await this.votoRepository.count({
      where: { id_eleccion: electionId, id_candidato: null },
    });

    // Obtener TODOS los candidatos ordenados por votos
    const candidatosConVotos = await this.candidatoRepository.find({
      where: { id_eleccion: electionId, estado: 'validado' },
      relations: ['persona'],
      order: { votos_recibidos: 'DESC' },
    });

    const ganador = candidatosConVotos[0] || null;
    const segundoLugar = candidatosConVotos[1] || null; // NUEVO

    // Array detallado de candidatos con sus votos
    const candidatosDetallados = candidatosConVotos.map((candidato, index) => ({
      posicion: index + 1,
      nombre: `${candidato.persona.nombres} ${candidato.persona.apellidos}`,
      documento: candidato.persona.numero_documento,
      email: candidato.persona.email,
      telefono: candidato.persona.telefono,
      numeroLista: candidato.numero_lista,
      votosRecibidos: candidato.votos_recibidos,
      porcentajeVotos: totalVotos > 0 ? ((candidato.votos_recibidos / totalVotos) * 100).toFixed(2) : '0.00'
    }));

    return {
      totalVotantes,
      totalVotos,
      votosBlanco,
      ganador,
      segundoLugar, // NUEVO
      candidatosDetallados, // NUEVO
      porcentajeParticipacion: totalVotantes > 0 ? (totalVotos / totalVotantes) * 100 : 0,
    };
  }

  // TEMPLATE ORIGINAL PARA VOCERO DE FICHA (BASADO EN TU CÓDIGO QUE FUNCIONA)
  async generateActaVoceroFichaHTML(eleccion: any, stats: any, instructorName: string): Promise<string> {
    // Formatear fechas (igual que tu código original)
    const fechaActual = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const fechaInicio = new Date(eleccion.fecha_inicio).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const fechaFin = new Date(eleccion.fecha_fin).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const horaActual = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const lugar = 'Centro Nacional Colombo Alemán; Bienestar al aprendiz';
    const tema = 'ELECCIÓN DE LÍDER';

    // Obtener nombre del programa (igual que tu código)
    let nombrePrograma = 'Programa de Formación';
    if (eleccion.ficha?.nombre_programa) {
      nombrePrograma = eleccion.ficha.nombre_programa.toUpperCase();
    } else if (eleccion.sede?.nombre_sede) {
      nombrePrograma = eleccion.sede.nombre_sede.toUpperCase();
    } else if (eleccion.centro?.nombre_centro) {
      nombrePrograma = eleccion.centro.nombre_centro.toUpperCase();
    }

    // Información del ganador (igual que tu código)
    const ganador = stats.ganador;
    const nombreGanador = ganador ? `${ganador.persona.nombres} ${ganador.persona.apellidos}` : '';
    const documentoGanador = ganador ? ganador.persona.numero_documento : '';
    const emailGanador = ganador ? ganador.persona.email : '';
    const telefonoGanador = ganador ? ganador.persona.telefono : '';

    // USAR TU HTML EXACTO (que funciona) con pequeñas mejoras
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acta de Elección de Líder - SENA</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.1;
            margin: 0;
            padding: 15px;
            background: white;
        }
        .container {
            max-width: 210mm;
            margin: 0 auto;
            border: 2px solid black;
        }
        
        /* ENCABEZADO EXACTO */
        .header {
            border-bottom: 2px solid black;
            padding: 8px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            height: 70px;
        }
        .sena-logo {
            width: 100px;
            height: 60px;
            border: 2px solid black;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 8px;
            text-align: center;
            line-height: 1;
            padding: 4px;
        }
        .sena-svg {
            width: 50px;
            height: 35px;
            margin-bottom: 2px;
        }
        .sena-title {
            font-size: 16px;
            font-weight: bold;
            margin: 2px 0;
        }
        .sena-subtitle {
            font-size: 6px;
            line-height: 0.9;
            margin-top: 3px;
        }
        .acta-numero {
            font-weight: bold;
            font-size: 14px;
            align-self: center;
        }

        /* SECCIONES */
        .section {
            border-bottom: 2px solid black;
        }
        .section-title {
            background: black;
            color: white;
            text-align: center;
            font-weight: bold;
            padding: 6px;
            font-size: 11px;
        }
        .section-content {
            padding: 8px;
        }

        /* TABLAS DE INFORMACIÓN */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            border: 1px solid black;
            padding: 4px;
            font-size: 10px;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            background: #f0f0f0;
            width: 120px;
        }

        /* TABLA DE ASISTENTES - PÁGINA 2 */
        .asistentes-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
        }
        .asistentes-table th {
            border: 1px solid black;
            padding: 4px;
            font-size: 10px;
            font-weight: bold;
            text-align: center;
            background: #f0f0f0;
            height: 20px;
        }
        .asistentes-table td {
            border: 1px solid black;
            padding: 2px 4px;
            font-size: 9px;
            height: 18px;
            vertical-align: middle;
        }

        /* OBJETIVO */
        .objetivo-text {
            text-align: justify;
            line-height: 1.2;
            margin: 8px 0;
        }

        /* DESARROLLO */
        .desarrollo-text {
            margin: 8px 0;
            line-height: 1.3;
        }
        .filled-field {
            border-bottom: 1px solid black;
            display: inline-block;
            min-width: 80px;
            height: 12px;
            margin: 0 3px;
            text-align: center;
            font-weight: bold;
        }

        /* REQUISITOS */
        .requisitos-list {
            margin: 8px 0;
            padding-left: 15px;
        }
        .requisitos-list li {
            margin-bottom: 6px;
            text-align: justify;
            line-height: 1.2;
        }

        /* FIRMAS */
        .firmas-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .firma-box {
            text-align: center;
            width: 250px;
        }
        .firma-line {
            border-bottom: 2px solid black;
            height: 2px;
            margin-bottom: 5px;
        }

        /* PÁGINA */
        .page-footer {
            text-align: right;
            margin-top: 15px;
            font-size: 9px;
            font-weight: bold;
        }

        /* SALTO DE PÁGINA */
        .page-break {
            page-break-before: always;
        }

        /* NUEVOS ESTILOS PARA RESULTADOS */
        .resultados-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .resultados-table th,
        .resultados-table td {
            border: 1px solid black;
            padding: 6px;
            text-align: center;
            font-size: 10px;
        }
        .resultados-table th {
            background: #f0f0f0;
            font-weight: bold;
        }
        .ganador-row {
            background: #d4edda;
            font-weight: bold;
        }
        .segundo-lugar-row {
            background: #fff3cd;
        }
    </style>
</head>
<body>
    <!-- ========== PÁGINA 1 ========== -->
    <div class="container">
        
        <!-- ENCABEZADO EXACTO -->
        <div class="header">
            <div class="sena-logo">
                <img src="data:image/svg+xml;base64,${await this.getSenaLogoBase64()}" class="sena-svg" alt="SENA Logo" />
                <div class="sena-subtitle">
                    SISTEMA INTEGRADO DE MEJORA<br>
                    CONTINUA INSTITUCIONAL
                </div>
            </div>
            <div class="acta-numero">ACTA N° ${eleccion.id_eleccion}</div>
        </div>

        <!-- ELECCIÓN DE LÍDER -->
        <div class="section">
            <div class="section-title">ELECCIÓN DE LÍDER</div>
            <div class="section-content">
                <table class="info-table">
                    <tr>
                        <td class="info-label">CIUDAD Y FECHA:</td>
                        <td style="width: 300px;">Barranquilla, ${fechaActual}</td>
                        <td class="info-label">FECHA DE INICIO:</td>
                        <td style="width: 120px;">${fechaInicio}</td>
                        <td class="info-label">FECHA DE TERMINACIÓN:</td>
                        <td style="width: 120px;">${fechaFin}</td>
                    </tr>
                    <tr>
                        <td class="info-label">LUGAR:</td>
                        <td colspan="5">${lugar}</td>
                    </tr>
                    <tr>
                        <td class="info-label">TEMA:</td>
                        <td colspan="5">${tema}</td>
                    </tr>
                </table>
                
                <div style="margin-top: 12px;">
                    <strong>OBJETIVO DE LA REUNIÓN:</strong>
                    <div class="objetivo-text">
                        Aplicar el artículo 45 del Capítulo XII del Reglamento del Aprendiz SENA, donde se pide la elección de los Voceros de Programas teniendo en cuenta su capacidad de trabajo en equipo, colaboración, manejo de la información, liderazgo, polivalencia, iniciativa y actitudes que beneficien el desarrollo del Programa de Formación y de la Comunidad Educativa.
                    </div>
                </div>
            </div>
        </div>

        <!-- DESARROLLO DE LA REUNIÓN -->
        <div class="section">
            <div class="section-title">DESARROLLO DE LA REUNIÓN</div>
            <div class="section-content">
                <div style="margin-bottom: 8px;">
                    <strong>VERIFICACIÓN DE QUÓRUM:</strong>
                </div>
                <div class="desarrollo-text">
                    Siendo las <span class="filled-field">${horaActual}</span> del día <span class="filled-field">${fechaActual}</span>, se reunieron el Instructor <span class="filled-field">${instructorName}</span> y los (<span class="filled-field">${stats.totalVotantes}</span>) Aprendices del Programa <span class="filled-field">${nombrePrograma}</span> de la ficha <span class="filled-field">${eleccion.ficha?.numero_ficha || 'N/A'}</span> para realizar la elección de líder (X) o la ratificación del líder ( ).
                </div>
                
                <!-- NUEVA SECCIÓN: RESULTADOS DE VOTACIÓN -->
                <div style="margin-top: 15px;">
                    <strong>RESULTADOS DE LA VOTACIÓN:</strong>
                    <table class="resultados-table">
                        <thead>
                            <tr>
                                <th>N° Lista</th>
                                <th>Candidato</th>
                                <th>Documento</th>
                                <th>Votos</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.candidatosDetallados.map((candidato, index) => `
                            <tr class="${index === 0 ? 'ganador-row' : index === 1 ? 'segundo-lugar-row' : ''}">
                                <td>${candidato.numeroLista}</td>
                                <td>${candidato.nombre}</td>
                                <td>${candidato.documento}</td>
                                <td>${candidato.votosRecibidos}</td>
                                <td>${candidato.porcentajeVotos}%</td>
                            </tr>
                            `).join('')}
                            <tr style="background: #f8f9fa;">
                                <td colspan="3"><strong>Votos en Blanco</strong></td>
                                <td><strong>${stats.votosBlanco}</strong></td>
                                <td><strong>${stats.totalVotos > 0 ? ((stats.votosBlanco / stats.totalVotos) * 100).toFixed(2) : '0.00'}%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 10px;">
                        <strong>Resumen:</strong> Total votantes: ${stats.totalVotantes} | Total votos: ${stats.totalVotos} | Participación: ${stats.porcentajeParticipacion.toFixed(2)}%
                    </div>
                </div>
            </div>
        </div>

        <!-- REQUISITOS Y CONDICIONES -->
        <div class="section">
            <div class="section-title">REQUISITOS Y CONDICIONES PARA SER VOCEROS DE PROGRAMA</div>
            <div class="section-content">
                <ol type="a" class="requisitos-list">
                    <li>Ser postulado por los aprendices del mismo Programa.</li>
                    <li>Tener disponibilidad para trabajar en equipo con los representantes de Centro y demás integrantes de la comunidad educativa se requiere.</li>
                    <li>Conocer y aplicar los temas de la inducción y demostrar interés por su cumplimiento a nivel personal y grupal.</li>
                    <li>Actuar de acuerdo con lo estipulado en el presente Reglamento y tener buenas relaciones interpersonales con los integrantes de la Comunidad Educativa.</li>
                    <li>Tener cualidades y capacidades de líder y una actitud crítica y constructiva.</li>
                    <li>Cumplir con las responsabilidades como vocero de programa sin descuidar las obligaciones del proceso de aprendizaje</li>
                </ol>
            </div>
        </div>

        <!-- CONCLUSIONES -->
        <div class="section" style="border-bottom: none;">
            <div class="section-title">CONCLUSIONES</div>
            <div class="section-content">
                <div style="margin: 25px 0; line-height: 1.5; text-align: justify;">
                    <strong>VOCERO ELEGIDO:</strong><br>
                    Fue elegido el aprendiz <strong>${nombreGanador}</strong> con el D.I <strong>${documentoGanador}</strong> correo electrónico <strong>${emailGanador}</strong> número de teléfono <strong>${telefonoGanador}</strong>
                </div>
                
                ${stats.segundoLugar ? `
                <div style="margin: 15px 0; line-height: 1.5; text-align: justify;">
                    <strong>SEGUNDO LUGAR:</strong><br>
                    El segundo lugar fue para el aprendiz <strong>${stats.segundoLugar.persona.nombres} ${stats.segundoLugar.persona.apellidos}</strong> con <strong>${stats.segundoLugar.votos_recibidos} votos</strong>.
                </div>
                ` : ''}
            </div>
        </div>
    </div>
    
    <div class="page-footer">
        Página 1 de 2
    </div>

    <!-- ========== PÁGINA 2 ========== -->
    <div class="page-break"></div>
    
    <div class="container">
        <!-- ENCABEZADO PÁGINA 2 -->
        <div class="header">
            <div class="sena-logo">
                <img src="data:image/svg+xml;base64,${await this.getSenaLogoBase64()}" class="sena-svg" alt="SENA Logo" />
                <div class="sena-subtitle">
                    SISTEMA INTEGRADO DE MEJORA<br>
                    CONTINUA INSTITUCIONAL
                </div>
            </div>
            <div class="acta-numero">ACTA N° ${eleccion.id_eleccion}</div>
        </div>

        <!-- TABLA DE ASISTENTES -->
        <div class="section" style="border-bottom: none;">
            <div class="section-title">ASISTENTES</div>
            <div class="section-content" style="padding: 0;">
                <table class="asistentes-table">
                    <thead>
                        <tr>
                            <th style="width: 40%;">NOMBRE</th>
                            <th style="width: 30%;">DOCUMENTO DE IDENTIDAD</th>
                            <th style="width: 30%;">FIRMA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from({ length: 35 }, (_, i) => `
                        <tr>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- FIRMAS DEL INSTRUCTOR Y BIENESTAR -->
        <div class="firmas-section">
            <div class="firma-box">
                <div class="firma-line"></div>
                <div style="font-weight: bold; font-size: 11px;">Firma Instructor</div>
            </div>
            <div class="firma-box">
                <div class="firma-line"></div>
                <div style="font-weight: bold; font-size: 11px;">Bienestar al Aprendiz</div>
            </div>
        </div>
    </div>

    <div class="page-footer">
        Página 2 de 2
    </div>
</body>
</html>`;
  }

  // NUEVO TEMPLATE PARA REPRESENTANTE DE CENTRO
  async generateActaRepresentanteCentroHTML(eleccion: any, stats: any, instructorName: string): Promise<string> {
    const fechaActual = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const fechaInicio = new Date(eleccion.fecha_inicio).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const fechaFin = new Date(eleccion.fecha_fin).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const horaActual = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const lugar = 'Centro Nacional Colombo Alemán; Bienestar al aprendiz';
    const tema = 'ELECCIÓN DE REPRESENTANTE DE CENTRO';
    const nombreCentro = eleccion.centro?.nombre_centro || 'Centro Nacional Colombo Alemán';
    const jornada = eleccion.jornada || 'Todas las jornadas';

    const ganador = stats.ganador;
    const segundoLugar = stats.segundoLugar;
    
    const nombreGanador = ganador ? `${ganador.persona.nombres} ${ganador.persona.apellidos}` : 'Sin ganador';
    const documentoGanador = ganador ? ganador.persona.numero_documento : '';
    const votosGanador = ganador ? ganador.votos_recibidos : 0;

    const nombreSegundoLugar = segundoLugar ? `${segundoLugar.persona.nombres} ${segundoLugar.persona.apellidos}` : 'No aplica';
    const documentoSegundoLugar = segundoLugar ? segundoLugar.persona.numero_documento : '';
    const votosSegundoLugar = segundoLugar ? segundoLugar.votos_recibidos : 0;

    // Usar la misma estructura base que el template de voceros pero con contenido específico
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acta de Elección Representante de Centro - SENA</title>
    <style>
        /* Usar los mismos estilos que el template de voceros */
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.1;
            margin: 0;
            padding: 15px;
            background: white;
        }
        .container {
            max-width: 210mm;
            margin: 0 auto;
            border: 2px solid black;
        }
        .header {
            border-bottom: 2px solid black;
            padding: 8px;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            height: 70px;
        }
        .sena-logo {
            width: 100px;
            height: 60px;
            border: 2px solid black;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 8px;
            text-align: center;
            line-height: 1;
            padding: 4px;
        }
        .sena-svg {
            width: 50px;
            height: 35px;
            margin-bottom: 2px;
        }
        .sena-subtitle {
            font-size: 6px;
            line-height: 0.9;
            margin-top: 3px;
        }
        .acta-numero {
            font-weight: bold;
            font-size: 14px;
            align-self: center;
        }
        .section {
            border-bottom: 2px solid black;
        }
        .section-title {
            background: black;
            color: white;
            text-align: center;
            font-weight: bold;
            padding: 6px;
            font-size: 11px;
        }
        .section-content {
            padding: 8px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }
        .info-table td {
            border: 1px solid black;
            padding: 4px;
            font-size: 10px;
            vertical-align: top;
        }
        .info-label {
            font-weight: bold;
            background: #f0f0f0;
            width: 120px;
        }
        .objetivo-text {
            text-align: justify;
            line-height: 1.2;
            margin: 8px 0;
        }
        .desarrollo-text {
            margin: 8px 0;
            line-height: 1.3;
        }
        .filled-field {
            border-bottom: 1px solid black;
            display: inline-block;
            min-width: 80px;
            height: 12px;
            margin: 0 3px;
            text-align: center;
            font-weight: bold;
        }
        .resultados-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .resultados-table th,
        .resultados-table td {
            border: 1px solid black;
            padding: 6px;
            text-align: center;
            font-size: 10px;
        }
        .resultados-table th {
            background: #f0f0f0;
            font-weight: bold;
        }
        .ganador-row {
            background: #d4edda;
            font-weight: bold;
        }
        .segundo-lugar-row {
            background: #fff3cd;
        }
        .page-footer {
            text-align: right;
            margin-top: 15px;
            font-size: 9px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- ENCABEZADO -->
        <div class="header">
            <div class="sena-logo">
                <img src="data:image/svg+xml;base64,${await this.getSenaLogoBase64()}" class="sena-svg" alt="SENA Logo" />
                <div class="sena-subtitle">
                    SISTEMA INTEGRADO DE MEJORA<br>
                    CONTINUA INSTITUCIONAL
                </div>
            </div>
            <div class="acta-numero">ACTA N° ${eleccion.id_eleccion}</div>
        </div>

        <!-- ELECCIÓN DE REPRESENTANTE DE CENTRO -->
        <div class="section">
            <div class="section-title">ELECCIÓN DE REPRESENTANTE DE CENTRO</div>
            <div class="section-content">
                <table class="info-table">
                    <tr>
                        <td class="info-label">CIUDAD Y FECHA:</td>
                        <td style="width: 300px;">Barranquilla, ${fechaActual}</td>
                        <td class="info-label">FECHA DE INICIO:</td>
                        <td style="width: 120px;">${fechaInicio}</td>
                        <td class="info-label">FECHA DE TERMINACIÓN:</td>
                        <td style="width: 120px;">${fechaFin}</td>
                    </tr>
                    <tr>
                        <td class="info-label">LUGAR:</td>
                        <td colspan="5">${lugar}</td>
                    </tr>
                    <tr>
                        <td class="info-label">TEMA:</td>
                        <td colspan="5">${tema}</td>
                    </tr>
                    <tr>
                        <td class="info-label">CENTRO:</td>
                        <td colspan="2">${nombreCentro}</td>
                        <td class="info-label">JORNADA:</td>
                        <td colspan="2">${jornada}</td>
                    </tr>
                </table>
                
                <div style="margin-top: 12px;">
                    <strong>OBJETIVO DE LA REUNIÓN:</strong>
                    <div class="objetivo-text">
                        Aplicar el artículo correspondiente del Reglamento del Aprendiz SENA para la elección del Representante de Centro, 
                        teniendo en cuenta la capacidad de liderazgo, trabajo en equipo, manejo de la información, iniciativa y actitudes 
                        que beneficien el desarrollo de la Comunidad Educativa del ${nombreCentro}.
                    </div>
                </div>
            </div>
        </div>

        <!-- DESARROLLO DE LA REUNIÓN -->
        <div class="section">
            <div class="section-title">DESARROLLO DE LA REUNIÓN</div>
            <div class="section-content">
                <div style="margin-bottom: 8px;">
                    <strong>VERIFICACIÓN DE QUÓRUM:</strong>
                </div>
                <div class="desarrollo-text">
                    Siendo las <span class="filled-field">${horaActual}</span> del día <span class="filled-field">${fechaActual}</span>, 
                    se reunieron los aprendices del ${nombreCentro} 
                    para realizar la elección de Representante de Centro en la jornada ${jornada}.
                </div>
                
                <!-- RESULTADOS DE VOTACIÓN -->
                <div style="margin-top: 15px;">
                    <strong>RESULTADOS DE LA VOTACIÓN:</strong>
                    <table class="resultados-table">
                        <thead>
                            <tr>
                                <th>N° Lista</th>
                                <th>Candidato</th>
                                <th>Numero de lista</th>
                                <th>Votos</th>
                                <th>Porcentaje</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.candidatosDetallados.map((candidato, index) => `
                            <tr class="${index === 0 ? 'ganador-row' : index === 1 ? 'segundo-lugar-row' : ''}">
                                <td>${candidato.numeroLista}</td>
                                <td>${candidato.nombre}</td>
                                <td>${candidato.documento}</td>
                                <td>${candidato.votosRecibidos}</td>
                                <td>${candidato.porcentajeVotos}%</td>
                            </tr>
                            `).join('')}
                            <tr style="background: #f8f9fa;">
                                <td colspan="3"><strong>Votos en Blanco</strong></td>
                                <td><strong>${stats.votosBlanco}</strong></td>
                                <td><strong>${stats.totalVotos > 0 ? ((stats.votosBlanco / stats.totalVotos) * 100).toFixed(2) : '0.00'}%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 10px;">
                        <strong>Resumen:</strong> Total votantes: ${stats.totalVotantes} | Total votos: ${stats.totalVotos} | Participación: ${stats.porcentajeParticipacion.toFixed(2)}%
                    </div>
                </div>
            </div>
        </div>

        <!-- CONCLUSIONES -->
        <div class="section" style="border-bottom: none;">
            <div class="section-title">CONCLUSIONES</div>
            <div class="section-content">
                <div style="margin: 25px 0; line-height: 1.5; text-align: justify;">
                    <strong>REPRESENTANTE ELEGIDO:</strong><br>
                    Fue elegido como Representante de Centro el aprendiz <strong>${nombreGanador}</strong> 
                    con el D.I <strong>${documentoGanador}</strong>, quien obtuvo <strong>${votosGanador} votos</strong>.
                </div>
                
                ${segundoLugar ? `
                <div style="margin: 15px 0; line-height: 1.5; text-align: justify;">
                    <strong>SEGUNDO LUGAR:</strong><br>
                    El segundo lugar fue para el aprendiz <strong>${nombreSegundoLugar}</strong> 
                    con el D.I <strong>${documentoSegundoLugar}</strong>, quien obtuvo <strong>${votosSegundoLugar} votos</strong>.
                </div>
                ` : ''}
            </div>
        </div>
    </div>
    
    <div class="page-footer">
        Página 1 de 1
    </div>
</body>
</html>`;
  }

  // MÉTODO convertHtmlToPdf - USAR EL QUE FUNCIONA SIN MODIFICACIONES
  private async convertHtmlToPdf(htmlContent: string): Promise<Buffer> {
    console.log('Iniciando conversión HTML a PDF con Chromium remoto...');
    
    let browser = null;
    
    try {
      browser = await this.getBrowser();
      console.log('Browser lanzado exitosamente');
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      const pdfBuffer = Buffer.from(pdfUint8Array);
      console.log('PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
      
      return pdfBuffer;

    } catch (error) {
      console.error('Error en la conversión HTML a PDF:', error);
      throw new Error(`Error generando PDF: ${error.message}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('Browser cerrado');
        } catch (closeError) {
          console.error('Error cerrando browser:', closeError);
        }
      }
    }
  }
}