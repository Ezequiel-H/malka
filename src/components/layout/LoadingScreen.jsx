/** Pantalla completa de carga: spinner centrado con un mensaje opcional. */
const LoadingScreen = ({ message = 'Cargando...' }) => (
  <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
    <div className="spinner"></div>
    <p className="mt-4 text-gray-600">{message}</p>
  </div>
);

export default LoadingScreen;
