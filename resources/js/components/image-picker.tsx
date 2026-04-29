import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import axios from 'axios';
import { FolderOpen, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface ImagePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    folder?: string;
    id?: string;
}

export function ImagePicker({ value, onChange, placeholder, folder = 'uploads', id }: ImagePickerProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        setUploading(true);
        try {
            const response = await axios.post('/media/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.path) {
                onChange(response.data.path);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Error al subir la imagen. Por favor intenta de nuevo.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        id={id}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="pr-10"
                    />
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    className="flex-shrink-0 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <Spinner className="h-4 w-4" />
                    ) : (
                        <FolderOpen className="h-4 w-4 text-primary" />
                    )}
                    <span className="hidden sm:inline">Buscar imagen</span>
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>
            {value && !uploading && (
                <div className="relative aspect-video w-full max-w-[120px] overflow-hidden rounded-md border bg-muted shadow-sm">
                    <img
                        src={`/storage/${value}`}
                        alt="Preview"
                        className="h-full w-full object-cover"
                    />
                </div>
            )}
        </div>
    );
}
