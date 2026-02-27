import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, Edit, UserCog, Upload, X, Camera, CheckCircle, AlertCircle, Users, UserPlus, Phone, CreditCard } from 'lucide-react';
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
            Deseja realmente excluir o profissional <span className="font-semibold text-white">{barberName}</span>?
            <br /> <span className="text-sm font-normal opacity-70">Esta ação removerá permanentemente o acesso e todos os agendamentos vinculados.</span>
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
      // Simulação de verificação - No futuro integrar com Supabase Auth
      // Por enquanto, apenas prossegue para permitir o uso da ferramenta
      setTimeout(() => {
        onConfirm(password);
        setIsLoading(false);
        setPassword('');
      }, 500);
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
  const { isValidTenant } = useTenant();

  // Filtrar barbeiros - mostrar todos os barbeiros da barbearia
  const filteredBarbers = barbers || [];

  // Plan limits hooks
  const { checkAndExecute, clearError: clearPlanError } = usePlanLimits();
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
  const handleImageUpload = async () => {
    if (!selectedImage) return;


    setIsUploadingImage(true);
    setImageUploadSuccess(false);

    try {
      const svgContent = await convertImageToSVG(selectedImage);

      // Simulação de QR code - No futuro integrar com Supabase Storage
      console.log('SVG gerado (simulação):', svgContent.substring(0, 50));
      setImageUploadSuccess(true);

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
          handleImageUpload();
        } else if (isEditMode && selectedUser && selectedUser.email) {
          const username = selectedUser.email;
          if (username.trim()) {
            handleImageUpload();
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
      setError('Email (Usuário) é obrigatório');
      return;
    }

    // Removida validação de senha pois o cadastro é via convite

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Verificar limites do plano antes de criar
      const canCreate = await checkAndExecute('barbers', async () => {
        const newBarber = await createBarber({
          name: formData.name.trim(),
          email: formData.username.trim(),
          // password: formData.password, // Removido
          whatsapp: formData.whatsapp.trim() || undefined,
          pix: formData.pix.trim() || undefined,
          specialties: [], // Default empty
          isActive: true,  // Default true
          workingHours: {  // Default working hours
            monday: [{ start: '09:00', end: '18:00' }],
            tuesday: [{ start: '09:00', end: '18:00' }],
            wednesday: [{ start: '09:00', end: '18:00' }],
            thursday: [{ start: '09:00', end: '18:00' }],
            friday: [{ start: '09:00', end: '18:00' }],
            saturday: [{ start: '09:00', end: '14:00' }],
            sunday: []
          }
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

        toast.success(
          <div>
            <b>Barbeiro cadastrado!</b>
            <p className="text-sm mt-1">Peça para ele se cadastrar no sistema com o email: <u>{formData.username}</u> para acessar o painel.</p>
          </div>,
          {
            duration: 6000,
            style: {
              fontSize: '14px',
              borderRadius: '12px',
              padding: '16px',
              backgroundColor: '#F0FDF4',
              color: '#16A34A',
              border: '1px solid #BBF7D0'
            }
          }
        );
      }
    } catch (err) {
      console.error('Erro ao cadastrar barbeiro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cadastrar barbeiro';
      setError(errorMessage);

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para confirmar edição com senha
  const handleEditConfirmation = async (_password: string) => {
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
      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-primary rounded-full"></div>
            <h1 className="text-3xl font-bold text-white mb-2 ml-2">Gerenciar Barbeiros</h1>
            <p className="text-gray-400 ml-2">Cadastre e gerencie a equipe da sua barbearia</p>
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
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-primary/20 ${canCreateBarber
                ? 'bg-primary text-black hover:bg-primary/90 hover:scale-105 active:scale-95'
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
          <div className="bg-surface/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="text-white font-bold text-lg block">Capacidade da Equipe</span>
                  <span className="text-gray-400 text-sm">Barbeiros ativos: {usage.usage.barbers.current} de {usage.usage.barbers.limit}</span>
                </div>
              </div>
              <div className="text-sm font-medium bg-background-paper/50 px-3 py-1 rounded-lg border border-white/5 text-primary">
                {usage.usage.barbers.limit - usage.usage.barbers.current} vagas restantes
              </div>
            </div>
            <div className="mt-4 w-full bg-background-paper rounded-full h-3 overflow-hidden border border-white/5">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                style={{ width: `${(usage.usage.barbers.current / usage.usage.barbers.limit) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-surface/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {isEditMode ? <Edit className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
                </div>
                {isEditMode ? 'Editar Barbeiro' : 'Cadastrar Novo Barbeiro'}
              </h2>
              <button
                onClick={isEditMode ? handleCancelEdit : () => {
                  resetFormStates();
                  setShowForm(false);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => {
                      // Simple mask for Brazil phone
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 11) value = value.slice(0, 11);
                      if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                      if (value.length > 9) value = `${value.slice(0, 9)}-${value.slice(9)}`;
                      setFormData({ ...formData, whatsapp: value });
                    }}
                    className="w-full p-3.5 bg-background-paper rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all duration-300 border border-white/5 hover:border-primary/30 text-white placeholder-gray-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Chave PIX <span className="text-xs text-gray-500">(Opcional)</span></label>
                  <input
                    type="text"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                    className="w-full p-3.5 bg-background-paper rounded-xl focus:ring-1 focus:ring-primary outline-none transition-all duration-300 border border-white/5 hover:border-primary/30 text-white placeholder-gray-500"
                    placeholder="CPF, Email, Telefone..."
                  />
                </div>
              </div>

              {isEditMode && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-yellow-500 font-medium">
                    <AlertCircle className="w-5 h-5" />
                    <h3>Alterar Senha</h3>
                  </div>
                  <p className="text-xs text-yellow-500/80">Preencha apenas se desejar alterar a senha do barbeiro.</p>

                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3.5 bg-background-paper/50 rounded-xl focus:ring-1 focus:ring-yellow-500 outline-none transition-all duration-300 border border-white/5 hover:border-yellow-500/30 text-white placeholder-gray-500"
                    placeholder="Nova senha (mínimo 6 caracteres)"
                  />
                </div>
              )}

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
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={isEditMode ? handleCancelEdit : () => {
                    resetFormStates();
                    setShowForm(false);
                  }}
                  className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center px-8 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/20 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      <span>{isEditMode ? 'Salvando...' : 'Cadastrando...'}</span>
                    </>
                  ) : (
                    <>
                      {isEditMode ? (
                        <>
                          <Edit className="w-5 h-5 mr-2" />
                          <span>Atualizar Dados</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 mr-2" />
                          <span>Cadastrar Profissional</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barbers Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full"></div>
              <span>Equipe Cadastrada</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="bg-surface border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {filteredBarbers.length} Profissionais
              </span>
            </div>
          </div>

          {filteredBarbers.length === 0 ? (
            <div className="bg-surface/30 rounded-2xl border border-white/5 p-12 text-center">
              <div className="w-20 h-20 bg-background-paper rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Users className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sua equipe está vazia</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">Comece cadastrando o primeiro talento da sua barbearia para iniciar os agendamentos.</p>
              {canCreateBarber && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Cadastrar Primeiro Barbeiro</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbers.map((barber) => (
                <div key={barber.id} className="bg-surface/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1 shadow-lg hover:shadow-xl">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-background-paper to-surface rounded-2xl flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(barber)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(barber);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">{barber.name}</h3>
                    <p className="text-sm text-gray-400 truncate flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                      {barber.email}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    {barber.whatsapp && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> WhatsApp
                        </span>
                        <span className="text-gray-300 font-medium">{barber.whatsapp}</span>
                      </div>
                    )}
                    {barber.pix && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" /> Chave PIX
                        </span>
                        <span className="text-gray-300 font-medium truncate max-w-[120px]" title={barber.pix}>{barber.pix}</span>
                      </div>
                    )}
                    {!barber.whatsapp && !barber.pix && (
                      <p className="text-xs text-center text-gray-600 italic py-1">Sem informações adicionais</p>
                    )}
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


    </StandardLayout>
  );
};

export default RegisterPage;