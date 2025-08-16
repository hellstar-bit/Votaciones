//📁 backend/src/pdf/pdf.service.ts
// ====================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { Buffer } from 'buffer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { Eleccion } from '../elections/entities/eleccion.entity';
import { Candidato } from '../candidates/entities/candidato.entity';
import { Voto } from '../votes/entities/voto.entity';
import { VotanteHabilitado } from '../votes/entities/votante-habilitado.entity';

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

  async generateActaEleccion(electionId: number, instructorName: string): Promise<Buffer> {
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

    // 2. Obtener estadísticas de la elección
    const stats = await this.getElectionStatsForActa(electionId);

    // 3. Generar HTML del acta
    const htmlContent = this.generateActaHTML(eleccion, stats, instructorName);

    // 4. Convertir HTML a PDF
    const pdfBuffer = await this.convertHtmlToPdf(htmlContent);

    return pdfBuffer;
  }

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

    // Obtener candidato ganador
    const candidatosConVotos = await this.candidatoRepository.find({
      where: { id_eleccion: electionId, estado: 'validado' },
      relations: ['persona'],
      order: { votos_recibidos: 'DESC' },
    });

    const ganador = candidatosConVotos[0] || null;

    return {
      totalVotantes,
      totalVotos,
      votosBlanco,
      ganador,
      porcentajeParticipacion: totalVotantes > 0 ? (totalVotos / totalVotantes) * 100 : 0,
    };
  }

  private generateActaHTML(eleccion: any, stats: any, instructorName: string): string {
    // Formatear fechas
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

    // Determinar ubicación
    let ubicacion = '';
    if (eleccion.centro) {
      ubicacion = eleccion.centro.nombre_centro;
    } else if (eleccion.sede) {
      ubicacion = eleccion.sede.nombre_sede;
    } else if (eleccion.ficha) {
      ubicacion = `Ficha ${eleccion.ficha.numero_ficha}`;
    }

    // Información del ganador
    const ganador = stats.ganador;
    const nombreGanador = ganador ? `${ganador.persona.nombres} ${ganador.persona.apellidos}` : '';
    const documentoGanador = ganador ? ganador.persona.numero_documento : '';
    const emailGanador = ganador ? ganador.persona.email : '';
    const telefonoGanador = ganador ? ganador.persona.telefono : '';

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

        /* CONCLUSIONES */
        .filled-line {
            border-bottom: 1px solid black;
            display: inline-block;
            height: 15px;
            margin: 0 5px;
            text-align: center;
            font-weight: bold;
            padding: 0 5px;
        }

        /* PÁGINA */
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
        
        <!-- ENCABEZADO EXACTO -->
        <div class="header">
            <div class="sena-logo">
                <div style="font-size: 20px; margin-bottom: 2px;">●</div>
                <div class="sena-title">SENA</div>
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
                        <td colspan="5">${ubicacion}; Bienestar al aprendiz</td>
                    </tr>
                    <tr>
                        <td class="info-label">TEMA:</td>
                        <td colspan="5">${eleccion.tipoEleccion.descripcion.toUpperCase()}</td>
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
                    Siendo las <span class="filled-field">08:00</span> del día <span class="filled-field">${fechaActual}</span>, se reunieron el Instructor <span class="filled-field">${instructorName}</span> y los (<span class="filled-field">${stats.totalVotantes}</span>) Aprendices del Programa <span class="filled-field">${eleccion.titulo}</span> de la ficha <span class="filled-field">${eleccion.ficha?.numero_ficha || 'N/A'}</span> para realizar la elección de líder (X) o la ratificación del líder ( ).
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
                <div style="margin: 25px 0 15px 0; line-height: 1.5;">
                    Fue elegido el aprendiz <span class="filled-line" style="width: 350px;">${nombreGanador}</span>
                </div>
                
                <div style="margin: 15px 0; line-height: 1.5;">
                    con <span class="filled-line" style="width: 80px;">${stats.ganador?.votos_recibidos || 0}</span> el <span class="filled-line" style="width: 200px;">${documentoGanador}</span> D.I. <span class="filled-line" style="width: 150px;">${emailGanador.split('@')[0]}</span> Correo <span class="filled-line" style="width: 120px;">${emailGanador.split('@')[1] || ''}</span> Electrónico
                </div>
                
                <div style="margin: 15px 0; line-height: 1.5;">
                    <span class="filled-line" style="width: 300px;">${nombreGanador}</span>, número de teléfono <span class="filled-line" style="width: 150px;">${telefonoGanador}</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="page-footer">
        Página 1 de 2
    </div>
</body>
</html>
    `;
  }

  private async convertHtmlToPdf(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}
