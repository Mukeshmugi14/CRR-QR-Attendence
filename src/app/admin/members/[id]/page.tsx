import { redirect } from 'next/navigation';

export default async function MemberDetailPage() {
  redirect('/admin/members');
}
