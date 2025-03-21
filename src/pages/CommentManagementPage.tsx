import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check, X, ChevronLeft, ChevronRight, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';

interface Comment {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const CommentManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'approved' | 'rejected' | 'pending'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Estados para os modais de confirmação
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [commentToAction, setCommentToAction] = useState<string | null>(null);
  
  const commentsPerPage = 10;

  // Função para buscar comentários com base no status selecionado
  const fetchComments = async (status: 'pending' | 'approved' | 'rejected') => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(
        `${(import.meta as any).env.VITE_API_URL}/api/comments?status=${status}`,
        {
          method: 'GET',
          headers,
          mode: 'cors'
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar comentários: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setComments(result.data || []);
        setTotalPages(Math.ceil((result.data?.length || 0) / commentsPerPage));
      } else {
        throw new Error(result.message || 'Erro ao buscar comentários');
      }
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      setError('Não foi possível carregar os comentários. Tente novamente mais tarde.');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para carregar comentários quando a tab mudar
  useEffect(() => {
    fetchComments(activeTab);
    setCurrentPage(1); // Reset para a primeira página ao mudar de tab
  }, [activeTab]);

  // Função para iniciar o processo de confirmação
  const initiateCommentAction = (commentId: string, action: 'approve' | 'reject' | 'delete') => {
    setCommentToAction(commentId);
    setConfirmAction(action);
    setConfirmModalOpen(true);
  };

  // Função para lidar com ações nos comentários (aprovar, rejeitar, excluir)
  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject' | 'delete') => {
    if (!commentId) return;
    
    setActionLoading(commentId);
    setActionSuccess(null);
    setActionError(null);
    setConfirmModalOpen(false);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (action === 'delete') {
        // Excluir comentário
        const response = await fetch(
          `${(import.meta as any).env.VITE_API_URL}/api/comments/${commentId}`,
          {
            method: 'DELETE',
            headers,
            mode: 'cors'
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao excluir comentário: ${response.status}`);
        }
      } else {
        // Atualizar status do comentário (aprovar ou rejeitar)
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        
        const response = await fetch(
          `${(import.meta as any).env.VITE_API_URL}/api/comments/${commentId}`,
          {
            method: 'PATCH',
            headers,
            mode: 'cors',
            body: JSON.stringify({ status: newStatus })
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} comentário: ${response.status}`);
        }
      }

      // Atualizar a lista de comentários após a ação
      setActionSuccess(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      // Se não houver mais comentários na página atual e não for a primeira página
      const currentComments = comments.filter(comment => comment.id !== commentId);
      const displayedComments = currentComments.slice(
        (currentPage - 1) * commentsPerPage,
        currentPage * commentsPerPage
      );
      
      if (displayedComments.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      // Atualizar total de páginas
      setTotalPages(Math.ceil((currentComments.length || 0) / commentsPerPage));
      
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
      setActionError(commentId);
    } finally {
      // Limpar estados de ação após um tempo
      setTimeout(() => {
        setActionLoading(null);
        setActionSuccess(null);
        setActionError(null);
      }, 3000);
    }
  };

  // Comentários paginados
  const paginatedComments = comments.slice(
    (currentPage - 1) * commentsPerPage,
    currentPage * commentsPerPage
  );

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

      {/* Padrão de linhas decorativas */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header com navegação */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Gerenciamento de Comentários</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-[#1A1F2E] text-white hover:bg-[#F0B35B] hover:text-black transition-colors duration-300 flex items-center justify-center gap-2 font-medium border border-[#F0B35B]/30 shadow-lg"
            title="Voltar para o Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </motion.button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-400">Gerencie os comentários dos clientes que serão exibidos no seu site.</p>
        </div>

        {/* Tabs para filtrar comentários */}
        <div className="flex border-b border-gray-700/30 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'pending' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>Pendentes</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'approved' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              <span>Aprovados</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'rejected' ? 'text-[#F0B35B] border-b-2 border-[#F0B35B]' : 'text-gray-400 hover:text-white'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <X className="w-5 h-5" />
              <span>Rejeitados</span>
            </div>
          </button>
        </div>

        {/* Lista de comentários */}
        <div className="space-y-4 mb-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-[#F0B35B] animate-spin" />
              <span className="ml-3 text-gray-400">Carregando comentários...</span>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-500/10 text-red-400 rounded-lg text-center">
              {error}
            </div>
          ) : paginatedComments.length === 0 ? (
            <div className="p-6 bg-[#1A1F2E] rounded-lg text-center">
              <p className="text-gray-400">
                {activeTab === 'pending' ? 'Nenhum comentário pendente.' : 
                 activeTab === 'approved' ? 'Nenhum comentário aprovado.' : 
                 'Nenhum comentário rejeitado.'}
              </p>
            </div>
          ) : (
            paginatedComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-[#1A1F2E] p-4 rounded-lg border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium">{comment.name}</h3>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-gray-300 text-sm bg-[#0D121E]/50 p-3 rounded-lg mb-3">
                  {comment.comment}
                </p>
                <div className="flex justify-end gap-2">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => initiateCommentAction(comment.id, 'approve')}
                        disabled={actionLoading === comment.id}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {actionLoading === comment.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Aprovando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Aprovar</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => initiateCommentAction(comment.id, 'reject')}
                        disabled={actionLoading === comment.id}
                        className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {actionLoading === comment.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Rejeitando...</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            <span>Rejeitar</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'rejected' && (
                    <button
                      onClick={() => initiateCommentAction(comment.id, 'approve')}
                      disabled={actionLoading === comment.id}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {actionLoading === comment.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Aprovando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Aprovar</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {activeTab === 'approved' && (
                    <button
                      onClick={() => initiateCommentAction(comment.id, 'reject')}
                      disabled={actionLoading === comment.id}
                      className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {actionLoading === comment.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Rejeitando...</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          <span>Rejeitar</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => initiateCommentAction(comment.id, 'delete')}
                    disabled={actionLoading === comment.id}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {actionLoading === comment.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Excluindo...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full bg-[#1A1F2E] text-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm text-gray-300">
              {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full bg-[#1A1F2E] text-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Próxima página"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Modal de confirmação para ações */}
        <ConfirmationModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={() => {
            if (commentToAction && confirmAction) {
              handleCommentAction(commentToAction, confirmAction);
            }
          }}
          title={confirmAction === 'approve' ? 'Aprovar Comentário' : 
                confirmAction === 'reject' ? 'Rejeitar Comentário' : 'Excluir Comentário'}
          message={confirmAction === 'approve' ? 'Tem certeza que deseja aprovar este comentário? Ele será exibido publicamente no site.' : 
                  confirmAction === 'reject' ? 'Tem certeza que deseja rejeitar este comentário? Ele não será exibido no site.' : 
                  'Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.'}
          confirmButtonText={confirmAction === 'approve' ? 'Aprovar' : 
                           confirmAction === 'reject' ? 'Rejeitar' : 'Excluir'}
          confirmButtonClass={confirmAction === 'approve' ? 'px-4 py-2 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors' : 
                             confirmAction === 'reject' ? 'px-4 py-2 text-sm bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 rounded-lg transition-colors' : 
                             'px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors'}
        />
      </main>
    </div>
  );
};

export default CommentManagementPage;