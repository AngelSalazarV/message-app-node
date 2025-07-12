export function ForceLogoutModal({ onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h2 className="text-xl font-bold mb-2">Sesión finalizada</h2>
        <p className="mb-4">
          Tu sesión ha sido cerrada por un cambio en tu cuenta o por desincronización.<br />
          Por favor, vuelve a iniciar sesión para continuar.
        </p>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={onConfirm}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}