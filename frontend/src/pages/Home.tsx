import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';

export function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDeveloper = user?.role === 'DEVELOPER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              StoryForge
            </h1>
            <p className="text-gray-600">Transforma historias en videos</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500">{isDeveloper ? 'Desarrollador' : 'Usuario'}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-200"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Regular Pipeline */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Crear Video</h2>
            <p className="text-gray-600 mb-6">
              Convierte tu historia en un video narrado paso a paso. Desde el guión hasta el resultado final.
            </p>
            <Button
              onClick={() => navigate('/app')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Comenzar Pipeline
            </Button>
          </div>

          {/* Developer Mode */}
          {isDeveloper && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border-2 border-indigo-200">
              <h2 className="text-2xl font-bold text-indigo-900 mb-2">Modo Desarrollador</h2>
              <p className="text-indigo-700 text-sm mb-4 font-semibold">Beta - Acceso exclusivo</p>
              <p className="text-gray-700 mb-6">
                Salta a cualquier etapa del pipeline. Carga contenido directamente sin esperar generaciones. Ideal para testing y desarrollo.
              </p>
              <Button
                onClick={() => navigate('/dev')}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Entrar a Modo Dev
              </Button>
            </div>
          )}
        </div>

        {/* Recent Projects (placeholder) */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Proyectos Recientes</h3>
          <div className="text-center py-8 text-gray-500">
            <p>No hay proyectos recientes. ¡Comienza creando uno!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
