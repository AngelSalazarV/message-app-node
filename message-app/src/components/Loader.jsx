export function Loader({ progress }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-gray-700 font-semibold">{progress}%</p>
      <p className="mt-2 text-gray-400">Cargando mensajes y contactos...</p>
    </div>
  );
}