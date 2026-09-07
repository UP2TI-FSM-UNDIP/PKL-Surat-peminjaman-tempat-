import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WordEditorPlaceholderProps {
	roleName: string;
	docType: 'executive-summary' | 'lembar-pengesahan';
	mode: 'preview' | 'sign';
	bookingId?: string;
}

const docLabels: Record<'executive-summary' | 'lembar-pengesahan', string> = {
	'executive-summary': 'Executive Summary',
	'lembar-pengesahan': 'Lembar Pengesahan',
};

export function WordEditorPlaceholder({ roleName, docType, mode, bookingId }: WordEditorPlaceholderProps) {
	return (
		<div className='container mx-auto max-w-4xl space-y-6 px-4 py-8'>
			<div>
				<h1 className='text-3xl font-bold'>Word Editor - {docLabels[docType]}</h1>
				<p className='text-muted-foreground'>Halaman untuk {roleName} ({mode === 'sign' ? 'Tanda Tangan' : 'Preview'})</p>
				{bookingId && <p className='text-sm text-muted-foreground mt-1'>Booking ID: {bookingId}</p>}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Halaman Masih Dalam Pengembangan</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center'>
						<p className='mb-2 text-lg font-semibold text-yellow-800'>🚧 MASIH DALAM PENGEMBANGAN 🚧</p>
						<p className='text-yellow-700'>Fitur pengeditan dokumen dan tanda tangan digital akan segera tersedia.</p>
						<p className='mt-4 text-sm text-yellow-600'>Di halaman ini nantinya Anda dapat:</p>
						<ul className='mt-2 list-disc space-y-1 text-left text-sm text-yellow-600 sm:mx-auto sm:max-w-md'>
							<li>Melihat dan mengunduh dokumen {docLabels[docType]}.</li>
							<li>{mode === 'sign' ? 'Menambahkan tanda tangan digital.' : 'Melihat versi terbaru dokumen.'}</li>
							<li>Memberi catatan atau masukan sebelum finalisasi.</li>
						</ul>
						<p className='mt-6 text-sm font-medium text-yellow-600'>Setelah fitur siap, kembali ke halaman sebelumnya untuk melanjutkan proses.</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
