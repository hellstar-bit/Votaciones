import AdminLayout from '../../components/layout/AdminLayout'

const AdminReportsPage = () => {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Reportes y Estadísticas</h1>
          <p className="text-gray-600 mb-8">Esta funcionalidad estará disponible próximamente.</p>
          
          <div className="bg-white rounded-xl border border-gray-200 p-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📊</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">En Desarrollo</h2>
            <p className="text-gray-500">
              Aquí podrás ver reportes detallados y estadísticas de las elecciones.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminReportsPage