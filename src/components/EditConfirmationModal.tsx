import React from 'react';

interface EditConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  barberName: string;
}

const EditConfirmationModal: React.FC<EditConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  barberName 
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 px-4 bg-black/70 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1F2E] p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Editar Barbeiro</h3>
        <p className="text-gray-300 mb-6">
          Você está prestes a editar os dados do barbeiro <span className="font-semibold text-white">{barberName}</span>.
          <br /><br />
          <span className="text-[#F0B35B]">
            Nota: O nome de usuário e senha não serão alterados neste processo.
          </span>
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#F0B35B] text-black rounded hover:bg-[#F0B35B]/90 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

export default EditConfirmationModal;