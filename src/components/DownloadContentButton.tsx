import { Download, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { downloadContent, downloadMindMap } from '../utils/downloadUtils';

export const DownloadContentButton = ({ title, processingMode, data, mindElixirInstance }: { title: any, processingMode: any, data: any, mindElixirInstance?: any }) => {
  const { t } = useTranslation();

  const handleDownload = (format: any) => {
    if (processingMode === 'mindmap') {
        downloadMindMap(mindElixirInstance, title, format);
    } else {
        downloadContent(title, format, data, processingMode);
    }
  }

  const getExportFormats = () => {
    switch (processingMode) {
      case 'mindmap':
        return [{ key: 'PNG', label: t('download.formats.png') }, { key: 'JSON', label: t('download.formats.json') }];
      case 'quiz':
      case 'flashcard':
        return [
            { key: 'JSON', label: t('download.formats.json') }, 
            { key: 'CSV', label: t('download.formats.csv') },
            { key: 'HTML', label: t('download.formats.html') },
            { key: 'PDF', label: t('download.formats.pdf') }
        ];
      default:
        return [];
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" title={t('download.title')}>
          <Download className="h-4 w-4 mr-1" />
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {getExportFormats().map((format) => (
          <DropdownMenuItem key={format.key} onClick={() => handleDownload(format.key)}>
            {format.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
