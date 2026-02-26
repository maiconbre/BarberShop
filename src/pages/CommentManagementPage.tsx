import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check, X, ChevronLeft, ChevronRight, Loader2, MessageCircle } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useComments } from '../hooks/useComments';
import { useTenant } from '../contexts/TenantContext';
import type { PublicComment } from '@/types';
import StandardLayout from '../components/layout/StandardLayout';

const CommentManagementPage: React.FC = () => {
  
  // Multi-tenant hooks
  const [activeTab, setActiveTab] = useState<'approved' | 'rejected' | 'pending'>('pending');
  const { 
    comments, 
    loadComments, 
    updateCommentStatus, 
    deleteComment, 
    loading: isLoading, 
    error 
  } = useComments();
  const { isValidTenant } = useTenant();
  
  // Filter comments by active tab - memoized to prevent dependency issues
  const filteredComments = useMemo(() => {
    return comments?.filter(comment => comment.status === activeTab) || [];
  }, [comments, activeTab]);
  
  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Estados para os modais de confirmação
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [commentToAction, setCommentToAction] = useState<string | null>(null);
  
  const commentsPerPage = 10;

  // Efeito para carregar comentários quando a tab mudar
  useEffect(() => {
    const loadCommentsData = async () => {
      if (!isValidTenant) {
        console.warn('CommentManagementPage: Tenant inválido, não carregando comentários');
        return;
      }
      
      try {
        await loadComments();
      } catch (error) {
        console.error('Erro ao carregar comentários:', error);
      }
    };
    
    loadCommentsData();
    setCurrentPage(1); // Reset para a primeira página ao mudar de tab
  }, [activeTab, isValidTenant, loadComments, setCurrentPage]);

  // Memoized total de páginas
  const totalPages = useMemo(() => {
    if (!filteredComments || !Array.isArray(filteredComments)) return 0;
    return Math.max(1, Math.ceil(filteredComments.length / commentsPerPage));
  }, [filteredComments, commentsPerPage]);

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

    try {
      if (action === 'delete') {
        await deleteComment(commentId);
      } else {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        await updateCommentStatus(commentId, newStatus);
      }

      // Verificar se precisa ajustar a página atual
      if (Array.isArray(filteredComments) && filteredComments.length > 0) {
        const remainingComments = filteredComments.filter(comment => comment.id !== commentId);
        const displayedComments = remainingComments.slice(
          (currentPage - 1) * commentsPerPage,
          currentPage * commentsPerPage
        );
        
        if (displayedComments.length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
      
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    } finally {
      // Limpar estado de loading
      setTimeout(() => {
        setActionLoading(null);
      }, 1000);
    }
  };

  // Comentários paginados memoizados
  const paginatedComments = useMemo(() => {
    if (!Array.isArray(filteredComments) || filteredComments.length === 0) return [];
    return filteredComments.slice(
      (currentPage - 1) * commentsPerPage,
      currentPage * commentsPerPage
    );
  }, [filteredComments, currentPage, commentsPerPage]);

  if (!isValidTenant) {
    return (
      <StandardLayout 
        title="Comentários" 
        subtitle="Gerencie os comentários dos clientes que serão exibidos no seu site"
        icon={<MessageCircle className="w-6 h-6" />}
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Contexto de tenant inválido</p>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout 
      title="Comentários" 
      subtitle="Gerencie os comentários dos clientes que serão exibidos no seu site"
      icon={<MessageCircle className="w-6 h-6" />}
    >
      <main className="max-w-7xl mx-auto">
        <div className="mb-6">
          {!isLoading && Array.isArray(comments) && comments.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Dados em cache - Atualizações automáticas a cada 5 minutos</span>
            </div>
          )}
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
              <p>{error?.toString()}</p>
              <button 
                onClick={() => loadComments()}
                className="mt-3 px-4 py-2 bg-[#F0B35B] text-black rounded-lg hover:bg-[#F0B35B]/80 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : paginatedComments.length === 0 ? (
            <div className="p-6 bg-[#1A1F2E] text-center">
              <p className="text-gray-400">
                {activeTab === 'pending' ? 'Nenhum comentário pendente.' : 
                 activeTab === 'approved' ? 'Nenhum comentário aprovado.' : 
                 'Nenhum comentário rejeitado.'}
              </p>
            </div>
          ) : (
            paginatedComments.map((comment: PublicComment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="bg-[#1A1F2E] p-4 border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300"
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
          onConfirm={async () => {
            if (commentToAction && confirmAction) {
              await handleCommentAction(commentToAction, confirmAction);
              setConfirmModalOpen(false);
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
    </StandardLayout>
  );
};

export default CommentManagementPage;