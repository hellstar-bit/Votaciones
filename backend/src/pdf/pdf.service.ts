// 📁 backend/src/pdf/pdf.service.ts
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
import puppeteer from 'puppeteer';

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="100" height="60">
      <rect width="98" height="58" x="1" y="1" fill="white" stroke="black" stroke-width="2"/>
      <circle cx="50" cy="25" r="10" fill="black"/>
      <text x="50" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="black">SENA</text>
    </svg>`;
    
    return Buffer.from(defaultSvg).toString('base64');
  }

  private async getSenaLogoBase64(): Promise<string> {
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'sena.svg'),
        path.join(process.cwd(), 'dist', 'public', 'sena.svg'),
        path.join(__dirname, '../../public', 'sena.svg'),
        path.join(__dirname, '../../../public', 'sena.svg'),
      ];

      for (const svgPath of possiblePaths) {
        if (fs.existsSync(svgPath)) {
          const svgContent = fs.readFileSync(svgPath, 'utf8');
          const base64 = Buffer.from(svgContent).toString('base64');
          console.log(`✅ Logo SENA cargado desde: ${svgPath}`);
          return base64;
        }
      }
      
      console.warn('⚠️ Archivo sena.svg no encontrado, usando logo por defecto');
      return this.getDefaultSenaLogo();
      
    } catch (error) {
      console.error('❌ Error cargando logo SENA:', error);
      return this.getDefaultSenaLogo();
    }
  }

  // ✅ DETECTAR CHROME AUTOMÁTICAMENTE
  private async detectChromePath(): Promise<string | null> {
    const possiblePaths = [
      // Render.com paths
      '/opt/render/.cache/puppeteer/chrome/linux-139.0.7258.68/chrome-linux64/chrome',
      '/opt/render/.cache/puppeteer/chrome/chrome',
      
      // Standard Linux paths
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      
      // Environment variables
      process.env.PUPPETEER_EXECUTABLE_PATH,
      process.env.CHROME_BIN,
    ].filter(Boolean);

    for (const chromePath of possiblePaths) {
      try {
        if (fs.existsSync(chromePath)) {
          // Verificar que es ejecutable
          await fs.promises.access(chromePath, fs.constants.X_OK);
          console.log(`✅ Chrome ejecutable encontrado: ${chromePath}`);
          return chromePath;
        }
      } catch (error) {
        console.log(`❌ Chrome no ejecutable: ${chromePath}`);
        continue;
      }
    }

    console.warn('⚠️ No se encontró Chrome en ninguna ubicación estándar');
    return null;
  }

  async generateActaEleccion(electionId: number, instructorName: string): Promise<Buffer> {
    console.log('🎯 === GENERANDO ACTA DE ELECCIÓN ===');
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

    // 2. Obtener estadísticas de la elección
    const stats = await this.getElectionStatsForActa(electionId);

    // 3. Generar HTML del acta
    const htmlContent = await this.generateActaHTML(eleccion, stats, instructorName);

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

  private async generateActaHTML(eleccion: any, stats: any, instructorName: string): Promise<string> {
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

    const horaActual = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const lugar = 'Centro Nacional Colombo Alemán; Bienestar al aprendiz';
    const tema = 'ELECCIÓN DE LÍDER';

    // Obtener nombre del programa de formación
    let nombrePrograma = 'Programa de Formación';
    if (eleccion.ficha?.nombre_programa) {
      nombrePrograma = eleccion.ficha.nombre_programa.toUpperCase();
    } else if (eleccion.sede?.nombre_sede) {
      nombrePrograma = eleccion.sede.nombre_sede.toUpperCase();
    } else if (eleccion.centro?.nombre_centro) {
      nombrePrograma = eleccion.centro.nombre_centro.toUpperCase();
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
        
        /* ENCABEZADO */
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

        /* SALTO DE PÁGINA */
        .page-break {
            page-break-before: always;
        }
        .page-footer {
            text-align: center;
            font-size: 9px;
            margin-top: 10px;
            font-weight: bold;
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

        /* TABLA DE ASISTENTES */
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

        /* OBJETIVO Y DESARROLLO */
        .objetivo-text {
            text-align: justify;
            line-height: 1.2;
            margin: 8px 0;
        }
        .desarrollo-text {
            margin: 8px 0;
            line-height: 1.3;
        }

        /* FIRMAS */
        .firmas-section {
            display: flex;
            justify-content: space-around;
            margin-top: 30px;
            padding: 20px 0;
        }
        .firma-box {
            text-align: center;
            width: 200px;
        }
        .firma-line {
            border-bottom: 1px solid black;
            margin-bottom: 5px;
            height: 30px;
        }
    </style>
</head>
<body>
    <!-- ========== PÁGINA 1 ========== -->
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
            <div class="acta-numero">ACTA N° </div>
        </div>

        <!-- INFORMACIÓN GENERAL -->
        <div class="section">
            <div class="section-title">INFORMACIÓN GENERAL</div>
            <div class="section-content">
                <table class="info-table">
                    <tr>
                        <td class="info-label">Fecha:</td>
                        <td><strong>${fechaActual}</strong></td>
                        <td class="info-label">Hora:</td>
                        <td><strong>${horaActual}</strong></td>
                    </tr>
                    <tr>
                        <td class="info-label">Lugar:</td>
                        <td colspan="3"><strong>${lugar}</strong></td>
                    </tr>
                    <tr>
                        <td class="info-label">Tema:</td>
                        <td colspan="3"><strong>${tema}</strong></td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- OBJETIVO -->
        <div class="section">
            <div class="section-title">OBJETIVO</div>
            <div class="section-content">
                <div class="objetivo-text">
                    Llevar a cabo la elección de líder estudiantil para el programa de formación 
                    <strong>${nombrePrograma}</strong>, garantizando un proceso democrático, 
                    transparente y participativo que permita la selección del candidato más idóneo 
                    para representar los intereses y necesidades de los aprendices.
                </div>
            </div>
        </div>

        <!-- DESARROLLO -->
        <div class="section">
            <div class="section-title">DESARROLLO</div>
            <div class="section-content">
                <div class="desarrollo-text">
                    <strong>1. Apertura de la jornada electoral:</strong> El proceso electoral se llevó a cabo 
                    del ${fechaInicio} al ${fechaFin}, utilizando el sistema de votación electrónica del SENA.
                    <br><br>
                    <strong>2. Participación:</strong> De un total de <strong>${stats.totalVotantes}</strong> 
                    aprendices habilitados para votar, participaron <strong>${stats.totalVotos}</strong> 
                    aprendices, representando una participación del <strong>${stats.porcentajeParticipacion.toFixed(1)}%</strong>.
                    <br><br>
                    <strong>3. Resultados:</strong> Se registraron <strong>${stats.votosBlanco}</strong> 
                    votos en blanco. El candidato elegido obtuvo la mayoría de votos válidos.
                    <br><br>
                    <strong>4. Validación:</strong> El proceso fue supervisado por el instructor 
                    <strong>${instructorName}</strong> y el equipo de Bienestar al Aprendiz.
                </div>
            </div>
        </div>

        <!-- CANDIDATO ELEGIDO -->
        <div class="section">
            <div class="section-title">CANDIDATO ELEGIDO</div>
            <div class="section-content">
                <table class="info-table">
                    <tr>
                        <td class="info-label">Nombre Completo:</td>
                        <td><strong>${nombreGanador}</strong></td>
                    </tr>
                    <tr>
                        <td class="info-label">Documento:</td>
                        <td><strong>${documentoGanador}</strong></td>
                    </tr>
                    <tr>
                        <td class="info-label">Email:</td>
                        <td><strong>${emailGanador}</strong></td>
                    </tr>
                    <tr>
                        <td class="info-label">Teléfono:</td>
                        <td><strong>${telefonoGanador}</strong></td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- COMPROMISOS -->
        <div class="section">
            <div class="section-title">COMPROMISOS DEL LÍDER ELEGIDO</div>
            <div class="section-content">
                <div class="desarrollo-text">
                    El líder elegido se compromete a:
                    <br>• Representar dignamente a sus compañeros aprendices
                    <br>• Promover la participación activa en las actividades formativas
                    <br>• Servir como canal de comunicación entre aprendices e instructores
                    <br>• Fomentar el trabajo en equipo y la colaboración
                    <br>• Apoyar las iniciativas de mejora continua del programa
                </div>
            </div>
        </div>

        <!-- FIRMAS -->
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
            <div class="acta-numero">ACTA N° </div>
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
</html>
    `;
  }

  private async convertHtmlToPdf(htmlContent: string): Promise<Buffer> {
    console.log('🔄 Iniciando conversión HTML a PDF...');
    
    let browser = null;
    
    try {
      // Detectar Chrome automáticamente
      const chromePath = await this.detectChromePath();
      
      const browserConfig: any = {
        headless: true,
        timeout: 60000, // Aumentar timeout a 60 segundos
        args: [
          // Argumentos esenciales para entornos containerizados
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          
          // Optimizaciones de memoria y rendimiento
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          
          // Configuraciones adicionales para estabilidad
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-sync',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--disable-background-networking',
          '--disable-component-update',
          '--disable-domain-reliability',
          '--disable-features=VizDisplayCompositor',
        ],
        defaultViewport: { width: 1200, height: 800 },
      };

      // Si encontramos Chrome, usarlo
      if (chromePath) {
        browserConfig.executablePath = chromePath;
      }

      console.log('🚀 Configuración del browser:', {
        executablePath: chromePath || 'bundled',
        headless: true,
        platform: process.platform,
        arch: process.arch
      });

      browser = await puppeteer.launch(browserConfig);
      console.log('✅ Browser Puppeteer lanzado exitosamente');
      
      const page = await browser.newPage();
      
      // Configurar el viewport para PDF
      await page.setViewport({ width: 1200, height: 800 });
      
      // Configurar timeouts extendidos
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(60000);
      
      console.log('📄 Configurando contenido HTML...');
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });

      console.log('📄 Generando PDF...');
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
        timeout: 60000,
        preferCSSPageSize: true
      });

      const pdfBuffer = Buffer.from(pdfUint8Array);
      console.log('✅ PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');
      
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error en la conversión HTML a PDF:', error);
      console.error('Error stack:', error.stack);
      
      // Información adicional para debugging
      console.error('Environment info:');
      console.error('- NODE_ENV:', process.env.NODE_ENV);
      console.error('- Platform:', process.platform);
      console.error('- Architecture:', process.arch);
      console.error('- Puppeteer cache:', process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer');
      
      // Verificar si existen los directorios de Chrome
      const cacheDir = '/opt/render/.cache/puppeteer';
      if (fs.existsSync(cacheDir)) {
        try {
          const contents = fs.readdirSync(cacheDir, { recursive: true });
          console.error('- Cache contents:', contents.slice(0, 10)); // Primeros 10 elementos
        } catch (readError) {
          console.error('- Cannot read cache dir:', readError.message);
        }
      } else {
        console.error('- Cache directory does not exist:', cacheDir);
      }
      
      throw new Error(`Error generando PDF: ${error.message}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('🔒 Browser cerrado');
        } catch (closeError) {
          console.error('⚠️ Error cerrando browser:', closeError);
        }
      }
    }
  }
}