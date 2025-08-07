// 📁 frontend/src/pages/admin/AdminAprendicesPage.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  PencilIcon,
  AcademicCapIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/layout/AdminLayout';
import ImportModal from '../../components/import/importModal';
import { personasApi, fichasApi } from '../../services/api';
import type { Aprendiz, Ficha, ImportResult } from '../../services/api';

interface Filters {
  search: string;
  ficha: string;
  sede: string;
  centro: string;
  jornada: string;
  estado: string;
}

const AdminAprendicesPage = () => {
  // Estados principales
  const [aprendices, setAprendices] = useState<Aprendiz[]>([]);
  const [originalAprendices, setOriginalAprendices] = useState<Aprendiz[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Estados de modales y vistas
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAprendiz, setSelectedAprendiz] = useState<Aprendiz | null>(null);
  const [showAprendizDetails, setShowAprendizDetails] = useState(false);

  // Estados de filtros y paginación
  const [filters, setFilters] = useState<Filters>({
    search: '',
    ficha: '',
    sede: '',
    centro: '',
    jornada: '',
    estado: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Función helper para obtener el estado de un aprendiz de forma segura
  const getAprendizEstado = (aprendiz: Aprendiz): string => {
    if (aprendiz.estado) {
      return aprendiz.estado;
    }
    
    if (aprendiz.ficha && aprendiz.email) {
      return 'activo';
    }
    
    if (!aprendiz.ficha) {
      return 'sin_ficha';
    }
    
    return 'inactivo';
  };

  // Función helper para obtener el color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-red-100 text-red-800';
      case 'egresado':
        return 'bg-blue-100 text-blue-800';
      case 'retirado':
        return 'bg-yellow-100 text-yellow-800';
      case 'sin_ficha':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función helper para formatear el texto del estado
  const formatEstado = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'sin_ficha':
        return 'Sin Ficha';
      default:
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
  };

  // Estadísticas calculadas
  const stats = {
    total: aprendices.length,
    activos: aprendices.filter(a => getAprendizEstado(a) === 'activo').length,
    inactivos: aprendices.filter(a => {
      const estado = getAprendizEstado(a);
      return estado === 'inactivo' || estado === 'sin_ficha';
    }).length,
    fichasUnicas: new Set(aprendices.map(a => a.ficha?.numero_ficha).filter(Boolean)).size,
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [filters, originalAprendices]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [aprendicesData, fichasData] = await Promise.all([
        personasApi.getAprendices(),
        fichasApi.getAll()
      ]);
      
      setOriginalAprendices(aprendicesData);
      setAprendices(aprendicesData);
      setFichas(fichasData);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setSearchLoading(true);
    let filteredData = [...originalAprendices];

    // Filtro de búsqueda
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredData = filteredData.filter(aprendiz =>
        aprendiz.nombres?.toLowerCase().includes(searchTerm) ||
        aprendiz.apellidos?.toLowerCase().includes(searchTerm) ||
        aprendiz.numero_documento?.includes(searchTerm) ||
        aprendiz.email?.toLowerCase().includes(searchTerm) ||
        `${aprendiz.nombres} ${aprendiz.apellidos}`.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por ficha
    if (filters.ficha) {
      filteredData = filteredData.filter(aprendiz => 
        aprendiz.ficha?.id_ficha?.toString() === filters.ficha
      );
    }

    // Filtro por jornada
    if (filters.jornada) {
      filteredData = filteredData.filter(aprendiz => 
        aprendiz.jornada === filters.jornada ||
        aprendiz.ficha?.jornada === filters.jornada
      );
    }

    // Filtro por estado
    if (filters.estado) {
      filteredData = filteredData.filter(aprendiz => {
        const estado = getAprendizEstado(aprendiz);
        return estado === filters.estado;
      });
    }

    setAprendices(filteredData);
    setCurrentPage(1);
    setSearchLoading(false);
  };

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      ficha: '',
      sede: '',
      centro: '',
      jornada: '',
      estado: '',
    });
  };

  const handleImportComplete = (result: ImportResult) => {
    toast.success(`Importación completada: ${result.importedRecords} registros importados`);
    loadInitialData(); // Recargar lista
    setShowImportModal(false);
  };

  const handleViewAprendiz = (aprendiz: Aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setShowAprendizDetails(true);
  };

  const handleExportAprendices = async () => {
    try {
      toast.loading('Generando exportación...', { id: 'export' });
      
      const exportData = aprendices.map(aprendiz => ({
        'Tipo Documento': aprendiz.tipo_documento,
        'Número Documento': aprendiz.numero_documento,
        'Nombres': aprendiz.nombres,
        'Apellidos': aprendiz.apellidos,
        'Email': aprendiz.email || '',
        'Teléfono': aprendiz.telefono || '',
        'Estado': formatEstado(getAprendizEstado(aprendiz)),
        'Ficha': aprendiz.ficha?.numero_ficha || '',
        'Programa': aprendiz.ficha?.nombre_programa || '',
        'Jornada': aprendiz.jornada || aprendiz.ficha?.jornada || '',
        'Sede': aprendiz.sede?.nombre_sede || '',
        'Centro': aprendiz.centro?.nombre_centro || ''
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aprendices_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Archivo exportado exitosamente', { id: 'export' });
    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar datos', { id: 'export' });
    }
  };

  // Paginación
  const totalItems = aprendices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAprendices = aprendices.slice(startIndex, endIndex);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sena-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando aprendices...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sena-100 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6 text-sena-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Aprendices</h1>
              <p className="text-sm text-gray-600">Administra los estudiantes del sistema</p>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportAprendices}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Exportar CSV
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Importar Excel
            </button>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Aprendices</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Activos</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activos}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inactivos</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.inactivos}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Fichas Activas</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.fichasUnicas}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, documento o email..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-sena-500 focus:border-sena-500"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Botón filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filtros
                {showFilters ? (
                  <ChevronUpIcon className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                )}
              </button>
            </div>

            {/* Panel de filtros expandible */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    {/* Filtro por ficha */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ficha
                      </label>
                      <select
                        value={filters.ficha}
                        onChange={(e) => handleFilterChange('ficha', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sena-500 focus:border-sena-500"
                      >
                        <option value="">Todas las fichas</option>
                        {fichas.map((ficha) => (
                          <option key={ficha.id_ficha} value={ficha.id_ficha}>
                            {ficha.numero_ficha} - {ficha.nombre_programa}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por jornada */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jornada
                      </label>
                      <select
                        value={filters.jornada}
                        onChange={(e) => handleFilterChange('jornada', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sena-500 focus:border-sena-500"
                      >
                        <option value="">Todas las jornadas</option>
                        <option value="mixta">Mixta</option>
                        <option value="nocturna">Nocturna</option>
                        <option value="madrugada">Madrugada</option>
                      </select>
                    </div>

                    {/* Filtro por estado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={filters.estado}
                        onChange={(e) => handleFilterChange('estado', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sena-500 focus:border-sena-500"
                      >
                        <option value="">Todos los estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="sin_ficha">Sin Ficha</option>
                        <option value="egresado">Egresado</option>
                        <option value="retirado">Retirado</option>
                      </select>
                    </div>

                    {/* Botón limpiar filtros */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabla de aprendices */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Header de la tabla */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de{' '}
                <span className="font-medium">{totalItems}</span> aprendices
                {searchLoading && <span className="ml-2 text-sena-600">Buscando...</span>}
              </p>
            </div>
          </div>

          {/* Lista de aprendices */}
          {currentAprendices.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay aprendices</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron aprendices con los filtros aplicados.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-sena-600 hover:bg-sena-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
                >
                  <DocumentArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
                  Importar aprendices
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {currentAprendices.map((aprendiz) => (
                <li key={aprendiz.id_persona} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-sena-100 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-sena-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {aprendiz.nombres} {aprendiz.apellidos}
                          </div>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(getAprendizEstado(aprendiz))}`}>
                            {formatEstado(getAprendizEstado(aprendiz))}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4">
                          <span>{aprendiz.tipo_documento}: {aprendiz.numero_documento}</span>
                          {aprendiz.email && (
                            <span className="flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1" />
                              {aprendiz.email}
                            </span>
                          )}
                          {aprendiz.telefono && (
                            <span className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {aprendiz.telefono}
                            </span>
                          )}
                        </div>
                        {aprendiz.ficha && (
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Ficha:</span> {aprendiz.ficha.numero_ficha} - {aprendiz.ficha.nombre_programa}
                            {aprendiz.ficha.jornada && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {aprendiz.ficha.jornada}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewAprendiz(aprendiz)}
                        className="text-sena-600 hover:text-sena-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNumber = i + 1;
                      const isActive = pageNumber === currentPage;
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isActive
                              ? 'z-10 bg-sena-50 border-sena-500 text-sena-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de importación */}
      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}

      {/* Modal de detalles del aprendiz */}
      {showAprendizDetails && selectedAprendiz && (
        <AprendizDetailsModal
          aprendiz={selectedAprendiz}
          isOpen={showAprendizDetails}
          onClose={() => {
            setShowAprendizDetails(false);
            setSelectedAprendiz(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

// Componente para el modal de detalles del aprendiz
const AprendizDetailsModal: React.FC<{
  aprendiz: Aprendiz;
  isOpen: boolean;
  onClose: () => void;
}> = ({ aprendiz, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getAprendizEstado = (aprendiz: Aprendiz): string => {
    if (aprendiz.estado) return aprendiz.estado;
    if (aprendiz.ficha && aprendiz.email) return 'activo';
    if (!aprendiz.ficha) return 'sin_ficha';
    return 'inactivo';
  };

  const getEstadoColor = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'inactivo': return 'bg-red-100 text-red-800';
      case 'egresado': return 'bg-blue-100 text-blue-800';
      case 'retirado': return 'bg-yellow-100 text-yellow-800';
      case 'sin_ficha': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEstado = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'sin_ficha': return 'Sin Ficha';
      default: return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Detalles del Aprendiz
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Contenido */}
          <div className="mt-6 space-y-6">
            {/* Información personal */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Información Personal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Nombre completo: </span>
                  <span className="text-sm text-gray-900 ml-1 font-medium">
                    {aprendiz.nombres} {aprendiz.apellidos}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Documento: </span>
                  <span className="text-sm text-gray-900 ml-1">
                    {aprendiz.tipo_documento} {aprendiz.numero_documento}
                  </span>
                </div>

                {aprendiz.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Email: </span>
                    <span className="text-sm text-gray-900 ml-1">{aprendiz.email}</span>
                  </div>
                )}

                {aprendiz.telefono && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Teléfono: </span>
                    <span className="text-sm text-gray-900 ml-1">{aprendiz.telefono}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Estado: </span>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(getAprendizEstado(aprendiz))}`}>
                    {formatEstado(getAprendizEstado(aprendiz))}
                  </span>
                </div>
              </div>
            </div>

            {/* Información académica */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Información Académica</h4>
              <div className="space-y-3">
                {aprendiz.ficha ? (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">
                        Ficha {aprendiz.ficha.numero_ficha}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">{aprendiz.ficha.nombre_programa}</p>
                    {aprendiz.ficha.jornada && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                        {aprendiz.ficha.jornada}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">No asignado a ninguna ficha</p>
                  </div>
                )}

                {aprendiz.sede && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Sede: </span>
                    <span className="text-sm text-gray-900 ml-1">{aprendiz.sede.nombre_sede}</span>
                  </div>
                )}

                {aprendiz.centro && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Centro: </span>
                    <span className="text-sm text-gray-900 ml-1">{aprendiz.centro.nombre_centro}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campos adicionales si existen */}
            {(aprendiz.direccion || aprendiz.ciudad || aprendiz.fecha_nacimiento) && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Información Adicional</h4>
                <div className="space-y-2">
                  {aprendiz.direccion && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Dirección: </span>
                      <span className="text-sm text-gray-900 ml-1">{aprendiz.direccion}</span>
                    </div>
                  )}
                  
                  {aprendiz.ciudad && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Ciudad: </span>
                      <span className="text-sm text-gray-900 ml-1">{aprendiz.ciudad}</span>
                    </div>
                  )}
                  
                  {aprendiz.fecha_nacimiento && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Fecha de nacimiento: </span>
                      <span className="text-sm text-gray-900 ml-1">{aprendiz.fecha_nacimiento}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
            >
              Cerrar
            </button>
            <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sena-600 hover:bg-sena-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500">
              Editar Aprendiz
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAprendicesPage;