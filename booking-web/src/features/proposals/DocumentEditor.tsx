import { WordEditorPlaceholder } from '@/components/common/WordEditorPlaceholder';

export type ApprovalDocType = 'executive-summary' | 'lembar-pengesahan';
export type ApprovalModeType = 'preview' | 'sign';

interface DocumentEditorProps {
  bookingId: string;
  docType: ApprovalDocType;
  mode: ApprovalModeType;
  roleName: string;
}

export function DocumentEditor({
  bookingId,
  docType,
  mode,
  roleName,
}: DocumentEditorProps) {
  return (
    <WordEditorPlaceholder
      bookingId={bookingId}
      docType={docType}
      mode={mode}
      roleName={roleName}
    />
  );
}

export { WordEditorPlaceholder };
