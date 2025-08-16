import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, Edit, UserCog, Upload, X, Camera, Image as ImageIcon, CheckCircle, AlertCircle, Users, Phone, CreditCard, UserPlus, Eye } from 'lucide-react';
import EditConfirmationModal from '../components/ui/EditConfirmationModal';
import { useBarbers } from '../hooks/useBarbers';
import { useTenant } from '../contexts/TenantContext';
import type { Barber } from '../types';
import { CURRENT_ENV } from '../config/environmentConfig';
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

// UpdateBarberData interface removed - using Barber interface directly

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
      const response = await fetch(`${CURRENT_ENV.apiUrl}/api/auth/verify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        throw new Error('Senha incorreta');
      }

      onConfirm(password);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Senha incorreta');
      setIsLoading(false); // Importante: parar o loading em caso de erro
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
  // Sempre usar a melhor qualidade possível
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditConfirmModalOpen, setIsEditConfirmModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Barber | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  // Use multi-tenant barber hooks
  const { 
    barbers, 
    loadBarbers, 
    createBarber, 
    updateBarber, 
    deleteBarber, 
    error: barbersError,
  } = useBarbers();
  const {  isValidTenant } = useTenant();



  // Load barbers on component mount
  useEffect(() => {
    if (isValidTenant) {
      loadBarbers();
    }
  }, [loadBarbers, isValidTenant]);
  // Mostrar erros do hook como toast (simplificado)
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
      // Limpar erro após mostrar o toast
      const timeoutId = setTimeout(() => {
        // No need to manually clear error since it will be handled by the hook
        // No-op since we can't clear error directly
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [barbersError]);

  // Função para converter imagem para SVG com máxima qualidade otimizada para mobile
  const convertImageToSVG = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Configuração otimizada para QR Code
        const size = 250; // Tamanho otimizado para QR Code
        const quality = 0.8; // Qualidade balanceada para carregamento rápido
        const format = 'image/png'; // PNG para preservar qualidade
        
        canvas.width = size;
        canvas.height = size;

        // Melhorar a qualidade do redimensionamento
        if (ctx) {
          // Configurar suavização para melhor qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Desenhar a imagem no canvas com melhor qualidade
          ctx.drawImage(img, 0, 0, size, size);
        }

        // Converter para base64 com máxima qualidade
        const dataURL = canvas.toDataURL(format, quality);

        // Adicionar timestamp único para evitar cache
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substr(2, 9);
        
        // Criar SVG com a imagem embutida, timestamp e ID único para evitar cache
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" data-timestamp="${timestamp}" data-id="${uniqueId}"><image href="${dataURL}" width="${size}" height="${size}"/></svg>`;

        // Log do tamanho para debug
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
    
    // Se o nome de usuário estiver vazio, usamos um nome temporário
    const uploadFilename = username && username.trim() 
      ? username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : `temp_${Date.now()}`; // Nome temporário baseado no timestamp atual

    setIsUploadingImage(true);
    setImageUploadSuccess(false);

    try {
      const svgContent = await convertImageToSVG(selectedImage);

      // Enviar SVG para o backend
      const response = await fetch(`${CURRENT_ENV.apiUrl}/api/qr-codes/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadFilename,
          svgContent: svgContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message || 'Erro ao salvar QR Code');
      }

      await response.json() as QRCodeUploadResponse;
      setImageUploadSuccess(true);

      // Se estamos em modo de edição, forçar atualização do preview no modal
      if (isEditMode && selectedUser) {
        // Forçar re-render do modal QR code se estiver aberto
        if (isQRModalOpen) {
          // Fechar e reabrir o modal para forçar atualização
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

      // Criar preview com timestamp único para evitar cache
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Adicionar timestamp único ao preview para forçar atualização
        const timestamp = Date.now();
        const uniquePreview = `${result}#t=${timestamp}`;
        setImagePreview(uniquePreview);
      };
      reader.readAsDataURL(file);

      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Iniciar upload automático
      // Pequeno delay para garantir que o preview seja exibido primeiro
      setTimeout(() => {
        // Se estiver em modo de criação e o nome de usuário já foi preenchido
        if (!isEditMode && formData.username && formData.username.trim()) {
          handleImageUpload(formData.username.trim());
        }
        // Se estiver em modo de edição e temos um usuário selecionado com username
        else if (isEditMode && selectedUser && (selectedUser._backendData?.username || selectedUser.email)) {
          const username = selectedUser._backendData?.username || selectedUser.email;
          if (username.trim()) {
            handleImageUpload(username.trim());
          }
        }
        // Se não tiver nome de usuário, mostrar mensagem para preencher o nome primeiro
        else if (!isEditMode) {
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
    
    // Forçar limpeza completa de cache
    setTimeout(() => {
      setImagePreview(null);
      setSelectedImage(null);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se estiver em modo de edição, abrir modal de confirmação de senha do admin
    if (isEditMode && selectedUser) {
      setIsPasswordModalOpen(true);
      return;
    }

    // Verificar se o contexto de tenant é válido antes de prosseguir
    if (!isValidTenant) {
      setError('Contexto de barbearia não encontrado. Por favor, recarregue a página.');
      return;
    }

    // Caso contrário, continuar com o fluxo normal de criação
    setIsLoading(true);
    setError('');

    try {
      // Validações
      const whatsappRegex = /^\d{10,11}$/;
      let cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');

      // Remove o prefixo 55 se já existir
      if (cleanWhatsapp.startsWith('55')) {
        cleanWhatsapp = cleanWhatsapp.substring(2);
      }

      if (!whatsappRegex.test(cleanWhatsapp)) {
        setError('O número do WhatsApp deve conter entre 10 e 11 dígitos (DDD + número)');
        setIsLoading(false);
        return;
      }

      // Adiciona o prefixo 55 ao WhatsApp
      cleanWhatsapp = '55' + cleanWhatsapp;

      if (formData.pix.trim().length < 3) {
        setError('Por favor, insira uma chave PIX válida');
        setIsLoading(false);
        return;
      }
      
      // Verificar se a imagem foi carregada com sucesso quando uma imagem foi selecionada
      if (selectedImage && !imageUploadSuccess) {
        setError('Aguarde o upload da imagem ser concluído antes de cadastrar');
        setIsLoading(false);
        return;
      }

      // Criar novo barbeiro usando o hook multi-tenant
      // Transform form data to match Barber interface
      const newBarber = {
        name: formData.name.trim(),
        email: formData.username.trim(), // Map username to email field
        phone: cleanWhatsapp,
        specialties: [], // Default empty array
        isActive: true, // Default to active
        workingHours: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        }, // Default empty working hours
        _backendData: {
          whatsapp: cleanWhatsapp,
          pix: formData.pix.trim(),
          username: formData.username.trim(),
          password: formData.password,
          role: 'barber'
        }
      };
      await createBarber(newBarber);

      // Mostrar mensagem de sucesso
      toast.success('Barbeiro cadastrado com sucesso!', {
        style: {
          fontSize: '12px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0'
        }
      });

      // Limpar o formulário
      resetFormStates();
    } catch (err: unknown) {
      console.error('Error during operation:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpdate = async (password: string) => {
    setIsLoading(true);

    try {
      // Validações
      const whatsappRegex = /^\d{10,11}$/;
      let cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');

      // Remove o prefixo 55 se já existir
      if (cleanWhatsapp.startsWith('55')) {
        cleanWhatsapp = cleanWhatsapp.substring(2);
      }

      if (!whatsappRegex.test(cleanWhatsapp)) {
        setError('O número do WhatsApp deve conter entre 10 e 11 dígitos (DDD + número)');
        return;
      }

      // Adiciona o prefixo 55 ao WhatsApp
      cleanWhatsapp = '55' + cleanWhatsapp;

      if (formData.pix.trim().length < 3) {
        setError('Por favor, insira uma chave PIX válida');
        return;
      }

      // Atualizar barbeiro existente usando o hook multi-tenant
      // Transform form data to match Barber interface
      const updateData = {
        name: formData.name.trim(),
        phone: cleanWhatsapp,
        _backendData: {
          whatsapp: cleanWhatsapp,
          pix: formData.pix.trim(),
          password: password // Usar a senha fornecida no modal
        }
      };

      if (!selectedUser?.id) {
        throw new Error('Usuário não selecionado');
      }
      await updateBarber(selectedUser.id, updateData);

      // Processar e salvar a imagem se fornecida durante a edição
      if (selectedImage && (selectedUser._backendData?.username || selectedUser.email)) {
        const username = selectedUser._backendData?.username || selectedUser.email;
        await handleImageUpload(username);
      }

      toast.success('Barbeiro atualizado com sucesso!', {
        style: {
          fontSize: '12px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          backgroundColor: '#F0FDF4',
          color: '#16A34A',
          border: '1px solid #BBF7D0'
        }
      });

      // Reset todos os estados
      setIsEditMode(false);
      setIsPasswordModalOpen(false);
      setSelectedUser(null);
      resetFormStates();

      // A lista será atualizada automaticamente pelo store

    } catch (err: unknown) {
      console.error('Error during operation:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado. Por favor, tente novamente.');
    } finally {
      setIsLoading(false); // Garantir que o loading seja desativado em qualquer cenário
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName } as Barber);
    setIsDeleteModalOpen(true);
  };

  const handleEditUser = async (user: Barber) => {

    // Definir o usuário selecionado para uso no modal
    setSelectedUser(user);

    // Abrir o modal de confirmação primeiro
    setIsEditConfirmModalOpen(true);

    // Limpar mensagens anteriores
    setSuccess('');
    setError('');
    setEditSuccess('');
  };

  const prepareEditForm = async (user: Barber) => {

    // Formatar o número de WhatsApp para exibição (remover o prefixo 55)
    // Get whatsapp from phone field or _backendData
    let displayWhatsapp: string = user.phone || user._backendData?.whatsapp || '';
    if (displayWhatsapp.startsWith('55')) {
      displayWhatsapp = displayWhatsapp.substring(2);
    }

    // Preencher o formulário com os dados do usuário
    setFormData({
      name: user.name,
      username: user._backendData?.username || user.email || '',
      password: '', // Não preencher a senha por segurança
      whatsapp: displayWhatsapp,
      pix: user._backendData?.pix || ''
    });

    // Limpar estados de imagem com força para evitar cache
    setSelectedImage(null);
    setImagePreview(null);
    setImageUploadSuccess(false);
    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Forçar limpeza de cache do preview
    setTimeout(() => {
      setImagePreview(null);
    }, 50);

    // Verificar se existe QR code existente para este barbeiro
    try {
      // Primeiro tentar obter do Supabase Storage
      const response = await fetch(`${CURRENT_ENV.apiUrl}/api/qr-codes/list`);
      if (response.ok) {
        const data: QRCodeListResponse = await response.json();
        if (data.success) {
          // Procurar o QR code do barbeiro na lista
          const userQrCode = data.files.find(
            (file: QRCodeFile) => file.name.toLowerCase() === user?.email?.toLowerCase()
          );
          
          if (userQrCode) {
            // Se encontrou, usar a URL pública do Supabase
            setImagePreview(userQrCode.path);
            setImageUploadSuccess(true);
          }
        }
      }
    } catch {
      // Se não existe ou houve erro, não fazer nada (preview permanece null)
      console.log('QR code não encontrado para o barbeiro:', user.email); // Using email instead of username since it's the correct property
    }

    // Definir o modo de edição
    setIsEditMode(true);

    // Fechar o modal de confirmação
    setIsEditConfirmModalOpen(false);
  };



  return (
    <StandardLayout
      title="Barbeiros"
      subtitle="Cadastre e gerencie os barbeiros da sua barbearia"
      icon={<UserCog className="w-6 h-6" />}
    >
      {/* Cabeçalho moderno - Escondido em mobile e tablet */}
        <div className="hidden lg:block text-center mb-8 animate-fadeIn">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-[#F0B35B]/20 rounded-full">
              <Users className="w-8 h-8 text-[#F0B35B]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Gerenciar Barbeiros</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Cadastre e gerencie os barbeiros da barbearia com facilidade
          </p>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Upload de QR Code</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Interface Responsiva</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Gestão Completa</span>
            </div>
          </div>
        </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedUser?.id) return;

          try {
            await deleteBarber(selectedUser.id);
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
          } catch {
            toast.error('Erro ao excluir barbeiro', {
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
            setSelectedUser(null);
            setIsDeleteModalOpen(false);
          }
        }}
        barberName={selectedUser?.name || ''}
      />

      <EditConfirmationModal
        isOpen={isEditConfirmModalOpen}
        onClose={() => setIsEditConfirmModalOpen(false)}
        onConfirm={async () => {
          if (selectedUser) {
            await prepareEditForm(selectedUser);
          }
          setIsEditConfirmModalOpen(false);
        }}
        barberName={selectedUser?.name || ''}
      />

      <PasswordConfirmationModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handleConfirmUpdate}
      />

      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
        <div className="w-full md:flex-1 animate-slideIn">
          <div className="w-full space-y-6 bg-gradient-to-br from-[#1A1F2E] to-[#252A3A] p-6 sm:p-8 shadow-xl h-fit mx-auto border border-gray-700 card-hover">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-2 bg-[#F0B35B]/20 rounded-lg">
                  {isEditMode ? (
                    <Edit className="w-6 h-6 text-[#F0B35B]" />
                  ) : (
                    <UserPlus className="w-6 h-6 text-[#F0B35B]" />
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {isEditMode ? 'Editar Barbeiro' : 'Cadastro'}
                </h2>
              </div>
              <p className="text-sm text-gray-400">
                {isEditMode ? 'Edite os dados do barbeiro' : 'Cadastre um novo Barbeiro'}
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              {editSuccess && (
                <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm">
                  {editSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label htmlFor="name" className="text-sm font-medium text-gray-300 mb-1">Nome</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors text-base sm:text-sm"
                    placeholder="Digite o nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                {!isEditMode && (
                  <>
                    <div className="flex flex-col">
                <label htmlFor="username" className="text-sm font-medium text-gray-300 mb-1">Usuário</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                  placeholder="Digite o usuário"
                  value={formData.username}
                  onChange={(e) => {
                    const newUsername = e.target.value;
                    setFormData({ ...formData, username: newUsername });
                    
                    // Se já tiver uma imagem selecionada mas ainda não fez upload, iniciar upload quando o usuário digitar o nome
                    if (selectedImage && !imageUploadSuccess && newUsername.trim()) {
                      handleImageUpload(newUsername.trim());
                    }
                  }}
                />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="password" className="text-sm font-medium text-gray-300 mb-1">Senha</label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                        placeholder="Digite a senha"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div className="flex flex-col">
                  <label htmlFor="whatsapp" className="text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="text"
                    required
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                    placeholder="Digite o WhatsApp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="pix" className="text-sm font-medium text-gray-300 mb-1">PIX</label>
                  <input
                    id="pix"
                    name="pix"
                    type="text"
                    required
                    className="block w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-shadow transition-colors sm:text-sm"
                    placeholder="Digite a chave PIX"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                  />
                </div>

                {/* Campo de upload de imagem - Nova UI */}
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">
                      QR Code PIX
                      {isEditMode && (
                        <span className="text-xs text-blue-400 ml-2">
                          {imagePreview && !selectedImage ? '(Existente)' : '(Novo)'}
                        </span>
                      )}
                    </label>
                    {isEditMode && imagePreview && !selectedImage && (
                      <span className="text-xs text-green-400 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        QR Code ativo
                      </span>
                    )}
                  </div>

                  {/* Área de upload moderna */}
                  <div className="relative">
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center bg-gradient-to-br from-[#0D121E] to-[#1A1F2E] hover:border-[#F0B35B] transition-all duration-300">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="p-3 bg-[#F0B35B]/10 rounded-full">
                            <Camera className="w-8 h-8 text-[#F0B35B]" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium mb-1">
                              {isEditMode ? 'Alterar QR Code' : 'Adicionar QR Code'}
                            </h4>
                            <p className="text-sm text-gray-400 mb-3">
                              Imagem do QR Code PIX do barbeiro
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={openFileSelector}
                            disabled={isUploadingImage}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100/10 text-gray-300 text-xs font-medium rounded-md hover:bg-gray-100/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-transition border border-gray-700/50"
                          >
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Processando...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                <span>Selecionar QR</span>
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500">
                            JPG, PNG • Máximo 5MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-[#0D121E] to-[#1A1F2E] rounded-xl p-4 border border-gray-600">
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <img
                              key={`form-preview-${Date.now()}`}
                              src={imagePreview}
                              alt="QR Code Preview"
                              className="w-20 h-20 object-cover rounded-lg border-2 border-gray-600"
                            />
                            {imageUploadSuccess && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-medium truncate">
                                {selectedImage ? selectedImage.name : 'QR Code Atual'}
                              </h4>
                              <button
                                type="button"
                                onClick={removeSelectedImage}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              {selectedImage ? (
                                <>
                                  <p className="text-xs text-gray-400">
                                    {(selectedImage.size / 1024).toFixed(1)} KB • Nova imagem
                                  </p>
                                  {imageUploadSuccess && (
                                    <p className="text-xs text-green-400 flex items-center">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Salvo com sucesso - Pronto para cadastrar
                                    </p>
                                  )}
                                  {selectedImage && !imageUploadSuccess && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-amber-400 flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Aguardando upload para liberar cadastro
                                      </p>
                                      
                                      {/* Informação sobre qualidade automática */}
                                       <div className="space-y-1">
                                         <p className="text-xs text-green-400 flex items-center">
                                           <CheckCircle className="w-3 h-3 mr-1" />
                                           Máxima qualidade (400px, PNG) - Otimizado para mobile
                                         </p>
                                       </div>
                                      
                                      {formData.username && (
                                        <button 
                                          type="button" 
                                          onClick={() => handleImageUpload(formData.username.trim())}
                                          disabled={isUploadingImage || !formData.username.trim()}
                                          className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center space-x-1"
                                        >
                                          <Upload className="w-3 h-3" />
                                          <span>Iniciar upload manualmente</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-gray-400">
                                  Imagem existente do barbeiro
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2 mt-3">
                              <button
                                type="button"
                                onClick={openFileSelector}
                                disabled={isUploadingImage}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-[#F0B35B]/20 text-[#F0B35B] text-xs font-medium rounded-md hover:bg-[#F0B35B]/30 transition-colors disabled:opacity-50"
                              >
                                {isUploadingImage ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ImageIcon className="w-3 h-3" />
                                )}
                                <span>{isUploadingImage ? 'Processando...' : 'Alterar'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-8">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedUser(null);
                      resetFormStates();
                    }}
                    className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar Edição</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || (selectedImage !== null && !imageUploadSuccess)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/90 text-black font-medium rounded-lg hover:from-[#F0B35B]/90 hover:to-[#F0B35B]/80 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-w-[180px] btn-transition"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : isEditMode ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Atualizar Barbeiro</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Cadastrar Barbeiro</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="w-full md:flex-1 order-first animate-slideIn">
          <div className="w-full space-y-6 bg-gradient-to-br from-[#1A1F2E] to-[#252A3A] p-6 sm:p-8 shadow-xl h-fit mx-auto border border-gray-700 card-hover">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Users className="w-6 h-6 mr-2 text-[#F0B35B]" />
                Barbeiros Cadastrados
                <span className="ml-2 px-2 py-1 bg-[#F0B35B]/20 text-[#F0B35B] text-sm rounded-full">
                  {barbers?.length || 0}
                </span>
              </h2>
            </div>



            {barbers?.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gray-700/50 rounded-full">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-lg mb-2">Nenhum barbeiro cadastrado</p>
                    <p className="text-gray-500 text-sm">Comece adicionando seu primeiro barbeiro acima</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-[#0D121E] rounded-lg">
                      <tr>
                        <th scope="col" className="px-6 py-4 rounded-l-lg">Barbeiro</th>
                        <th scope="col" className="px-6 py-4">Contato</th>
                        <th scope="col" className="px-6 py-4">PIX</th>
                        <th scope="col" className="px-6 py-4">QR Code</th>
                        <th scope="col" className="px-6 py-4 rounded-r-lg text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      {barbers?.map((user: Barber) => (
                        <tr key={user.id} className="bg-[#1A1F2E] border border-gray-700 hover:bg-[#252A3A] transition-all duration-200 rounded-lg">
                          <td className="px-6 py-4 rounded-l-lg">
                            <div>
                              <p className="font-medium text-white">{user.name}</p>
                              <p className="text-xs text-gray-400">@{user._backendData?.username || user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-300">{user.phone || user._backendData?.whatsapp}</p>
                          </td>
                          <td className="px-6 py-4">
                          <p className="text-gray-300 font-mono text-xs">{user._backendData?.pix || 'Chave PIX não disponível'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              QR Code Ativo
                            </span>
                          </td>
                          <td className="px-6 py-4 rounded-r-lg">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => {
                                  // Abrindo modal de QR code para o usuário
                                  setSelectedUser(user);
                                  setIsQRModalOpen(true);
                                  // Estado atualizado: modal aberto e usuário selecionado
                                }}
                                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-200"
                                title="Ver QR Code"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                                title="Editar barbeiro"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                                title="Excluir barbeiro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {barbers?.map((user: Barber) => (
                    <div key={user.id} className="bg-[#1A1F2E] border border-gray-700 rounded-xl p-4 hover:bg-[#252A3A] transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-white text-lg">{user.name}</h3>
                          <p className="text-sm text-gray-400">@{user._backendData?.username || user.email}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsQRModalOpen(true);
                            }}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-200"
                            title="Ver QR Code"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                            title="Editar barbeiro"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                            title="Excluir barbeiro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-300">{user.phone || user._backendData?.whatsapp}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-300 font-mono text-xs">{user._backendData?.pix || 'Chave PIX não disponível'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                          <span className="text-green-400">QR Code Ativo</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {/* Modal de QR Code */}
      {isQRModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setIsQRModalOpen(false)}
              className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">QR Code PIX</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  {/* Carregando QR code para o usuário */}
                  {(selectedUser._backendData?.username || selectedUser.email) ? (
                    <div className="flex items-center justify-center h-48">
                      {/* Se estamos em modo de edição e temos um preview, mostrar o preview primeiro */}
                       {isEditMode && imagePreview ? (
                         <img
                           key={`preview-${Date.now()}`}
                           src={imagePreview}
                           alt="QR Code Preview"
                           className="w-48 h-48 mx-auto object-contain"
                         />
                       ) : (
                         <img
                           key={`qr-${selectedUser._backendData?.username || selectedUser.email}-${Date.now()}`}
                           src={`${CURRENT_ENV.apiUrl}/api/qr-codes/download/${(selectedUser._backendData?.username || selectedUser.email).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}?t=${Date.now()}`}
                           alt={`QR Code de ${selectedUser.name}`}
                           className="w-48 h-48 mx-auto object-contain"
                           onError={(e) => {
                             // Tentar caminho local como fallback
                             const imgElement = e.currentTarget;
imgElement.src = `/qr-codes/${selectedUser?.email?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || 'default'}.svg?t=${Date.now()}`;
                             
                             // Adicionar outro handler de erro para o fallback
                             imgElement.onerror = () => {
                               // Se temos uma imagem selecionada, mostrar o preview
                               if (imagePreview) {
                                 imgElement.src = imagePreview;
                                 imgElement.style.display = 'block';
                               } else {
                                 imgElement.style.display = 'none';
                                 const errorDiv = document.createElement('div');
                                 errorDiv.className = 'text-red-500 text-sm py-4';
                                 errorDiv.innerHTML = 'QR Code não disponível';
                                 imgElement.parentNode?.appendChild(errorDiv);
                               }
                             };
                           }}
                         />
                       )}
                    </div>
                   ) : (
                     <div className="flex items-center justify-center h-48">
                       {imagePreview ? (
                         <img
                           key={`modal-preview-${Date.now()}`}
                           src={imagePreview}
                           alt="QR Code Preview"
                           className="w-48 h-48 mx-auto object-contain"
                         />
                       ) : (
                         <div className="text-gray-500 text-sm py-4 bg-gray-100 rounded-lg p-4 w-full">
                           Nenhuma imagem disponível
                         </div>
                       )}
                     </div>
                   )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Barbeiro: <span className="font-medium">{selectedUser.name}</span></p>
                  <p className="text-xs text-gray-500">Escaneie o código ou use a chave PIX</p>
                  <p className="text-sm font-mono text-gray-600">{selectedUser._backendData?.pix || 'Chave PIX não disponível'}</p>
                  

                  
                  <button
                    onClick={() => setIsQRModalOpen(false)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StandardLayout>
  );
};

export default RegisterPage;