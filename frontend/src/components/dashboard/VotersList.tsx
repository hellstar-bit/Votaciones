import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { dashboardApi } from '../../services/api';

interface ElectionVoter {
  nombre: string;
  documento: string;
  ha_votado: boolean;
  fecha_voto?: string;
  ip_voto?: string;
  dispositivo_voto?: string;
}

interface VotersListProps {
  electionId: number;
  electionTitle: string;
  refreshKey?: number; // Para forzar actualización cuando llega voto nuevo
}

const VotersList: React.FC<VotersListProps> = ({ electionId, refreshKey }) => {
  const [voters, setVoters] = useState<ElectionVoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'voted' | 'pending'>('all');

  // Cargar votantes
  const loadVoters = async () => {
    try {
      setLoading(true);
      const votersData = await dashboardApi.getElectionVoters(electionId);
      setVoters(votersData);
    } catch (error) {
      console.error('Error cargando votantes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales y cuando cambia la elección
  useEffect(() => {
    if (electionId) {
      loadVoters();
    }
  }, [electionId]);

  // Recargar cuando llega un voto nuevo
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      loadVoters();
    }
  }, [refreshKey]);

  // Filtrar votantes
  const filteredVoters = voters.filter(voter => {
    const matchesSearch = 
      voter.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.documento.includes(searchTerm);

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'voted' && voter.ha_votado) ||
      (filter === 'pending' && !voter.ha_votado);

    return matchesSearch && matchesFilter;
  });

  // Estadísticas
  const votedCount = voters.filter(v => v.ha_votado).length;
  const pendingCount = voters.length - votedCount;
  const participationRate = voters.length > 0 ? (votedCount / voters.length) * 100 : 0;

  // Formatear fecha/hora
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
            Lista de Votantes
          </h3>
          <div className="text-sm text-gray-500">
            {voters.length} habilitados
          </div>
        </div>

        {/* Estadísticas resumidas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-700">{votedCount}</div>
            <div className="text-xs text-green-600">Votaron</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <ClockIcon className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-orange-700">{pendingCount}</div>
            <div className="text-xs text-orange-600">Pendientes</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <EyeIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-700">{participationRate.toFixed(1)}%</div>
            <div className="text-xs text-blue-600">Participación</div>
          </div>
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos ({voters.length})</option>
              <option value="voted">Ya votaron ({votedCount})</option>
              <option value="pending">Pendientes ({pendingCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de votantes */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-500 text-sm">Cargando votantes...</span>
          </div>
        ) : filteredVoters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <UsersIcon className="w-8 h-8 mb-2" />
            <p className="text-sm">
              {searchTerm || filter !== 'all' 
                ? 'No se encontraron votantes con esos filtros'
                : 'No hay votantes registrados'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredVoters.map((voter, index) => (
              <motion.div
                key={voter.documento}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`p-3 hover:bg-gray-50 transition-colors ${
                  voter.ha_votado ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {voter.ha_votado ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <ClockIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {voter.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          Doc: {voter.documento}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {voter.ha_votado ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Votó
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(voter.fecha_voto)}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer con resumen */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Mostrando {filteredVoters.length} de {voters.length}
          </span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Votaron</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Pendientes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotersList;