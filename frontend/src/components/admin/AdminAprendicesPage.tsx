// 📁 frontend/src/pages/admin/AdminAprendicesPage.tsx - VERSIÓN CORREGIDA CON MANEJO SEGURO DE ESTADO
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
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
import { personasApi, fichasApi, handleApiError } from '../../services/api';
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
    // Si tiene estado explícito, usarlo
    if (aprendiz.estado) {
      return aprendiz.estado;
    }
    
    // Si no, inferir el estado basado en otras propiedades
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

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar aprendices cuando cambien los filtros
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadAprendices();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [filters]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [, fichasData] = await Promise.all([
        loadAprendices(),
        fichasApi.getAll()
      ]);
      setFichas(fichasData);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const loadAprendices = async () => {
    setSearchLoading(true);
    try {
      // Preparar filtros para el API
      const apiFilters: any = {};
      if (filters.search.trim()) apiFilters.search = filters.search.trim();
      if (filters.ficha) apiFilters.ficha = filters.ficha;
      if (filters.sede) apiFilters.sede = filters.sede;
      if (filters.centro) apiFilters.centro = filters.centro;
      if (filters.jornada) apiFilters.jornada = filters.jornada;

      const data = await personasApi.getAprendices(apiFilters);
      
      // Aplicar filtros adicionales en frontend si es necesario
      let filteredData = data;
      if (filters.estado) {
        filteredData = data.filter(aprendiz => {
          const estado = getAprendizEstado(aprendiz);
          return estado === filters.estado;
        });
      }

      setAprendices(filteredData);
      setCurrentPage(1); // Reset a primera página al filtrar
      return data;
    } catch (error) {
      console.error('Error cargando aprendices:', error);
      toast.error(handleApiError(error));
      return [];
    } finally {
      setSearchLoading(false);
    }
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
    loadAprendices(); // Recargar lista
    setShowImportModal(false);
  };

  const handleViewAprendiz = (aprendiz: Aprendiz) => {
    setSelectedAprendiz(aprendiz);
    setShowAprendizDetails(true);
  };

  const handleExportAprendices = async () => {
    try {
      toast.loading('Generando exportación...', { id: 'export' });
      
      // Aquí implementarías la exportación
      // Por ahora, simulamos la descarga
      const dataStr = JSON.stringify(aprendices, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aprendices_${new Date().toISOString().split('T')[0]}.json`;
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

  // ✅ ESTADÍSTICAS CORREGIDAS CON MANEJO SEGURO DE ESTADO
  const stats = {
    total: aprendices.length,
    activos: aprendices.filter(a => getAprendizEstado(a) === 'activo').length,
    inactivos: aprendices.filter(a => {
      const estado = getAprendizEstado(a);
      return estado === 'inactivo' || estado === 'sin_ficha';
    }).length,
    fichasUnicas: new Set(aprendices.map(a => a.ficha?.numero_ficha).filter(Boolean)).size,
  };

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
              Exportar
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Importar Excel
            </button>

            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sena-600 hover:bg-sena-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500">
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Nuevo Aprendiz
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Aprendices</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-semibold text-green-600">{stats.activos.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Inactivos</p>
                <p className="text-2xl font-semibold text-red-600">{stats.inactivos.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Fichas Activas</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.fichasUnicas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, documento o email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-sena-500 focus:border-sena-500"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-sena-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón filtros */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500 ${
                  showFilters ? 'bg-gray-50' : ''
                }`}
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filtros
                {showFilters ? (
                  <ChevronUpIcon className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                )}
              </button>

              {/* Contador de filtros activos */}
              {Object.values(filters).some(f => f) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sena-100 text-sena-800">
                  {Object.values(filters).filter(f => f).length} filtro{Object.values(filters).filter(f => f).length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Panel de filtros expandible */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Ficha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ficha
                    </label>
                    <select
                      value={filters.ficha}
                      onChange={(e) => handleFilterChange('ficha', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sena-500 focus:border-sena-500 sm:text-sm"
                    >
                      <option value="">Todas las fichas</option>
                      {fichas.map((ficha) => (
                        <option key={ficha.id_ficha} value={ficha.id_ficha}>
                          {ficha.numero_ficha}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Jornada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jornada
                    </label>
                    <select
                      value={filters.jornada}
                      onChange={(e) => handleFilterChange('jornada', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sena-500 focus:border-sena-500 sm:text-sm"
                    >
                      <option value="">Todas las jornadas</option>
                      <option value="mixta">Mixta</option>
                      <option value="nocturna">Nocturna</option>
                      <option value="madrugada">Madrugada</option>
                    </select>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={filters.estado}
                      onChange={(e) => handleFilterChange('estado', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sena-500 focus:border-sena-500 sm:text-sm"
                    >
                      <option value="">Todos los estados</option>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="egresado">Egresado</option>
                      <option value="retirado">Retirado</option>
                      <option value="sin_ficha">Sin Ficha</option>
                    </select>
                  </div>

                  {/* Centro */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Centro
                    </label>
                    <select
                      value={filters.centro}
                      onChange={(e) => handleFilterChange('centro', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sena-500 focus:border-sena-500 sm:text-sm"
                    >
                      <option value="">Todos los centros</option>
                      <option value="9207">Centro Colombo Alemán</option>
                    </select>
                  </div>

                  {/* Botón limpiar filtros */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sena-500"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabla de aprendices */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aprendiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ficha/Programa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {currentAprendices.map((aprendiz, index) => {
                    // ✅ USAR FUNCIÓN HELPER PARA ESTADO SEGURO
                    const estado = getAprendizEstado(aprendiz);
                    
                    return (
                      <motion.tr
                        key={aprendiz.id_persona}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Aprendiz */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {aprendiz.foto_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={aprendiz.foto_url}
                                  alt={aprendiz.nombreCompleto}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {aprendiz.nombreCompleto}
                              </div>
                              <div className="text-sm text-gray-500">
                                {aprendiz.jornada && (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    aprendiz.jornada === 'mixta' ? 'bg-yellow-100 text-yellow-800' :
                                    aprendiz.jornada === 'nocturna' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {aprendiz.jornada}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Documento */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{aprendiz.numero_documento}</div>
                          <div className="text-sm text-gray-500">{aprendiz.tipo_documento}</div>
                        </td>

                        {/* Contacto */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {aprendiz.email && (
                              <div className="flex items-center mb-1">
                                <EnvelopeIcon className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="truncate max-w-48">{aprendiz.email}</span>
                              </div>
                            )}
                            {aprendiz.telefono && (
                              <div className="flex items-center">
                                <PhoneIcon className="h-3 w-3 text-gray-400 mr-1" />
                                <span>{aprendiz.telefono}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Ficha/Programa */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {aprendiz.ficha ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                Ficha {aprendiz.ficha.numero_ficha}
                              </div>
                              <div className="text-gray-500 truncate max-w-48">
                                {aprendiz.ficha.nombre_programa}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin ficha asignada</span>
                          )}
                        </td>

                        {/* Estado - USANDO FUNCIÓN HELPER */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(estado)}`}>
                            {formatEstado(estado)}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewAprendiz(aprendiz)}
                              className="text-sena-600 hover:text-sena-900 transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Sin resultados */}
          {currentAprendices.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500">
                {searchLoading ? 'Buscando aprendices...' : 'No se encontraron aprendices'}
              </p>
              {Object.values(filters).some(f => f) && !searchLoading && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-sena-600 hover:text-sena-800"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
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
                  Mostrando{' '}
                  <span className="font-medium">{startIndex + 1}</span>
                  {' '}a{' '}
                  <span className="font-medium">{Math.min(endIndex, totalItems)}</span>
                  {' '}de{' '}
                  <span className="font-medium">{totalItems}</span>
                  {' '}resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {/* Botón anterior */}
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronUpIcon className="h-5 w-5 rotate-[-90deg]" />
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-sena-50 border-sena-500 text-sena-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  {/* Botón siguiente */}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronUpIcon className="h-5 w-5 rotate-[90deg]" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Modal de importación */}
        {showImportModal && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImportComplete={handleImportComplete}
          />
        )}

        {/* Modal de detalles de aprendiz */}
        <AnimatePresence>
          {showAprendizDetails && selectedAprendiz && (
            <AprendizDetailsModal
              aprendiz={selectedAprendiz}
              onClose={() => {
                setShowAprendizDetails(false);
                setSelectedAprendiz(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

// Componente modal para detalles de aprendiz - TAMBIÉN CORREGIDO
interface AprendizDetailsModalProps {
  aprendiz: Aprendiz;
  onClose: () => void;
}

const AprendizDetailsModal: React.FC<AprendizDetailsModalProps> = ({ aprendiz, onClose }) => {
  // Función helper para obtener estado seguro también aquí
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

  const formatEstado = (estado: string): string => {
    switch (estado.toLowerCase()) {
      case 'sin_ficha':
        return 'Sin Ficha';
      default:
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
  };

  const estado = getAprendizEstado(aprendiz);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              {aprendiz.foto_url ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={aprendiz.foto_url}
                  alt={aprendiz.nombreCompleto}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-gray-600" />
                </div>
              )}
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {aprendiz.nombreCompleto}
                </h3>
                <p className="text-sm text-gray-500">{aprendiz.numero_documento}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Contenido */}
          <div className="space-y-6">
            {/* Información personal */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Información Personal</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
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
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(estado)}`}>
                    {formatEstado(estado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Información académica */}
            {aprendiz.ficha && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Información Académica</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <AcademicCapIcon className="h-5 w-5 text-sena-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Ficha {aprendiz.ficha.numero_ficha}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {aprendiz.ficha.nombre_programa}
                      </div>
                      {aprendiz.jornada && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          aprendiz.jornada === 'mixta' ? 'bg-yellow-100 text-yellow-800' :
                          aprendiz.jornada === 'nocturna' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Jornada {aprendiz.jornada}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información institucional */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Información Institucional</h4>
              <div className="space-y-2">
                {aprendiz.centro && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Centro: </span>
                    <span className="text-sm text-gray-900 ml-1">{aprendiz.centro.nombre_centro}</span>
                  </div>
                )}
                
                {aprendiz.sede && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Sede: </span>
                    <span className="text-sm text-gray-900 ml-1">{aprendiz.sede.nombre_sede}</span>
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