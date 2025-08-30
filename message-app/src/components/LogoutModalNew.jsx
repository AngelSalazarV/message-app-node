function LogoutModal({ active, onClose, onLogout }) {

  if (!active) return null;
    
 
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Cerrar sesión</h2>
        <p className="mb-4">¿Estás seguro de que quieres cerrar sesión?</p>
        <div className="flex justify-center">
          <button className="bg-red-500 text-white px-4 py-2 rounded mr-2 cursor-pointer hover:bg-red-400" onClick={onLogout}>Sí, cerrar sesión</button>
          <button className="bg-gray-300 px-4 py-2 rounded cursor-pointer hover:bg-gray-200" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
  
}

export default LogoutModal;
