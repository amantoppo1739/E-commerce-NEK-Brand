import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <p className="text-gray-600">Loading reset page...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

