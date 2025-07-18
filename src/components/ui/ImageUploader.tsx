import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  currentImageUrl, 
  onImageChange,
  label = 'Imagem'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Criar URL temporária para preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Preparar FormData para upload
      const formData = new FormData();
      formData.append('image', file);

      // Simular upload para o servidor (como não temos endpoint específico)
      // Em um caso real, você faria uma requisição para o servidor
      // const response = await fetch('/api/upload', { method: 'POST', body: formData });
      // const data = await response.json();
      
      // Simulando um delay para demonstrar o estado de carregamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aqui estamos apenas passando a URL do objeto local
      // Em um caso real, você usaria a URL retornada pelo servidor
      onImageChange(objectUrl);
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      setError('Ocorreu um erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      <div className="relative">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/*"
          className="hidden" 
        />

        {previewUrl ? (
          <div className="relative w-full h-48 bg-gray-800 rounded-md overflow-hidden group">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={() => {
                setPreviewUrl('https://via.placeholder.com/400x200?text=Imagem+Inválida');
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleTriggerFileInput}
                  className="p-2 bg-[#F0B35B] rounded-full text-black"
                  disabled={isUploading}
                >
                  <Upload size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRemoveImage}
                  className="p-2 bg-red-500 rounded-full text-white"
                  disabled={isUploading}
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#F0B35B] animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTriggerFileInput}
            className="w-full h-48 border-2 border-dashed border-gray-600 rounded-md flex flex-col items-center justify-center space-y-2 hover:border-[#F0B35B] transition-colors duration-300 bg-[#1A1F2E]/50"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-[#F0B35B] animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-400">Clique para fazer upload de uma imagem</p>
                <p className="text-xs text-gray-500">PNG, JPG ou WEBP (máx. 5MB)</p>
              </>
            )}
          </motion.button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default ImageUploader;