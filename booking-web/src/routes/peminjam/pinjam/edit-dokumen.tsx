import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/peminjam/pinjam/edit-dokumen')({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const handleBack = () => {
		navigate({ to: '/peminjam/pinjam/tanda-tangan' });
	};

	return (
		<div className='container mx-auto py-8 px-4 max-w-6xl'>
			<div className='mb-6'>
				<Button variant='ghost' onClick={handleBack} className='mb-4'>
					<ArrowLeft className='h-4 w-4 mr-2' />
					Kembali
				</Button>
				<h1 className='text-3xl font-bold'>Edit Dokumen & Tanda Tangan</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Halaman Masih Dalam Pengembangan</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center'>
						<p className='text-lg text-yellow-800 font-semibold mb-2'>
							🚧 MASIH DALAM PENGEMBANGAN 🚧
						</p>
						<p className='text-yellow-700'>
							Fitur edit dokumen dan penambahan tanda tangan akan segera tersedia.
						</p>
						<p className='text-sm text-yellow-600 mt-4'>
							Di halaman ini nantinya Anda dapat:
						</p>
						<ul className='text-sm text-yellow-600 mt-2 space-y-1'>
							<li>• Mengedit Lembar Pengesahan</li>
							<li>• Mengedit Lembar Executive Summary</li>
							<li>• Menambahkan Tanda Tangan Digital</li>
						</ul>
						<p className='text-sm text-yellow-600 mt-6 font-medium'>
							Setelah menambahkan tanda tangan, kembali ke halaman sebelumnya untuk konfirmasi.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
