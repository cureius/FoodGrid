import { redirect } from 'next/navigation';

export default function UserRootRedirect() {
  redirect('/user/outlets');
}
