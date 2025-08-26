import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, Edit, UserCog, Upload, X, Camera, Image as ImageIcon, CheckCircle, AlertCircle, Users, Phone, CreditCard, UserPlus, Eye, Crown } from 'lucide-react';
import EditConfirmationModal from '../components/ui/EditConfirmationModal';
import { useBarbers } from '../hooks/useBarbers';
import { useTenant } from '../contexts/TenantContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { usePlan } from '../hooks/usePlan';
import type { Barber } from '../types';
import toast from 'react-hot-toast';
import StandardLayout from '../components/layout/StandardLayout';

// Interfaces para tipagem
interface FormData {
  name: string;
  username: string;
  password: string;
  whatsapp: string;
  pix: string;
}

interface QRCodeUploadResponse {
  message: string;
  filename: string;
}

interface QRCodeFile {
  name: string;
  path: string;
}

interface QRCodeListResponse {
  success: boolean;
  files: QRCodeFile[];
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  barberName: string;
}

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, barberName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252A3A] p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 animate-fadeIn">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-red-500/20 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Confirmar Exclusão</h3>
            <p className="text-gray-400 text-sm">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-gray-300 leading-relaxed">
            Excluir o barbeiro <span className="font-semibold text-white">{barberName}</span>.
            <br /> Você removerá todos agendamentos deste barbeiro.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setModalError('Por favor, insira sua senha');
      return;
    }

    setIsLoading(true);
    try {
      // Verificar a senha do administrador
      // TODO: Implementar verificação de admin com Supabase
      throw new Error('Verificação de admin deve ser implementada com Supabase');
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Senha incorreta');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252A3A] p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-700 animate-fadeIn">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-[#F0B35B]/20 rounded-full">
            <UserCog className="w-6 h-6 text-[#F0B35B]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Confirmar Alterações</h3>
            <p className="text-gray-400 text-sm">Autenticação necessária</p>
          </div>
        </div>

        <div className="bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg p-4 mb-6">
          <p className="text-gray-300">
            Para confirmar as alterações, por favor insira sua senha de administrador.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {modalError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">Senha de Administrador</label>
            <input
              id="confirm-password"
              name="password"
              type="password"
              required
              className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
              placeholder="Digite sua senha de administrador"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setModalError('');
              }}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setModalError('');
                setIsLoading(false);
                onClose();
              }}
              className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center px-5 py-2.5 bg-[#F0B35B] text-black font-medium rounded-lg hover:bg-[#F0B35B]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span>Confirmar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    username: '',
    password: '',
    whatsapp: '',
    pix: ''
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Barber | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Use multi-tenant barber hooks
  const { 
    barbers, 
    loadBarbers, 
    createBarber, 
    updateBarber, 
    deleteBarber, 
    error: barbersError,
  } = useBarbers();
  const { isValidTenant, barbershopData } = useTenant();

  // Filtrar barbeiros - mostrar todos os barbeiros da barbearia
  const filteredBarbers = barbers || [];
  
  // Plan limits hooks
  const { checkAndExecute, lastError: planError, clearError: clearPlanError } = usePlanLimits();
  const { usage, canCreateBarber, refreshUsage } = usePlan();

  // Load barbers and plan usage on component mount
  useEffect(() => {
    if (isValidTenant) {
      loadBarbers();
      refreshUsage();
    }
  }, [loadBarbers, isValidTenant, refreshUsage]);

  // Mostrar erros do hook como toast
  useEffect(() => {
    if (barbersError) {
      toast.error(barbersError.message, {
        style: {
          fontSize: '12px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        }
      });
    }
  }, [barbersError]);

  // Função para converter imagem para SVG
  const convertImageToSVG = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const size = 250;
        const quality = 0.8;
        const format = 'image/png';
        
        canvas.width = size;
        canvas.height = size;

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, size, size);
        }

        const dataURL = canvas.toDataURL(format, quality);
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substr(2, 9);
        
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" data-timestamp="${timestamp}" data-id="${uniqueId}"><image href="${dataURL}" width="${size}" height="${size}"/></svg>`;

        const svgSize = new Blob([svgContent]).size;
        console.log(`SVG gerado - QR Code otimizado, Tamanho: ${size}px, Arquivo: ${(svgSize / 1024).toFixed(1)}KB, ID: ${uniqueId}`);

        resolve(svgContent);
      };

      img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Função para salvar a imagem como SVG
  const handleImageUpload = async (username: string) => {
    if (!selectedImage) return;
    
    const uploadFilename = username && username.trim() 
      ? username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : `temp_${Date.now()}`;

    setIsUploadingImage(true);
    setImageUploadSuccess(false);

    try {
      const svgContent = await convertImageToSVG(selectedImage);

      // TODO: Implementar upload de QR code com Supabase Storage
      throw new Error('Upload deve ser implementado com Supabase Storage');

      // Se estamos em modo de edição, forçar atualização do preview no modal
      if (isEditMode && selectedUser) {
        if (isQRModalOpen) {
          setIsQRModalOpen(false);
          setTimeout(() => {
            setIsQRModalOpen(true);
          }, 100);
        }
      }

      toast.success('QR Code salvo com sucesso!', {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0'
        }
      });
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      setImageUploadSuccess(false);
      toast.error('Erro ao processar a imagem', {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        }
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Função para abrir o seletor de arquivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Função para lidar com a seleção de imagem
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo permitido: 5MB', {
          style: {
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA'
          }
        });
        return;
      }

      // Verificar se é uma imagem válida
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem', {
          style: {
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA'
          }
        });
        return;
      }

      // Verificar se é JPG ou PNG
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error('Apenas arquivos JPG e PNG são aceitos', {
          style: {
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            border: '1px solid #FECACA'
          }
        });
        return;
      }

      setSelectedImage(file);
      setImageUploadSuccess(false);

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const timestamp = Date.now();
        const uniquePreview = `${result}#t=${timestamp}`;
        setImagePreview(uniquePreview);
      };
      reader.readAsDataURL(file);

      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Iniciar upload automático
      setTimeout(() => {
        if (!isEditMode && formData.username && formData.username.trim()) {
          handleImageUpload(formData.username.trim());
        } else if (isEditMode && selectedUser && selectedUser.email) {
          const username = selectedUser.email;
          if (username.trim()) {
            handleImageUpload(username.trim());
          }
        } else if (!isEditMode) {
          toast('Preencha o nome de usuário para iniciar o upload da imagem', {
            style: {
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '12px',
              padding: '16px',
              backgroundColor: '#EFF6FF',
              color: '#3B82F6',
              border: '1px solid #BFDBFE'
            }
          });
        }
      }, 300);
    }
  };

  // Função para remover imagem selecionada
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Função para resetar todos os estados do formulário
  const resetFormStates = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      whatsapp: '',
      pix: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setImageUploadSuccess(false);
    setIsUploadingImage(false);
    setError('');
    setSuccess('');
    setEditSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setTimeout(() => {
      setImagePreview(null);
      setSelectedImage(null);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se estiver em modo de edição, abrir modal de confirmação
    if (isEditMode && selectedUser) {
      setIsPasswordModalOpen(true);
      return;
    }

    // Verificar se o contexto de tenant é válido
    if (!isValidTenant) {
      setError('Contexto de barbearia não encontrado. Por favor, recarregue a página.');
      return;
    }

    // Validações básicas
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!formData.username.trim()) {
      setError('Nome de usuário é obrigatório');
      return;
    }

    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verificar limites do plano antes de criar
      const canCreate = await checkAndExecute('barber', async () => {
        const newBarber = await createBarber({
          name: formData.name.trim(),
          email: formData.username.trim(),
          password: formData.password,
          whatsapp: formData.whatsapp.trim() || undefined,
          pix: formData.pix.trim() || undefined
        });

        return newBarber;
      });

      if (canCreate) {
        setSuccess('Barbeiro cadastrado com sucesso!');
        resetFormStates();
        setShowForm(false);
        
        // Recarregar dados
        await loadBarbers();
        await refreshUsage();

        toast.success('Barbeiro cadastrado com sucesso!', {
          style: {
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: '#F0FDF4',
            color: '#16A34A',
            border: '1px solid #BBF7D0'
          }
        });
      }
    } catch (err) {
      console.error('Erro ao cadastrar barbeiro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cadastrar barbeiro';
      setError(errorMessage);
      
      toast.error(errorMessage, {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para confirmar edição com senha
  const handleEditConfirmation = async (password: string) => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      await updateBarber(selectedUser.id, {
        name: formData.name.trim(),
        email: formData.username.trim(),
        whatsapp: formData.whatsapp.trim() || undefined,
        pix: formData.pix.trim() || undefined,
        ...(formData.password.trim() && { password: formData.password })
      });

      setEditSuccess('Barbeiro atualizado com sucesso!');
      setIsPasswordModalOpen(false);
      resetFormStates();
      setIsEditMode(false);
      setSelectedUser(null);
      setShowForm(false);
      
      // Recarregar dados
      await loadBarbers();

      toast.success('Barbeiro atualizado com sucesso!', {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0'
        }
      });
    } catch (err) {
      console.error('Erro ao atualizar barbeiro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar barbeiro';
      setError(errorMessage);
      
      toast.error(errorMessage, {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para deletar barbeiro
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteBarber(selectedUser.id);
      
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      
      // Recarregar dados
      await loadBarbers();
      await refreshUsage();

      toast.success('Barbeiro excluído com sucesso!', {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0'
        }
      });
    } catch (err) {
      console.error('Erro ao excluir barbeiro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir barbeiro';
      
      toast.error(errorMessage, {
        style: {
          fontSize: '14px',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        }
      });
    }
  };

  // Função para editar barbeiro
  const handleEdit = (barber: Barber) => {
    setSelectedUser(barber);
    setFormData({
      name: barber.name || '',
      username: barber.email || '',
      password: '',
      whatsapp: barber.whatsapp || '',
      pix: barber.pix || ''
    });
    setIsEditMode(true);
    setShowForm(true);
    setError('');
    setSuccess('');
    setEditSuccess('');
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedUser(null);
    resetFormStates();
    setShowForm(false);
  };

  if (!isValidTenant) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Contexto de tenant inválido</p>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Barbeiros</h1>
            <p className="text-gray-400">Cadastre e gerencie os barbeiros da sua barbearia</p>
          </div>
          
          {!showForm && (
            <button
              onClick={() => {
                if (canCreateBarber) {
                  setShowForm(true);
                  clearPlanError();
                } else {
                  toast.error('Limite de barbeiros atingido para seu plano atual', {
                    style: {
                      fontSize: '14px',
                      fontWeight: '600',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      border: '1px solid #FECACA'
                    }
                  });
                }
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                canCreateBarber
                  ? 'bg-[#F0B35B] text-black hover:bg-[#F0B35B]/90'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
              disabled={!canCreateBarber}
            >
              <UserPlus className="w-5 h-5" />
              <span>Novo Barbeiro</span>
            </button>
          )}
        </div>

        {/* Plan Usage Info */}
        {usage && (
          <div className="bg-[#1A1F2E]/50 border border-[#F0B35B]/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-[#F0B35B]" />
                <span className="text-white font-medium">Barbeiros: {usage.barbers.current}/{usage.barbers.limit}</span>
              </div>
              <div className="text-sm text-gray-400">
                {usage.barbers.limit - usage.barbers.current} restantes
              </div>
            </div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[#F0B35B] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(usage.barbers.current / usage.barbers.limit) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252A3A] p-8 rounded-xl shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isEditMode ? 'Editar Barbeiro' : 'Cadastrar Novo Barbeiro'}
              </h2>
              <button
                onClick={isEditMode ? handleCancelEdit : () => {
                  resetFormStates();
                  setShowForm(false);
                }}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
              
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>{success}</span>
                </div>
              )}
              
              {editSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                    placeholder="Digite o nome completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Email/Username *
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="email"
                    required
                    className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                    placeholder="Digite o email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Senha {isEditMode ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required={!isEditMode}
                    className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                    placeholder={isEditMode ? "Nova senha (opcional)" : "Digite a senha"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300 mb-2">
                    WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="pix" className="block text-sm font-medium text-gray-300 mb-2">
                    Chave PIX
                  </label>
                  <input
                    id="pix"
                    name="pix"
                    type="text"
                    className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                    placeholder="Digite a chave PIX"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  />
                </div>
              </div>

              {/* QR Code Upload */}
              <div className="border-t border-gray-600 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-[#F0B35B]" />
                  <span>QR Code PIX (Opcional)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={openFileSelector}
                      className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-[#F0B35B] transition-all duration-200 flex flex-col items-center space-y-3 text-gray-400 hover:text-white"
                    >
                      <div className="p-3 bg-[#F0B35B]/20 rounded-full">
                        <Camera className="w-6 h-6 text-[#F0B35B]" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Selecionar Imagem</p>
                        <p className="text-sm">JPG ou PNG até 5MB</p>
                      </div>
                    </button>
                  </div>
                  
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview do QR Code"
                        className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Processando...</p>
                          </div>
                        </div>
                      )}
                      
                      {imageUploadSuccess && (
                        <div className="absolute top-2 left-2 p-1 bg-green-500 text-white rounded-full">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={isEditMode ? handleCancelEdit : () => {
                    resetFormStates();
                    setShowForm(false);
                  }}
                  className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>Cancelar</span>
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center px-6 py-3 bg-[#F0B35B] text-black font-medium rounded-lg hover:bg-[#F0B35B]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      <span>{isEditMode ? 'Atualizando...' : 'Cadastrando...'}</span>
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Edit className="w-5 h-5 mr-2" />
                          <span>Atualizar</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 mr-2" />
                          <span>Cadastrar</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barbers List */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252A3A] rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <Users className="w-6 h-6 text-[#F0B35B]" />
              <span>Barbeiros Cadastrados</span>
              <span className="text-sm bg-[#F0B35B]/20 text-[#F0B35B] px-3 py-1 rounded-full">
                {filteredBarbers.length}
              </span>
            </h2>
          </div>
          
          {filteredBarbers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-[#F0B35B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-[#F0B35B]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum barbeiro cadastrado</h3>
              <p className="text-gray-400 mb-6">Comece cadastrando o primeiro barbeiro da sua equipe</p>
              {canCreateBarber && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#F0B35B] text-black font-medium rounded-lg hover:bg-[#F0B35B]/90 transition-all duration-200"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Cadastrar Primeiro Barbeiro</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredBarbers.map((barber) => (
                <div key={barber.id} className="p-6 hover:bg-[#1A1F2E]/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#F0B35B]/20 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#F0B35B]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{barber.name}</h3>
                        <p className="text-gray-400">{barber.email}</p>
                        {barber.whatsapp && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">{barber.whatsapp}</span>
                          </div>
                        )}
                        {barber.pix && (
                          <div className="flex items-center space-x-1 mt-1">
                            <CreditCard className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">PIX: {barber.pix}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(barber)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                        title="Editar barbeiro"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedUser(barber);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                        title="Excluir barbeiro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        barberName={selectedUser?.name || ''}
      />

      <PasswordConfirmationModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setIsLoading(false);
        }}
        onConfirm={handleEditConfirmation}
      />

      <EditConfirmationModal
        isOpen={isEditConfirmModalOpen}
        onClose={() => setIsEditConfirmModalOpen(false)}
        onConfirm={() => {
          setIsEditConfirmModalOpen(false);
          // Lógica de confirmação aqui
        }}
        title="Confirmar Edição"
        message="Tem certeza que deseja salvar as alterações?"
      />
    </StandardLayout>
  );
};

export default RegisterPage;